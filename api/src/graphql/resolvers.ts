import { AuthService } from "../services/authService";
import { UserService } from "../services/userService";
import { MfaService } from "../services/mfaService";
import { WebhookService } from "../services/webhookService";
import { SettingService, SETTING_GROUPS } from "../services/settingService";
import { RoleService } from "../services/roleService";
import { Contact } from "../models/Contact";
import { User } from "../models/User";
import { Webhook } from "../models/Webhook";
import { JwtPayload, UserRole } from "../types";
import { verifyRecaptcha } from "../security/recaptcha";
import { logger } from "../config/logger";

interface Context {
  user?: JwtPayload;
}

const serializeValue = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};

const deserializeValue = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

export const resolvers = {
  LoginResult: {
    __resolveType(obj: Record<string, unknown>) {
      if (obj.mfaRequired) return "MfaRequired";
      return "AuthPayload";
    },
  },

  Query: {
    me: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      return AuthService.getProfile(context.user.userId);
    },
    user: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      return UserService.findById(parseInt(id));
    },
    users: async (_: unknown, { page = 1, limit = 20 }: { page?: number; limit?: number }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      const result = await UserService.findAll(page, limit);
      return {
        data: result.rows,
        total: result.count,
        page,
        totalPages: Math.ceil(result.count / limit),
      };
    },
    contact: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      return Contact.findByPk(parseInt(id), {
        include: [{ association: "creator", attributes: ["id", "firstName", "lastName", "email"] }],
      });
    },
    contacts: async (_: unknown, { page = 1, limit = 20 }: { page?: number; limit?: number }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      const offset = (page - 1) * limit;
      const { rows, count } = await Contact.findAndCountAll({
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        include: [{ association: "creator", attributes: ["id", "firstName", "lastName", "email"] }],
      });
      return {
        data: rows,
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
      };
    },
    webhooks: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      return WebhookService.list(context.user.userId);
    },
    settingGroups: async () => {
      return SettingService.listGroups();
    },
    settings: async (_: unknown, { group }: { group: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      const isAdmin = context.user.role === UserRole.ADMIN;
      const meta = SETTING_GROUPS[group];
      if (meta?.sensitive && !isAdmin) throw new Error("Insufficient permissions");
      const settings = await SettingService.getAll(group);
      const redacted = SettingService.redact(settings, isAdmin, meta);
      return SettingService.toEntries(redacted).map((e) => ({ key: e.key, value: serializeValue(e.value) }));
    },
    mySettings: async (_: unknown, { group }: { group: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      const settings = await SettingService.getAll(group, context.user.userId);
      return SettingService.toEntries(settings).map((e) => ({ key: e.key, value: serializeValue(e.value) }));
    },
    roles: async (_: unknown, { page = 1, limit = 20 }: { page?: number; limit?: number }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      if (context.user.role !== UserRole.ADMIN && context.user.role !== UserRole.MANAGER) {
        throw new Error("Insufficient permissions");
      }
      const all = await RoleService.list();
      return {
        data: all.slice((page - 1) * limit, page * limit),
        total: all.length,
        page,
        totalPages: Math.ceil(all.length / limit),
      };
    },
    role: async (_: unknown, { ref }: { ref: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      if (context.user.role !== UserRole.ADMIN && context.user.role !== UserRole.MANAGER) {
        throw new Error("Insufficient permissions");
      }
      return RoleService.getByRef(ref);
    },
    permissionCatalog: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      return RoleService.listCatalog();
    },
  },

  Mutation: {
    register: async (_: unknown, args: { firstName: string; lastName: string; email: string; password: string; recaptchaToken?: string }) => {
      if (args.recaptchaToken) {
        await verifyRecaptcha(args.recaptchaToken);
      }
      const result = await AuthService.register(args.firstName, args.lastName, args.email, args.password);
      logger.info(`GraphQL: User registered ${args.email}`);
      return { user: result.user, accessToken: result.tokens.accessToken, refreshToken: result.tokens.refreshToken };
    },

    login: async (_: unknown, args: { email: string; password: string; recaptchaToken?: string }) => {
      if (args.recaptchaToken) {
        await verifyRecaptcha(args.recaptchaToken);
      }
      const result = await AuthService.login(args.email, args.password);
      if (result.mfaRequired) {
        logger.info(`GraphQL: MFA required for ${args.email}`);
        return { __typename: "MfaRequired", mfaRequired: true, mfaToken: result.mfaToken };
      }
      logger.info(`GraphQL: User logged in ${args.email}`);
      return { __typename: "AuthPayload", user: result.user, accessToken: result.tokens?.accessToken, refreshToken: result.tokens?.refreshToken };
    },

    refreshToken: async (_: unknown, { token }: { token: string }) => {
      const tokens = await AuthService.refresh(token);
      return { user: null, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
    },

    logout: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      await AuthService.logout(context.user.userId);
      return true;
    },

    mfaSetup: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      return MfaService.setup(context.user.userId);
    },

    mfaVerify: async (_: unknown, { code }: { code: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      await MfaService.verify(context.user.userId, code);
      return true;
    },

    mfaDisable: async (_: unknown, { password }: { password: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      await MfaService.disable(context.user.userId, password);
      return true;
    },

    mfaChallenge: async (_: unknown, { mfaToken, code }: { mfaToken: string; code: string }) => {
      const tokens = await MfaService.challenge(mfaToken, code);
      return tokens;
    },

    createContact: async (_: unknown, args: { firstName: string; lastName: string; email: string; phone?: string; company?: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      const contact = await Contact.create({ ...args, createdBy: context.user.userId } as any);
      WebhookService.dispatch("contact.created", { contactId: contact.id, email: contact.email, createdBy: context.user.userId });
      return contact;
    },

    updateContact: async (_parent: unknown, args: { id: string; firstName?: string; lastName?: string; email?: string; phone?: string; company?: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      const id = parseInt(args.id);
      const { id: _id, ...updateData } = args;
      const [updated] = await Contact.update(updateData, { where: { id } });
      if (!updated) throw new Error("Contact not found");
      const contact = await Contact.findByPk(id);
      WebhookService.dispatch("contact.updated", { contactId: id, email: contact?.email });
      return contact;
    },

    deleteContact: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      const contact = await Contact.findByPk(parseInt(id));
      if (!contact) throw new Error("Contact not found");
      await contact.destroy();
      WebhookService.dispatch("contact.deleted", { contactId: contact.id, email: contact.email });
      return true;
    },

    updateUser: async (_: unknown, { id, ...data }: { id: string; firstName?: string; lastName?: string; email?: string; role?: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      if (context.user.role !== UserRole.ADMIN) throw new Error("Insufficient permissions");
      await UserService.update(parseInt(id), data as any);
      return UserService.findById(parseInt(id));
    },

    adminCreateUser: async (_: unknown, args: { firstName: string; lastName: string; email: string; role?: string; roleName?: string; password?: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      if (context.user.role !== UserRole.ADMIN) throw new Error("Insufficient permissions");
      return UserService.createUser(args, context.user.userId);
    },

    setUserActive: async (_: unknown, { id, isActive }: { id: string; isActive: boolean }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      if (context.user.role !== UserRole.ADMIN) throw new Error("Insufficient permissions");
      return UserService.setActive(parseInt(id), isActive, context.user.userId);
    },

    assignUserRole: async (_: unknown, { id, role }: { id: string; role: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      if (context.user.role !== UserRole.ADMIN) throw new Error("Insufficient permissions");
      return UserService.assignRole(parseInt(id), role, context.user.userId);
    },

    resetUserPassword: async (_: unknown, { id, newPassword }: { id: string; newPassword: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      if (context.user.role !== UserRole.ADMIN) throw new Error("Insufficient permissions");
      await UserService.resetPassword(parseInt(id), newPassword, context.user.userId);
      return true;
    },

    deleteUser: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      if (context.user.role !== UserRole.ADMIN) throw new Error("Insufficient permissions");
      await UserService.delete(parseInt(id), context.user.userId);
      return true;
    },

    changePassword: async (_: unknown, { currentPassword, newPassword }: { currentPassword: string; newPassword: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      await UserService.changePassword(context.user.userId, currentPassword, newPassword);
      return true;
    },

    webhookSubscribe: async (_: unknown, args: { url: string; events: string[]; secret?: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      return WebhookService.subscribe(context.user.userId, args.url, args.events as any, args.secret);
    },

    webhookUnsubscribe: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      await WebhookService.unsubscribe(context.user.userId, parseInt(id));
      return true;
    },

    webhookUpdate: async (_: unknown, args: { id: string; url?: string; events?: string[]; enabled?: boolean }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      return WebhookService.update(context.user.userId, parseInt(args.id), args as any);
    },

    updateSettings: async (_: unknown, args: { group: string; input: Array<{ key: string; value: string }> }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      if (context.user.role !== UserRole.ADMIN) throw new Error("Insufficient permissions");
      const data: Record<string, unknown> = {};
      for (const entry of args.input) {
        data[entry.key] = deserializeValue(entry.value);
      }
      const settings = await SettingService.update(args.group, data, context.user.userId);
      return SettingService.toEntries(settings).map((e) => ({ key: e.key, value: serializeValue(e.value) }));
    },

    updateMySettings: async (_: unknown, args: { group: string; input: Array<{ key: string; value: string }> }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      const meta = SETTING_GROUPS[args.group];
      if (meta?.scope === "global") {
        throw new Error(`The "${args.group}" group is company-level and can only be updated by an admin.`);
      }
      const data: Record<string, unknown> = {};
      for (const entry of args.input) {
        data[entry.key] = deserializeValue(entry.value);
      }
      const settings = await SettingService.update(args.group, data, context.user.userId, context.user.userId);
      return SettingService.toEntries(settings).map((e) => ({ key: e.key, value: serializeValue(e.value) }));
    },

    resetSettings: async (_: unknown, { group }: { group: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      if (context.user.role !== UserRole.ADMIN) throw new Error("Insufficient permissions");
      await SettingService.reset(group, context.user.userId);
      return true;
    },

    createRole: async (_: unknown, args: { name: string; description?: string; permissions: string[]; isActive?: boolean }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      if (context.user.role !== UserRole.ADMIN) throw new Error("Insufficient permissions");
      return RoleService.create({ ...args, isActive: args.isActive ?? true }, context.user.userId);
    },

    updateRole: async (_: unknown, args: { ref: string; description?: string; permissions?: string[]; isActive?: boolean }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      if (context.user.role !== UserRole.ADMIN) throw new Error("Insufficient permissions");
      return RoleService.update(args.ref, args, context.user.userId);
    },

    deleteRole: async (_: unknown, { ref }: { ref: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      if (context.user.role !== UserRole.ADMIN) throw new Error("Insufficient permissions");
      await RoleService.remove(ref, context.user.userId);
      return true;
    },
  },

  User: {
    contacts: async (parent: { id: number }) => {
      return Contact.findAll({ where: { createdBy: parent.id } });
    },
  },

  Contact: {
    creator: async (parent: { createdBy: number }) => {
      if (!parent.createdBy) return null;
      return User.findByPk(parent.createdBy, { attributes: ["id", "firstName", "lastName", "email"] });
    },
  },
};
