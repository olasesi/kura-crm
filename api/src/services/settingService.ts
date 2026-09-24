import { z } from "zod";
import { Setting } from "../models/Setting";
import { AppError } from "../middleware/errorHandler";
import { cacheGet, cacheSet, cacheDel, CACHE_TTL } from "../config/redis";
import { addAuditLog } from "../config/queue";
import { logger } from "../config/logger";
import { WebhookService } from "./webhookService";
import { settingsUpdatesTotal, settingsReadsTotal } from "../middleware/monitor";
import { SettingEntry } from "../types";

interface SettingGroupMeta {
  description: string;
  scope: "global" | "user" | "both";
  sensitive?: boolean;
}

export const SETTING_GROUPS: Record<string, SettingGroupMeta> = {
  company: { description: "Company name, email, phone, website and logo.", scope: "global" },
  business_address: { description: "Default and alternative business addresses.", scope: "global" },
  downloads: { description: "Public mobile app store download links.", scope: "global" },
  app: { description: "Date/time format, timezone, default currency and language.", scope: "global" },
  profile: { description: "Per-user profile preferences (language, gender, contact).", scope: "user" },
  notification: { description: "SMTP / email queue and email notification toggles.", scope: "global", sensitive: true },
  currency: { description: "Currencies, exchange rates and format.", scope: "global" },
  payment_credentials: { description: "Payment gateway credentials and enabled gateways.", scope: "global", sensitive: true },
  finance: { description: "Invoice, estimate, credit note and proposal prefixes and defaults.", scope: "global" },
  contract: { description: "Contract prefix, numbering and terms.", scope: "global" },
  tax: { description: "Tax rates.", scope: "global" },
  ticket: { description: "Ticket agents, groups, types, channels and reply templates.", scope: "global" },
  project: { description: "Project statuses and categories.", scope: "global" },
  attendance: { description: "Allowed working locations, week start and shifts.", scope: "global" },
  leave: { description: "Leave types and general leave settings.", scope: "global" },
  custom_fields: { description: "Custom fields for modules.", scope: "global" },
  roles_permissions: { description: "Role definitions and permissions.", scope: "global" },
  message: { description: "Message scope and sound notifications.", scope: "global" },
  lead: { description: "Lead sources, pipelines, agents and email templates.", scope: "global" },
  time_log: { description: "Time log approval and reminder toggles.", scope: "global" },
  task: { description: "Task reminders, statuses and board defaults.", scope: "global" },
  security: { description: "2FA, reCAPTCHA, password and session policies.", scope: "global" },
  theme: { description: "Branding, colors and logo assets.", scope: "global" },
  module: { description: "Enabled feature modules.", scope: "global" },
  storage: { description: "File storage provider credentials.", scope: "global", sensitive: true },
  language: { description: "Available languages and RTL status.", scope: "global" },
  social_login: { description: "Google, Facebook, LinkedIn and Twitter OAuth.", scope: "global", sensitive: true },
  google_calendar: { description: "Google Calendar integration.", scope: "global", sensitive: true },
  custom_links: { description: "Custom navigation links.", scope: "global" },
  gdpr: { description: "GDPR compliance features.", scope: "global" },
  database_backup: { description: "Automatic database backup schedule.", scope: "global" },
  signup: { description: "Sign-up terms and duplicate restrictions.", scope: "global" },
  asset: { description: "Asset types.", scope: "global" },
  payroll: { description: "Salary components, groups and currency.", scope: "global" },
  overtime: { description: "Overtime pay codes and policies.", scope: "global" },
  performance: { description: "Goal types, key results and 1:1 meetings.", scope: "global" },
  purchase: { description: "Purchase order and bill numbering prefixes.", scope: "global" },
  recruit: { description: "Recruitment general, footer and application settings.", scope: "global" },
  rest_api: { description: "Firebase Cloud Messaging and Rest API configuration.", scope: "global", sensitive: true },
  update: { description: "System version and update status (read-only).", scope: "global" },
};

