import { Response, NextFunction } from "express";
import { AuthService } from "../services/authService";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/apiResponse";

export class AuthController {
  static async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { firstName, lastName, email, password, role } = req.body;
      const result = await AuthService.register(firstName, lastName, email, password, role);
      sendSuccess(res, result, "Registration successful.", undefined, 201);
    } catch (err) {
      next(err);
    }
  }

  static async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      sendSuccess(res, result, "Login successful.");
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        sendError(res, "Refresh token is required.", 400);
        return;
      }
      const tokens = await AuthService.refresh(refreshToken);
      sendSuccess(res, tokens, "Token refreshed successfully.");
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      await AuthService.logout(req.user.userId);
      sendSuccess(res, null, "Logged out successfully.");
    } catch (err) {
      next(err);
    }
  }

  static async profile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      const user = await AuthService.getProfile(req.user.userId);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }
}
