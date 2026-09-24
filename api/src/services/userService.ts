import { randomBytes } from "crypto";
import { User, UserInstance } from "../models/User";
import { UserRole } from "../types";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../config/logger";
import { WebhookService } from "./webhookService";
import { RoleService } from "./roleService";
import { addAuditLog } from "../config/queue";
import { cacheDel } from "../config/redis";
import { userManagementTotal, userRoleChangesTotal } from "../middleware/monitor";

export class UserService {
  static async findAll(
    page: number,
    limit: number
  ): Promise<{ rows: UserInstance[]; count: number }> {
    const offset = (page - 1) * limit;
    const result = await User.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });
    return result;
  }

  static async findById(id: number): Promise<UserInstance> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError("User not found.", 404);
    }
    return user;
  }

  static async update(
    id: number,
    data: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      role: UserRole;
      isActive: boolean;
    }>
  ): Promise<UserInstance> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    if (data.email && data.email !== user.email) {
      const existing = await User.findOne({ where: { email: data.email } });
      if (existing) {
        throw new AppError("Email already in use.", 409);
      }
    }

    if (data.role && data.role !== user.role) {
      const role = await RoleService.getByName(data.role);
      if (!role.isActive) {
        throw new AppError(`Role "${role.name}" is inactive.`, 409);
      }
      if (user.role === UserRole.ADMIN) {
        await UserService.ensureAnotherActiveAdmin();
      }
    }

    if (data.isActive === false && user.role === UserRole.ADMIN) {
      await UserService.ensureAnotherActiveAdmin();
    }

    await user.update(data);
    await cacheDel("perms:*");
    userManagementTotal.inc({ action: "user.updated" });
    logger.info(`User updated: ${id}`);
    return user;
  }

  static async delete(id: number, actorUserId: number): Promise<void> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError("User not found.", 404);
    }
    if (id === actorUserId) {
      throw new AppError("You cannot delete your own account.", 409);
    }
    if (user.role === UserRole.ADMIN) {
      await UserService.ensureAnotherActiveAdmin();
    }
    await user.destroy();
    await cacheDel("perms:*");
    userManagementTotal.inc({ action: "user.deleted" });
    addAuditLog({
      userId: actorUserId,
      action: "user.delete",
      resource: `user:${id}`,
      details: { email: user.email, role: user.role },
    });
    WebhookService.dispatch("user.deleted", { userId: id, email: user.email, actorUserId });
    logger.info(`User deleted: ${id}`);
  }

  static async createUser(
    data: {
      firstName: string;
      lastName: string;
      email: string;
      password?: string;
      role?: string;
      roleName?: string;
    },
    actorUserId: number
  ): Promise<UserInstance> {
    const firstName = data.firstName?.trim();
    const lastName = data.lastName?.trim();
    const email = data.email?.trim().toLowerCase();
    if (!firstName || !lastName || !email) {
      throw new AppError("firstName, lastName and email are required.", 400);
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new AppError("Email already in use.", 409);
    }

    let targetRole: UserRole = UserRole.USER;
    let targetRoleId: number | null = null;
    const roleRef = data.roleName || data.role;
    if (roleRef) {
      const role = await RoleService.getByRef(roleRef);
      if (!role.isActive) {
        throw new AppError(`Role "${role.name}" is inactive.`, 409);
      }
      const isEnumRole = (Object.values(UserRole) as string[]).includes(role.name);
      targetRole = isEnumRole ? (role.name as UserRole) : UserRole.USER;
      targetRoleId = isEnumRole ? null : (role.id ?? null);
    }

    const password = data.password && data.password.length >= 8 ? data.password : randomBytes(16).toString("hex");

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: targetRole,
      roleId: targetRoleId,
      isActive: true,
    } as any);
    await cacheDel("perms:*");

    userManagementTotal.inc({ action: "user.created" });
    addAuditLog({
      userId: actorUserId,
      action: "user.create",
      resource: `user:${user.id}`,
      details: { email, role: targetRole, roleId: targetRoleId },
    });
    WebhookService.dispatch("user.created", { userId: user.id, email, role: targetRole, actorUserId });
    logger.info(`User created by admin: ${user.id}`);
    return user;
  }

  static async setActive(id: number, isActive: boolean, actorUserId: number): Promise<UserInstance> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError("User not found.", 404);
    }
    if (id === actorUserId && !isActive) {
      throw new AppError("You cannot deactivate your own account.", 409);
    }
    if (!isActive && user.role === UserRole.ADMIN) {
      await UserService.ensureAnotherActiveAdmin();
    }

    await user.update({ isActive });
    await cacheDel("perms:*");
    userManagementTotal.inc({ action: isActive ? "user.activated" : "user.deactivated" });
    addAuditLog({
      userId: actorUserId,
      action: isActive ? "user.activate" : "user.deactivate",
      resource: `user:${id}`,
    });
    WebhookService.dispatch("user.updated", { userId: id, isActive, actorUserId });
    logger.info(`User ${isActive ? "activated" : "deactivated"}: ${id}`);
    return user;
  }

  static async assignRole(id: number, roleRef: string, actorUserId: number): Promise<UserInstance> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError("User not found.", 404);
    }
    const role = await RoleService.getByRef(roleRef);
    if (!role.isActive) {
      throw new AppError(`Role "${role.name}" is inactive.`, 409);
    }

    const from = user.role;
    if (user.role === UserRole.ADMIN) {
      await UserService.ensureAnotherActiveAdmin();
    }

    const isEnumRole = (Object.values(UserRole) as string[]).includes(role.name);
    const nextRole = isEnumRole ? (role.name as UserRole) : UserRole.USER;
    const nextRoleId = isEnumRole ? null : (role.id ?? null);

    await user.update({ role: nextRole, roleId: nextRoleId } as any);
    await cacheDel("perms:*");
    userRoleChangesTotal.inc({ role: role.name });
    addAuditLog({
      userId: actorUserId,
      action: "user.role.change",
      resource: `user:${id}`,
      details: { from, to: role.name },
    });
    WebhookService.dispatch("user.role_changed", { userId: id, from, to: role.name, actorUserId });
    logger.info(`Role change: user=${id} ${from} -> ${role.name}`);
    return user;
  }

  static async resetPassword(id: number, newPassword: string, actorUserId: number): Promise<void> {
    if (!newPassword || newPassword.length < 8) {
      throw new AppError("New password must be at least 8 characters.", 400);
    }
    const user = await User.scope("withCredentials").findByPk(id);
    if (!user) {
      throw new AppError("User not found.", 404);
    }
    user.password = newPassword;
    await user.update({ refreshToken: null } as any);
    await cacheDel("perms:*");
    userManagementTotal.inc({ action: "password.reset" });
    addAuditLog({
      userId: actorUserId,
      action: "user.password.reset",
      resource: `user:${id}`,
    });
    WebhookService.dispatch("user.updated", { userId: id, action: "password_reset", actorUserId });
    logger.info(`Password reset: ${id}`);
  }

  static async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.scope("withCredentials").findByPk(id);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const isValid = await user.validatePassword(currentPassword);
    if (!isValid) {
      throw new AppError("Current password is incorrect.", 401);
    }

    user.password = newPassword;
    await user.save();
    logger.info(`Password changed for user: ${id}`);
  }

  private static async ensureAnotherActiveAdmin(): Promise<void> {
    const admins = await User.count({ where: { role: UserRole.ADMIN, isActive: true } });
    if (admins <= 1) {
      throw new AppError("Cannot remove, deactivate or demote the last active admin.", 409);
    }
  }
}