export const DEFAULT_SETTINGS: Record<string, Record<string, unknown>> = {
  company: {
    companyName: "Kura CRM",
    companyEmail: "company@example.com",
    companyPhone: "",
    companyWebsite: "",
    logo: "",
  },
  app: {
    dateFormat: "d-m-Y",
    timeFormat: "12h",
    timezone: "UTC",
    defaultCurrency: "USD",
    language: "en",
    sessionDriver: "file",
    datatableRowLimit: 10,
    clientSignupEnabled: true,
    fileUploadMaxSizeMb: 50,
    googleMapEnabled: false,
  },
  business_address: {
    addresses: [],
    defaultAddressId: null,
  },
  downloads: {
    appleIosUrl: "",
    androidUrl: "",
  },
  notification: {
    mailFromName: "Kura CRM",
    mailFromEmail: "no-reply@kura-crm.com",
    mailQueueEnabled: false,
    mailDriver: "smtp",
    mailHost: "",
    mailPort: 465,
    mailEncryption: "ssl",
    mailUsername: "",
    mailPassword: "",
    toggles: {},
  },
  currency: {
    currencies: [{ name: "Dollars", symbol: "$", code: "USD", exchangeRate: 1, format: "$1,000.00", default: true }],
    converterApiKey: "",
  },
  payment_credentials: {
    gateways: [],
  },
  finance: {
    invoicePrefix: "INV-",
    invoiceNextNumber: 1,
    invoiceDueAfterDays: 30,
    estimatePrefix: "EST-",
    estimateNextNumber: 1,
    creditNotePrefix: "CN-",
    proposalPrefix: "PRO-",
    decimalSeparator: ".",
    thousandSeparator: ",",
    taxPerItem: false,
  },
  contract: {
    prefix: "CONT",
    separator: "#",
    digits: 3,
    dueAfterDays: 15,
    terms: "Thank you for your business.",
  },
  tax: {
    taxes: [],
  },
  ticket: {
    agents: [],
    groups: [],
    types: [],
    channels: [],
    replyTemplates: [],
    roundRobin: false,
  },
  project: {
    statuses: [],
    categories: [],
  },
  attendance: {
    allowedWorkingFrom: ["Office", "Home", "Other"],
    weekStartsFrom: "Monday",
    shifts: [],
    reminderEnabled: false,
  },
  leave: {
    types: [],
    monthlyLimit: 0,
    unpaidAllowed: false,
  },
  custom_fields: {
    fields: [],
  },
  roles_permissions: {
    roles: [],
  },
  message: {
    scope: "all",
    soundNotification: false,
  },
  lead: {
    sources: [],
    pipelines: [],
    agents: [],
    categories: [],
    roundRobin: false,
    emailTemplates: [],
  },
  time_log: {
    stopTimerAfterShift: false,
    requireApproval: false,
    sendReminders: false,
    sendDailyReport: false,
  },
  task: {
    reminderDaysBefore: 0,
    sendReminderOnDue: true,
    isProjectRequired: true,
    reminderDaysAfter: 0,
    defaultStatus: "incomplete",
    taskboardLength: 10,
    visibleSections: [],
  },
  security: {
    twoFactorEnabled: false,
    recaptchaEnabled: false,
    passwordMinLength: 8,
    sessionTimeoutMinutes: 30,
  },
  theme: {
    appName: "Kura CRM",
    brandingStyle: "light",
    lightLogo: "",
    darkLogo: "",
    loginBgImage: "",
    favicon: "",
    primaryColor: "#1D82F5",
    sidebarTheme: "light",
    loginTextColor: "light",
  },
  module: {
    enabledModules: [],
  },
  storage: {
    provider: "local",
    bucket: "",
    region: "",
    accessKeyId: "",
    secretAccessKey: "",
  },
  language: {
    languages: [{ name: "English", code: "en", rtl: false, enabled: true }],
    defaultLanguage: "en",
  },
  social_login: {
    google: { enabled: false, clientId: "", clientSecret: "" },
    facebook: { enabled: false, clientId: "", clientSecret: "" },
    linkedin: { enabled: false, clientId: "", clientSecret: "" },
    twitter: { enabled: false, clientId: "", clientSecret: "" },
  },
  google_calendar: {
    enabled: false,
    clientId: "",
    clientSecret: "",
    calendarId: "",
  },
  custom_links: {
    links: [],
  },
  gdpr: {
    enabled: false,
  },
  database_backup: {
    autoBackup: false,
    frequency: "daily",
    retentionDays: 30,
  },
  signup: {
    terms: "",
    duplicateRestrictionDays: 180,
    offerLetterReminderDays: 0,
  },
  asset: {
    types: ["Laptop", "Desktop", "Mobile", "Printer", "Scanner", "Two-Wheeler", "Car", "Other"],
  },
  payroll: {
    salaryComponents: [],
    salaryGroups: [],
    currency: "USD",
  },
  overtime: {
    payCodes: [],
    policies: [],
    employeeHourlyRate: 0,
  },
  performance: {
    goalTypes: [],
    keyResultMetrics: [],
    meetingVisibility: "owner",
  },
  purchase: {
    poPrefix: "PO",
    poSeparator: "#",
    poDigits: 3,
    billPrefix: "BL",
    billSeparator: "#",
    billDigits: 3,
    vendorCreditPrefix: "VC",
    vendorCreditSeparator: "#",
    vendorCreditDigits: 3,
    terms: "",
  },
  recruit: {
    companyName: "",
    companyWebsite: "",
    companyLogo: "",
    aboutCompany: "",
    quickAddFields: [],
    duplicateRestrictionDays: 180,
  },
  rest_api: {
    firebaseEnabled: false,
    fcmServiceAccount: "",
  },
  update: {
    appVersion: "3.0.0",
    latestVersion: "3.0.0",
  },
};

