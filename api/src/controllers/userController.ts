import { Response, NextFunction } from "express";
import { UserService } from "../services/userService";
import { AuthRequest } from "../types";
import { sendSuccess, sendError, sendPaginated } from "../utils/apiResponse";

export class UserController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { rows, count } = await UserService.findAll(page, limit);
      sendPaginated(res, rows, count, page, limit);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const user = await UserService.findById(id);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const user = await UserService.update(id, req.body);
      sendSuccess(res, user, "User updated successfully.");
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      await UserService.delete(id, req.user.userId);
      sendSuccess(res, null, "User deleted successfully.");
    } catch (err) {
      next(err);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      const user = await UserService.createUser(req.body, req.user.userId);
      sendSuccess(res, user, "User created successfully.", undefined, 201);
    } catch (err) {
      next(err);
    }
  }

  static async setActive(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      const id = parseInt(req.params.id as string, 10);
      const isActive = req.body.isActive === true;
      const user = await UserService.setActive(id, isActive, req.user.userId);
      sendSuccess(res, user, isActive ? "User activated." : "User deactivated.");
    } catch (err) {
      next(err);
    }
  }

  static async assignRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      const id = parseInt(req.params.id as string, 10);
      const roleRef = (req.body.role || req.body.roleName || req.params.role) as string;
      if (!roleRef) {
        sendError(res, "role is required.", 400);
        return;
      }
      const user = await UserService.assignRole(id, roleRef, req.user.userId);
      sendSuccess(res, user, "User role updated.");
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      const id = parseInt(req.params.id as string, 10);
      const { newPassword } = req.body;
      await UserService.resetPassword(id, newPassword, req.user.userId);
      sendSuccess(res, null, "User password reset.");
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      const { currentPassword, newPassword } = req.body;
      await UserService.changePassword(req.user.userId, currentPassword, newPassword);
      sendSuccess(res, null, "Password changed successfully.");
    } catch (err) {
      next(err);
    }
  }
}
