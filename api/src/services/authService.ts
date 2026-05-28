import jwt from "jsonwebtoken";
import { User, UserInstance } from "../models/User";
import { env } from "../config/env";
import { JwtPayload, UserRole, LoginResult } from "../types";
import { logger } from "../config/logger";
import { AppError } from "../middleware/errorHandler";
import { validatePassword } from "../security/passwordPolicy";
import { addAuditLog } from "../config/queue";
import { WebhookService } from "./webhookService";
import { MfaService } from "./mfaService";

export class AuthService {
  static generateTokens(payload: JwtPayload): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as never);
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as never);
    return { accessToken, refreshToken };
  }

  static verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  }

  static async register(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    role: UserRole = UserRole.USER
  ): Promise<{ user: Partial<UserInstance>; tokens: { accessToken: string; refreshToken: string } }> {
    validatePassword(password);

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new AppError("Email already registered.", 409);
    }

    const user = await User.create({ firstName, lastName, email, password, role } as any);
    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
    const tokens = this.generateTokens(payload);

    await user.update({ refreshToken: tokens.refreshToken });

    logger.info(`User registered: ${email} (role: ${role})`);

    addAuditLog({ userId: user.id, action: "REGISTER", resource: "user", details: { email, role } });

    WebhookService.dispatch("user.registered", { userId: user.id, email, role });

    const { password: _, refreshToken: __, ...userWithoutSensitive } = user.toJSON();
    return { user: userWithoutSensitive, tokens };
  }

  static async login(
    email: string,
    password: string
  ): Promise<LoginResult> {
    const user = await User.scope("withCredentials").findOne({ where: { email } });
    if (!user) {
      throw new AppError("Invalid email or password.", 401);
    }

    if (!user.isActive) {
      throw new AppError("Account has been deactivated.", 403);
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      throw new AppError(
        `Account temporarily locked. Try again in ${remainingMinutes} minute(s).`,
        429
      );
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updates: Record<string, unknown> = { failedLoginAttempts: attempts };

      if (attempts >= env.MAX_LOGIN_ATTEMPTS) {
        updates.lockoutUntil = new Date(Date.now() + env.LOCKOUT_DURATION_MINUTES * 60000);
        logger.warn(`Account locked due to ${attempts} failed login attempts: ${email}`);
        addAuditLog({
          userId: user.id,
          action: "ACCOUNT_LOCKED",
          resource: "user",
          details: { failedAttempts: attempts, lockoutMinutes: env.LOCKOUT_DURATION_MINUTES },
        });
        WebhookService.dispatch("account.locked", { userId: user.id, email, failedAttempts: attempts });
      }

      WebhookService.dispatch("login.failed", { userId: user.id, email, failedAttempts: attempts });

      await user.update(updates);
      throw new AppError("Invalid email or password.", 401);
    }

    if (user.totpEnabled) {
      const mfaToken = MfaService.generateMfaToken(user.id);
      logger.info(`MFA required for user: ${email}`);
      return { mfaRequired: true, mfaToken };
    }

    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
    const tokens = this.generateTokens(payload);

    await user.update({
      failedLoginAttempts: 0,
      lockoutUntil: null,
      refreshToken: tokens.refreshToken,
    });

    logger.info(`User logged in: ${email}`);

    addAuditLog({ userId: user.id, action: "LOGIN", resource: "user" });

    WebhookService.dispatch("login.success", { userId: user.id, email, role: user.role });

    const { password: _, refreshToken: __, ...userWithoutSensitive } = user.toJSON();
    return { user: userWithoutSensitive, tokens };
  }

  static async refresh(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const decoded = this.verifyRefreshToken(refreshToken);
    const user = await User.scope("withCredentials").findByPk(decoded.userId);

    if (!user || !user.isActive || user.refreshToken !== refreshToken) {
      throw new AppError("Invalid refresh token.", 401);
    }

    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
    const tokens = this.generateTokens(payload);

    await user.update({ refreshToken: tokens.refreshToken });

    logger.info(`Token refreshed for user: ${decoded.userId}`);

    addAuditLog({ userId: user.id, action: "TOKEN_REFRESH", resource: "auth" });

    return tokens;
  }

  static async logout(userId: number): Promise<void> {
    await User.update({ refreshToken: null as any }, { where: { id: userId } });
    logger.info(`User logged out: ${userId}`);
    addAuditLog({ userId, action: "LOGOUT", resource: "user" });
  }

  static async getProfile(userId: number): Promise<UserInstance> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }
    return user;
  }
}
