import { Response, NextFunction } from "express";
import { MfaService } from "../services/mfaService";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/apiResponse";

export class MfaController {
  static async setup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      const result = await MfaService.setup(req.user.userId);
      sendSuccess(res, result, "MFA setup initiated. Scan the QR code with your authenticator app.");
    } catch (err) {
      next(err);
    }
  }

  static async verify(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      const { code } = req.body;
      if (!code) {
        sendError(res, "Verification code is required.", 400);
        return;
      }
      await MfaService.verify(req.user.userId, code);
      sendSuccess(res, null, "MFA enabled successfully.");
    } catch (err) {
      next(err);
    }
  }

  static async disable(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      const { password } = req.body;
      if (!password) {
        sendError(res, "Password is required to disable MFA.", 400);
        return;
      }
      await MfaService.disable(req.user.userId, password);
      sendSuccess(res, null, "MFA disabled successfully.");
    } catch (err) {
      next(err);
    }
  }

  static async challenge(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mfaToken, code } = req.body;
      if (!mfaToken || !code) {
        sendError(res, "MFA token and verification code are required.", 400);
        return;
      }
      const tokens = await MfaService.challenge(mfaToken, code);
      sendSuccess(res, tokens, "MFA verification successful.");
    } catch (err) {
      next(err);
    }
  }
}
