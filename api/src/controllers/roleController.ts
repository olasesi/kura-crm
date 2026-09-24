import { Response, NextFunction } from "express";
import { RoleService } from "../services/roleService";
import { AuthRequest } from "../types";
import { sendSuccess } from "../utils/apiResponse";

export class RoleController {
  static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeOnly = req.query.active === "true";
      const roles = await RoleService.list(activeOnly);
      sendSuccess(res, roles);
    } catch (err) {
      next(err);
    }
  }

  static async catalog(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, RoleService.listCatalog());
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await RoleService.getByRef(req.params.ref as string);
      sendSuccess(res, role);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Not authenticated." });
        return;
      }
      const role = await RoleService.create(req.body, req.user.userId);
      sendSuccess(res, role, "Role created successfully.", undefined, 201);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Not authenticated." });
        return;
      }
      const role = await RoleService.update(req.params.ref as string, req.body, req.user.userId);
      sendSuccess(res, role, "Role updated successfully.");
    } catch (err) {
      next(err);
    }
  }

  static async remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Not authenticated." });
        return;
      }
      await RoleService.remove(req.params.ref as string, req.user.userId);
      sendSuccess(res, null, "Role deleted successfully.");
    } catch (err) {
      next(err);
    }
  }
}