const uint = z.number().int().min(0);
const positiveInt = z.number().int().min(1);

export const SETTING_GROUP_SCHEMAS: Record<string, z.ZodType> = {
  company: z.object({
    companyName: z.string().max(255),
    companyEmail: z.string().email(),
    companyPhone: z.string().max(50),
    companyWebsite: z.string().url().or(z.literal("")),
    logo: z.string().max(500),
  }).partial().passthrough(),
  app: z.object({
    dateFormat: z.string().max(20),
    timeFormat: z.enum(["12h", "24h"]),
    timezone: z.string().max(64),
    defaultCurrency: z.string().max(10),
    language: z.string().max(10),
    sessionDriver: z.enum(["file", "redis", "database"]),
    datatableRowLimit: positiveInt,
    clientSignupEnabled: z.boolean(),
    fileUploadMaxSizeMb: positiveInt,
    googleMapEnabled: z.boolean(),
  }).partial().passthrough(),
  downloads: z.object({
    appleIosUrl: z.string().url().or(z.literal("")),
    androidUrl: z.string().url().or(z.literal("")),
  }).partial().passthrough(),
  notification: z.object({
    mailFromName: z.string().max(255),
    mailFromEmail: z.string().email(),
    mailQueueEnabled: z.boolean(),
    mailDriver: z.enum(["mail", "smtp"]),
    mailHost: z.string().max(255),
    mailPort: uint,
    mailEncryption: z.enum(["tls", "ssl", "starttls", "none"]),
    mailUsername: z.string().max(255),
    toggles: z.record(z.string(), z.boolean()),
  }).partial().passthrough(),
  currency: z.object({
    currencies: z.array(z.object({
      name: z.string(),
      symbol: z.string(),
      code: z.string().length(3),
      exchangeRate: z.number().positive(),
      format: z.string(),
      default: z.boolean().optional(),
    })),
    converterApiKey: z.string().max(255),
  }).partial().passthrough(),
  payment_credentials: z.record(z.string(), z.unknown()),
  finance: z.object({
    invoicePrefix: z.string().max(20),
    invoiceNextNumber: positiveInt,
    invoiceDueAfterDays: positiveInt,
    estimatePrefix: z.string().max(20),
    estimateNextNumber: positiveInt,
    creditNotePrefix: z.string().max(20),
    proposalPrefix: z.string().max(20),
    decimalSeparator: z.string().length(1),
    thousandSeparator: z.string().length(1),
    taxPerItem: z.boolean(),
  }).partial().passthrough(),
  contract: z.object({
    prefix: z.string().max(20),
    separator: z.string().max(5),
    digits: positiveInt,
    dueAfterDays: positiveInt,
    terms: z.string().max(5000),
  }).partial().passthrough(),
  tax: z.object({
    taxes: z.array(z.object({
      name: z.string(),
      rate: z.number().min(0),
      inclusive: z.boolean().optional(),
    })),
  }).partial().passthrough(),
  security: z.object({
    twoFactorEnabled: z.boolean(),
    recaptchaEnabled: z.boolean(),
    passwordMinLength: z.number().int().min(6).max(64),
    sessionTimeoutMinutes: positiveInt,
  }).partial().passthrough(),
  storage: z.object({
    provider: z.enum(["local", "s3", "digitalocean", "wasabi", "minio"]),
    bucket: z.string().max(255),
    region: z.string().max(64),
    accessKeyId: z.string().max(255),
    secretAccessKey: z.string().max(255),
  }).partial().passthrough(),
  theme: z.object({
    appName: z.string().max(100),
    brandingStyle: z.enum(["light", "dark"]),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    sidebarTheme: z.enum(["light", "dark"]),
    loginTextColor: z.enum(["light", "dark"]),
    lightLogo: z.string(),
    darkLogo: z.string(),
    loginBgImage: z.string(),
    favicon: z.string(),
  }).partial().passthrough(),
  module: z.object({
    enabledModules: z.array(z.string()),
  }).partial().passthrough(),
  language: z.object({
    languages: z.array(z.object({
      name: z.string(),
      code: z.string(),
      rtl: z.boolean(),
      enabled: z.boolean(),
    })),
    defaultLanguage: z.string().max(10),
  }).partial().passthrough(),
  message: z.object({
    scope: z.enum(["all", "project_members_only"]),
    soundNotification: z.boolean(),
  }).partial().passthrough(),
  gdpr: z.object({
    enabled: z.boolean(),
  }).partial().passthrough(),
  database_backup: z.object({
    autoBackup: z.boolean(),
    frequency: z.enum(["daily", "weekly", "monthly"]),
    retentionDays: positiveInt,
  }).partial().passthrough(),
  signup: z.object({
    terms: z.string().max(10000),
    duplicateRestrictionDays: positiveInt,
    offerLetterReminderDays: uint,
  }).partial().passthrough(),
  custom_fields: z.object({
    fields: z.array(z.unknown()),
  }).partial().passthrough(),
};

