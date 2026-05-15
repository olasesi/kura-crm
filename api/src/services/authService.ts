import jwt from "jsonwebtoken";
import { User, UserInstance } from "../models/User";
import { env } from "../config/env";
import { JwtPayload, UserRole } from "../types";
import { logger } from "../config/logger";
import { AppError } from "../middleware/errorHandler";

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
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new AppError("Email already registered.", 409);
    }

    const user = await User.create({ firstName, lastName, email, password, role } as any);
    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
    const tokens = this.generateTokens(payload);

    await user.update({ refreshToken: tokens.refreshToken });

    logger.info(`User registered: ${email} (role: ${role})`);

    const { password: _, refreshToken: __, ...userWithoutSensitive } = user.toJSON();
    return { user: userWithoutSensitive, tokens };
  }

  static async login(
    email: string,
    password: string
  ): Promise<{ user: Partial<UserInstance>; tokens: { accessToken: string; refreshToken: string } }> {
    const user = await User.scope("withCredentials").findOne({ where: { email } });
    if (!user) {
      throw new AppError("Invalid email or password.", 401);
    }

    if (!user.isActive) {
      throw new AppError("Account has been deactivated.", 403);
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      throw new AppError("Invalid email or password.", 401);
    }

    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
    const tokens = this.generateTokens(payload);

    await user.update({ refreshToken: tokens.refreshToken });

    logger.info(`User logged in: ${email}`);

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

    return tokens;
  }

  static async logout(userId: number): Promise<void> {
    await User.update({ refreshToken: null as any }, { where: { id: userId } });
    logger.info(`User logged out: ${userId}`);
  }

  static async getProfile(userId: number): Promise<UserInstance> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }
    return user;
  }
}
