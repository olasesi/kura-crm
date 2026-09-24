import { z } from "zod";
import { Role, RoleInstance } from "../models/Role";
import { User } from "../models/User";
import { AppError } from "../middleware/errorHandler";
import { cacheGet, cacheSet, cacheDel, CACHE_TTL } from "../config/redis";
import { addAuditLog } from "../config/queue";
import { logger } from "../config/logger";
import { WebhookService } from "./webhookService";
import { roleUpdatesTotal } from "../middleware/monitor";
import { PermissionKey, PERMISSION_CATALOG, RoleEntry, UserRole } from "../types";

export const PERMISSION_MODULES: Array<{ module: string; label: string; permissions: readonly PermissionKey[] }> = [
  { module: "users", label: "Users", permissions: PERMISSION_CATALOG.users },
  { module: "roles", label: "Roles & Permissions", permissions: PERMISSION_CATALOG.roles },
  { module: "contacts", label: "Contacts", permissions: PERMISSION_CATALOG.contacts },
  { module: "settings", label: "Settings", permissions: PERMISSION_CATALOG.settings },
  { module: "webhooks", label: "Webhooks", permissions: PERMISSION_CATALOG.webhooks },
  { module: "reports", label: "Reports", permissions: PERMISSION_CATALOG.reports },
  { module: "security", label: "Security", permissions: PERMISSION_CATALOG.security },
  { module: "finance", label: "Finance", permissions: PERMISSION_CATALOG.finance },
  { module: "payroll", label: "Payroll", permissions: PERMISSION_CATALOG.payroll },
  { module: "attendance", label: "Attendance", permissions: PERMISSION_CATALOG.attendance },
  { module: "leave", label: "Leave", permissions: PERMISSION_CATALOG.leave },
  { module: "project", label: "Projects", permissions: PERMISSION_CATALOG.project },
  { module: "task", label: "Tasks", permissions: PERMISSION_CATALOG.task },
];

export const ALL_PERMISSIONS: PermissionKey[] = PERMISSION_MODULES.reduce<PermissionKey[]>(
  (acc, mod) => acc.concat(mod.permissions as PermissionKey[]),
  []
);

export const BUILTIN_ROLES: Array<RoleEntry> = [
  {
    name: UserRole.ADMIN,
    description: "Full administrative access to all modules.",
    permissions: ALL_PERMISSIONS,
    isSystem: true,
    isActive: true,
  },
  {
    name: UserRole.MANAGER,
    description: "Manage teams, contacts, projects, tasks and reports.",
    permissions: [
      "users:read",
      "users:write",
      "contacts:read",
      "contacts:write",
      "contacts:delete",
      "settings:read",
      "webhooks:read",
      "reports:read",
      "reports:write",
      "attendance:read",
      "attendance:write",
      "leave:read",
      "leave:write",
      "project:read",
      "project:write",
      "task:read",
      "task:write",
      "finance:read",
      "payroll:read",
    ],
    isSystem: true,
    isActive: true,
  },
  {
    name: UserRole.USER,
    description: "Standard user with read access on core modules.",
    permissions: ["users:read", "contacts:read", "project:read", "task:read", "reports:read"],
    isSystem: true,
    isActive: true,
  },
];

const isPermission = (p: string): p is PermissionKey =>
  (ALL_PERMISSIONS as string[]).includes(p);

const validatePermissions = (permissions: string[]): PermissionKey[] => {
  const sanitized = Array.from(new Set(permissions.map((p) => p.trim())));
  for (const p of sanitized) {
    if (!isPermission(p)) {
      throw new AppError(`Unknown permission "${p}".`, 400);
    }
  }
  return sanitized as PermissionKey[];
};

const roleNameSchema = z
  .string()
  .min(2, "Role name must be at least 2 characters.")
  .max(50, "Role name must be at most 50 characters.")
  .regex(/^[a-z0-9_\- ]+$/i, "Role name may only contain letters, numbers, spaces, dashes or underscores.");

export const ROLE_SCHEMAS = {
  create: z.object({
    name: roleNameSchema,
    description: z.string().max(1000).default(""),
    permissions: z.array(z.string()).max(200).default([]),
    isActive: z.boolean().default(true),
  }),
  update: z
    .object({
      name: roleNameSchema.optional(),
      description: z.string().max(1000).optional(),
      permissions: z.array(z.string()).max(200).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, "Nothing to update."),
};

const parsePermissions = (raw: string): PermissionKey[] => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PermissionKey[]) : [];
  } catch {
    return [];
  }
};