const SENSITIVE_KEYS = [
  "password",
  "secret",
  "apiKey",
  "apiSecret",
  "accessKeyId",
  "secretAccessKey",
  "clientSecret",
  "appSecret",
  "signingSecret",
  "token",
  "privateKey",
  "fcmServiceAccount",
  "serviceAccount",
  "converterApiKey",
  "credentials",
  "authorization",
];

const cacheKey = (scopeId: number, group: string | "__all"): string =>
  `settings:${scopeId}:${group}`;

const parseValue = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

export class SettingService {
  static listGroups(): Array<{ group: string; description: string; scope: string; sensitive: boolean }> {
    return Object.entries(SETTING_GROUPS).map(([group, meta]) => ({
      group,
      description: meta.description,
      scope: meta.scope,
      sensitive: !!meta.sensitive,
    }));
  }

  static isKnownGroup(group: string): boolean {
    return group in SETTING_GROUPS;
  }

  static validateGroup(group: string): void {
    if (!SettingService.isKnownGroup(group)) {
      throw new AppError(`Unknown settings group: ${group}`, 404);
    }
  }

  static async getAll(group: string, userId?: number): Promise<Record<string, unknown>> {
    SettingService.validateGroup(group);
    const scopeId = userId ?? 0;
    const key = cacheKey(scopeId, group);

    const cached = await cacheGet<Record<string, unknown>>(key);
    if (cached) {
      settingsReadsTotal.inc({ group, cache: "hit" });
      return cached;
    }
    settingsReadsTotal.inc({ group, cache: "miss" });

    const defaults = DEFAULT_SETTINGS[group] ?? {};
    const rows = await Setting.findAll({ where: { group, userId: scopeId } });
    const stored: Record<string, unknown> = {};
    for (const row of rows) {
      stored[row.key] = parseValue(row.value);
    }
    const merged = { ...defaults, ...stored };

    await cacheSet(key, merged, CACHE_TTL.MEDIUM);
    return merged;
  }

  static async getMany(
    groups: string[],
    userId?: number
  ): Promise<Record<string, Record<string, unknown>>> {
    const out: Record<string, Record<string, unknown>> = {};
    for (const group of groups) {
      out[group] = await SettingService.getAll(group, userId);
    }
    return out;
  }

