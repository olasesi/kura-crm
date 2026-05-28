import { generateSecret, generateURI, verify as verifyOtp } from "otplib";
import qrcode from "qrcode";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { AppError } from "../middleware/errorHandler";
import { AuthService } from "./authService";
import { addAuditLog } from "../config/queue";

const ISSUER = "Kura CRM";

export class MfaService {
  static generateMfaToken(userId: number): string {
    return jwt.sign({ userId, type: "mfa" }, env.JWT_SECRET, {
      expiresIn: env.MFA_TOKEN_EXPIRES_IN,
    } as never);
  }

  static verifyMfaToken(token: string): { userId: number } {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: number; type: string };
    if (decoded.type !== "mfa") {
      throw new AppError("Invalid MFA token.", 401);
    }
    return { userId: decoded.userId };
  }

  static async setup(userId: number): Promise<{ secret: string; uri: string; qrCode: string }> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const secret = generateSecret();
    const uri = generateURI({ secret, label: user.email, issuer: ISSUER });
    const qrCode = await qrcode.toDataURL(uri);

    await user.update({ totpSecret: secret });

    logger.info(`MFA setup initiated for user: ${userId}`);
    addAuditLog({ userId, action: "MFA_SETUP_INIT", resource: "mfa" });

    return { secret, uri, qrCode };
  }

  static async verify(userId: number, code: string): Promise<void> {
    const user = await User.scope("withCredentials").findByPk(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    if (!user.totpSecret) {
      throw new AppError("MFA not initialized. Call setup first.", 400);
    }

    if (user.totpEnabled) {
      throw new AppError("MFA is already enabled.", 400);
    }

    const result = await verifyOtp({ token: code, secret: user.totpSecret });
    if (!result.valid) {
      throw new AppError("Invalid verification code.", 400);
    }

    await user.update({ totpEnabled: true });

    logger.info(`MFA enabled for user: ${userId}`);
    addAuditLog({ userId, action: "MFA_ENABLED", resource: "mfa" });
  }

  static async disable(userId: number, password: string): Promise<void> {
    const user = await User.scope("withCredentials").findByPk(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    if (!user.totpEnabled) {
      throw new AppError("MFA is not enabled.", 400);
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      throw new AppError("Invalid password.", 401);
    }

    await user.update({ totpSecret: null as any, totpEnabled: false });

    logger.info(`MFA disabled for user: ${userId}`);
    addAuditLog({ userId, action: "MFA_DISABLED", resource: "mfa" });
  }

  static async challenge(
    mfaToken: string,
    code: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { userId } = this.verifyMfaToken(mfaToken);

    const user = await User.scope("withCredentials").findByPk(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    if (!user.totpEnabled || !user.totpSecret) {
      throw new AppError("MFA is not enabled for this account.", 400);
    }

    const result = await verifyOtp({ token: code, secret: user.totpSecret });
    if (!result.valid) {
      throw new AppError("Invalid MFA code.", 401);
    }

    const tokens = AuthService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await user.update({
      failedLoginAttempts: 0,
      lockoutUntil: null,
      refreshToken: tokens.refreshToken,
    });

    logger.info(`MFA challenge passed for user: ${userId}`);
    addAuditLog({ userId, action: "MFA_CHALLENGE_PASSED", resource: "mfa" });

    return tokens;
  }
}