export class RoleService {
  static fromRow(row: RoleInstance): RoleEntry {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      permissions: parsePermissions(row.permissions),
      isSystem: row.isSystem,
      isActive: row.isActive,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
    };
  }

  static listCatalog(): Array<{ module: string; label: string; permissions: readonly PermissionKey[] }> {
    return PERMISSION_MODULES;
  }

  static async list(activeOnly = false): Promise<RoleEntry[]> {
    const cached = await cacheGet<RoleEntry[]>("roles:all");
    if (cached) {
      return activeOnly ? cached.filter((r) => r.isActive) : cached;
    }

    const rows = await Role.findAll({ order: [["name", "ASC"]] });
    const byName: Record<string, RoleEntry> = {};
    for (const builtin of BUILTIN_ROLES) {
      byName[builtin.name] = builtin;
    }
    for (const row of rows) {
      byName[row.name] = RoleService.fromRow(row);
    }

    const result = Object.values(byName);
    await cacheSet("roles:all", result, CACHE_TTL.MEDIUM);
    return activeOnly ? result.filter((r) => r.isActive) : result;
  }

  static async getByName(name: string): Promise<RoleEntry> {
    const builtin = BUILTIN_ROLES.find((r) => r.name === name);
    if (builtin) return builtin;
    const row = await Role.findOne({ where: { name } });
    if (!row) {
      throw new AppError(`Role "${name}" not found.`, 404);
    }
    return RoleService.fromRow(row);
  }

  static async getByRef(ref: string): Promise<RoleEntry> {
    if (/^\d+$/.test(ref)) {
      const row = await Role.findByPk(parseInt(ref, 10));
      if (!row) {
        throw new AppError("Role not found.", 404);
      }
      return RoleService.fromRow(row);
    }
    return RoleService.getByName(ref);
  }

  static async create(
    data: { name: string; description?: string; permissions?: string[]; isActive?: boolean },
    actorUserId: number
  ): Promise<RoleEntry> {
    const parsed = ROLE_SCHEMAS.create.parse(data);
    if (BUILTIN_ROLES.some((r) => r.name === parsed.name)) {
      throw new AppError(`Role "${parsed.name}" is a system role and cannot be duplicated.`, 409);
    }

    const existing = await Role.findOne({ where: { name: parsed.name } });
    if (existing) {
      throw new AppError(`Role "${parsed.name}" already exists.`, 409);
    }

    const permissions = validatePermissions(parsed.permissions);
    const row = await Role.create({ ...parsed, permissions: JSON.stringify(permissions) } as any);
    await invalidateRoleCaches();

    roleUpdatesTotal.inc({ action: "create" });
    logger.info(`Role created: ${row.name} actor=${actorUserId}`);

    addAuditLog({
      userId: actorUserId,
      action: "role.create",
      resource: `role:${row.name}`,
      details: { permissions },
    });

    WebhookService.dispatch("role.created", { role: row.name, actorUserId, permissions });

    return RoleService.fromRow(row);
  }

  static async update(
    ref: string,
    data: { name?: string; description?: string; permissions?: string[]; isActive?: boolean },
    actorUserId: number
  ): Promise<RoleEntry> {
    const parsed = ROLE_SCHEMAS.update.parse(data);
    const current = await RoleService.getByRef(ref);

    if (current.isSystem) {
      if (parsed.name && parsed.name !== current.name) {
        throw new AppError("System role names cannot be changed.", 403);
      }
      if (parsed.isActive === false) {
        throw new AppError("System roles cannot be deactivated.", 403);
      }
    }

    const permissions = parsed.permissions
      ? validatePermissions(parsed.permissions)
      : current.permissions;

    const nextName = parsed.name || current.name;
    if (nextName !== current.name) {
      const clash = await Role.findOne({ where: { name: nextName } });
      if (clash) {
        throw new AppError(`Role "${nextName}" already exists.`, 409);
      }
    }

    const row = await Role.findOne({ where: { name: current.name } });
    if (row) {
      await row.update({
        ...(parsed.description !== undefined ? { description: parsed.description } : {}),
        ...(parsed.permissions ? { permissions: JSON.stringify(permissions) } : {}),
        ...(parsed.isActive !== undefined ? { isActive: parsed.isActive } : {}),
        ...(nextName !== current.name ? { name: nextName } : {}),
      } as any);
    } else {
      await Role.create({
        name: current.name,
        description: parsed.description ?? current.description,
        permissions: JSON.stringify(permissions),
        isActive: parsed.isActive ?? current.isActive,
        isSystem: current.isSystem,
      } as any);
    }

    await invalidateRoleCaches();
    roleUpdatesTotal.inc({ action: "update" });
    logger.info(`Role updated: ${current.name} actor=${actorUserId}`);

    addAuditLog({
      userId: actorUserId,
      action: "role.update",
      resource: `role:${current.name}`,
      details: { description: parsed.description, permissions, isActive: parsed.isActive },
    });

    WebhookService.dispatch("role.updated", { role: current.name, actorUserId, permissions });

    return {
      ...current,
      name: nextName,
      description: parsed.description ?? current.description,
      permissions,
      isActive: parsed.isActive ?? current.isActive,
    };
  }

  static async remove(ref: string, actorUserId: number): Promise<void> {
    const role = await RoleService.getByRef(ref);
    if (role.isSystem) {
      throw new AppError("System roles cannot be deleted.", 403);
    }

    const row = await Role.findOne({ where: { name: role.name } });
    if (!row) {
      throw new AppError("Role not found.", 404);
    }

    const inUse = await User.count({ where: { roleId: row.id } });
    if (inUse > 0) {
      throw new AppError(`Role "${role.name}" is assigned to ${inUse} user(s) and cannot be deleted.`, 409);
    }

    await row.destroy();
    await invalidateRoleCaches();

    roleUpdatesTotal.inc({ action: "delete" });
    logger.info(`Role deleted: ${role.name} actor=${actorUserId}`);

    addAuditLog({
      userId: actorUserId,
      action: "role.delete",
      resource: `role:${role.name}`,
    });

    WebhookService.dispatch("role.deleted", { role: role.name, actorUserId });
  }

  static async getUserPermissions(userId: number): Promise<PermissionKey[]> {
    const cacheKey = `perms:${userId}`;
    const cached = await cacheGet<PermissionKey[]>(cacheKey);
    if (cached) return cached;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const role = user.roleId
      ? await RoleService.getByRef(String(user.roleId))
      : await RoleService.getByName(user.role);

    const permissions = role ? role.permissions : [];
    await cacheSet(cacheKey, permissions, CACHE_TTL.MEDIUM);
    return permissions;
  }

  static async hasPermission(userId: number, permission: PermissionKey): Promise<boolean> {
    const permissions = await RoleService.getUserPermissions(userId);
    return permissions.includes(permission);
  }
}

const invalidateRoleCaches = async (): Promise<void> => {
  await cacheDel("roles:*");
  await cacheDel("perms:*");
};