  static async getAllAggregate(userId?: number): Promise<Record<string, Record<string, unknown>>> {
    const scopeId = userId ?? 0;
    const key = cacheKey(scopeId, "__all");

    const cached = await cacheGet<Record<string, Record<string, unknown>>>(key);
    if (cached) {
      settingsReadsTotal.inc({ group: "__all", cache: "hit" });
      return cached;
    }
    settingsReadsTotal.inc({ group: "__all", cache: "miss" });

    const rows = await Setting.findAll({ where: { userId: scopeId } });
    const storedByGroup: Record<string, Record<string, unknown>> = {};
    for (const row of rows) {
      storedByGroup[row.group] ??= {};
      storedByGroup[row.group][row.key] = parseValue(row.value);
    }

    const result: Record<string, Record<string, unknown>> = {};
    for (const group of Object.keys(SETTING_GROUPS)) {
      result[group] = { ...(DEFAULT_SETTINGS[group] ?? {}), ...(storedByGroup[group] ?? {}) };
    }

    await cacheSet(key, result, CACHE_TTL.MEDIUM);
    return result;
  }

  static async update(
    group: string,
    data: Record<string, unknown>,
    actorUserId: number,
    userId?: number
  ): Promise<Record<string, unknown>> {
    SettingService.validateGroup(group);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new AppError("Settings payload must be an object of key/value pairs.", 400);
    }

    const schema = SETTING_GROUP_SCHEMAS[group];
    if (schema) {
      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        const issues = parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
        throw new AppError(`Validation failed for "${group}": ${issues}`, 400);
      }
    }

    const scopeId = userId ?? 0;
    const entries = Object.entries(data).map(([key, value]) => ({
      group,
      key,
      userId: scopeId,
      value: JSON.stringify(value),
    }));

    await Setting.bulkCreate(entries as any[], { updateOnDuplicate: ["value", "updatedAt"] });
    await cacheDel("settings:*");

    settingsUpdatesTotal.inc({ group });
    logger.info(`Settings updated: group=${group} keys=${entries.length} actor=${actorUserId} scope=${scopeId}`);

    addAuditLog({
      userId: actorUserId,
      action: "settings.update",
      resource: `settings:${group}`,
      details: { keys: Object.keys(data), scope: scopeId },
    });

    WebhookService.dispatch("setting.updated", {
      group,
      actorUserId,
      scope: scopeId,
      keys: Object.keys(data),
    });

    return SettingService.getAll(group, userId);
  }

  static async remove(group: string, key: string, actorUserId: number, userId?: number): Promise<void> {
    SettingService.validateGroup(group);
    const scopeId = userId ?? 0;
    const removed = await Setting.destroy({ where: { group, key, userId: scopeId } });
    if (!removed) {
      throw new AppError(`Settings key "${group}.${key}" not found.`, 404);
    }
    await cacheDel("settings:*");
    settingsUpdatesTotal.inc({ group });
    logger.info(`Settings key removed: ${group}.${key} actor=${actorUserId} scope=${scopeId}`);

    addAuditLog({
      userId: actorUserId,
      action: "settings.delete",
      resource: `settings:${group}`,
      details: { key, scope: scopeId },
    });

    WebhookService.dispatch("setting.deleted", {
      group,
      actorUserId,
      scope: scopeId,
      key,
    });
  }

  static async reset(group: string, actorUserId: number, userId?: number): Promise<void> {
    SettingService.validateGroup(group);
    const scopeId = userId ?? 0;
    await Setting.destroy({ where: { group, userId: scopeId } });
    await cacheDel("settings:*");
    settingsUpdatesTotal.inc({ group });
    logger.info(`Settings reset: group=${group} actor=${actorUserId} scope=${scopeId}`);

    addAuditLog({
      userId: actorUserId,
      action: "settings.reset",
      resource: `settings:${group}`,
      details: { scope: scopeId },
    });

    WebhookService.dispatch("setting.deleted", {
      group,
      actorUserId,
      scope: scopeId,
      key: "__all__",
    });
  }

  static redact(
    settings: Record<string, unknown>,
    isAdmin: boolean,
    meta?: SettingGroupMeta
  ): Record<string, unknown> {
    if (isAdmin && !meta?.sensitive) {
      return settings;
    }
    if (isAdmin && meta?.sensitive) {
      return settings;
    }
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
        out[key] = "********";
      } else if (value && typeof value === "object") {
        out[key] = SettingService.redact(value as Record<string, unknown>, false, undefined);
      } else {
        out[key] = value;
      }
    }
    return out;
  }

  static toEntries(settings: Record<string, unknown>): SettingEntry[] {
    return Object.entries(settings).map(([key, value]) => ({ key, value }));
  }

  static fromEntries(entries: SettingEntry[]): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const entry of entries) {
      out[entry.key] = entry.value;
    }
    return out;
  }
}