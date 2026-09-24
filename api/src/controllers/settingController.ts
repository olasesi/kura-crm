import { Response, NextFunction } from "express";
import { SettingService, SETTING_GROUPS } from "../services/settingService";
import { AuthRequest, UserRole } from "../types";
import { sendSuccess, sendError } from "../utils/apiResponse";

export class SettingController {
  static async listGroups(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const groups = SettingService.listGroups();
      sendSuccess(res, groups);
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user?.role === UserRole.ADMIN;
      if (!isAdmin) {
        sendError(res, "Insufficient permissions.", 403);
        return;
      }
      const all = await SettingService.getAllAggregate();
      sendSuccess(res, all);
    } catch (err) {
      next(err);
    }
  }

  static async getGroup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = req.params.group as string;
      const meta = SETTING_GROUPS[group];
      const isAdmin = req.user?.role === UserRole.ADMIN;
      if (meta?.sensitive && !isAdmin) {
        sendError(res, "Insufficient permissions.", 403);
        return;
      }
      const settings = await SettingService.getAll(group);
      const redacted = SettingService.redact(settings, isAdmin, meta);
      sendSuccess(res, redacted);
    } catch (err) {
      next(err);
    }
  }

  static async getMyGroup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = req.params.group as string;
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      const settings = await SettingService.getAll(group, req.user.userId);
      sendSuccess(res, settings);
    } catch (err) {
      next(err);
    }
  }

  static async updateGroup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = req.params.group as string;
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      const settings = await SettingService.update(group, req.body as Record<string, unknown>, req.user.userId);
      const redacted = SettingService.redact(settings, req.user.role === UserRole.ADMIN, SETTING_GROUPS[group]);
      sendSuccess(res, redacted, `Settings for "${group}" updated successfully.`);
    } catch (err) {
      next(err);
    }
  }

  static async updateMyGroup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = req.params.group as string;
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      const scope = SETTING_GROUPS[group];
      if (scope?.scope === "global") {
        sendError(res, `The "${group}" group is company-level and can only be updated by an admin.`, 403);
        return;
      }
      const settings = await SettingService.update(group, req.body as Record<string, unknown>, req.user.userId, req.user.userId);
      sendSuccess(res, settings, `Your "${group}" settings updated successfully.`);
    } catch (err) {
      next(err);
    }
  }

  static async removeKey(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = req.params.group as string;
      const key = req.params.key as string;
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      await SettingService.remove(group, key, req.user.userId);
      sendSuccess(res, null, `Settings key "${group}.${key}" removed.`);
    } catch (err) {
      next(err);
    }
  }

  static async resetGroup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = req.params.group as string;
      if (!req.user) {
        sendError(res, "Not authenticated.", 401);
        return;
      }
      await SettingService.reset(group, req.user.userId);
      sendSuccess(res, null, `Settings for "${group}" reset to defaults.`);
    } catch (err) {
      next(err);
    }
  }
}