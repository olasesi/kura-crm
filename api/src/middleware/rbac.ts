import { Response, NextFunction } from "express";
import { RoleService } from "../services/roleService";
import { AuthRequest, PermissionKey } from "../types";
import { sendError } from "../utils/apiResponse";

export const requirePermission = (permission: PermissionKey) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, "Authentication required.", 401);
        return;
      }
      const granted = await RoleService.hasPermission(req.user.userId, permission);
      if (!granted) {
        sendError(res, "Insufficient permissions.", 403);
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};