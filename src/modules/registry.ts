import { collaborationModules, supportModules } from "./catalog/support";
import { crmModules } from "./catalog/crm";
import { documentModules, showroomModules, webhookModules } from "./catalog/operations";
import { financeModules } from "./catalog/finance";
import { hrModules } from "./catalog/hr";
import { biometricModules, monitoringModules, serverModules } from "./catalog/monitoring";
import { overviewModules, reportModules, settingsModules } from "./catalog/overview";
import { payrollModules } from "./catalog/payroll";
import { performanceModules } from "./catalog/performance";
import { purchaseModules } from "./catalog/purchase";
import { recruitModules } from "./catalog/recruit";
import { salesModules } from "./catalog/sales";
import { workModules } from "./catalog/work";
import { MODULE_GROUPS, type ModuleGroup } from "./groups";
import type { GroupId, ModuleDef, ModuleKind } from "./types";

export { MODULE_GROUPS } from "./groups";
export type { ModuleGroup } from "./groups";
export * from "./types";

export const MODULES: ModuleDef[] = [
  ...overviewModules,
  ...crmModules,
  ...salesModules,
  ...financeModules,
  ...workModules,
  ...hrModules,
  ...payrollModules,
  ...performanceModules,
  ...recruitModules,
  ...purchaseModules,
  ...supportModules,
  ...collaborationModules,
  ...biometricModules,
  ...monitoringModules,
  ...serverModules,
  ...showroomModules,
  ...webhookModules,
  ...reportModules,
  ...documentModules,
  ...settingsModules,
];

/** Modules that are sensitive enough to restrict by workspace role. */
const GROUP_ROLES: Partial<Record<GroupId, string[]>> = {
  payroll: ["admin", "hr", "finance"],
  recruit: ["admin", "hr"],
  biometric: ["admin", "hr", "manager"],
  monitoring: ["admin", "manager"],
  servers: ["admin"],
  webhooks: ["admin"],
  settings: ["admin"],
};

const MODULE_BY_ID = new Map(MODULES.map((module) => [module.id, module]));

export const getModuleById = (id: string | undefined): ModuleDef | undefined =>
  id ? MODULE_BY_ID.get(id) : undefined;

export const getModuleName = (module: ModuleDef): string => module.name;

export const normalizeRole = (role: string | undefined): string => {
  const value = (role ?? "user").toLowerCase();
  if (value.includes("admin") || value.includes("owner") || value.includes("super")) {
    return "admin";
  }
  if (value.includes("manager") || value.includes("lead") || value.includes("director")) {
    return "manager";
  }
  if (value.includes("sale") || value.includes("account")) {
    return "sales";
  }
  if (value.includes("finance") || value.includes("accountant")) {
    return "finance";
  }
  if (value.includes("hr") || value.includes("people")) {
    return "hr";
  }
  if (value.includes("support") || value.includes("agent")) {
    return "support";
  }
  return "user";
};

export const canAccessModule = (module: ModuleDef, role: string | undefined): boolean => {
  const normalized = normalizeRole(role);
  if (normalized === "admin") {
    return true;
  }
  if (module.roles && !module.roles.includes(normalized)) {
    return false;
  }
  const groupRoles = GROUP_ROLES[module.group];
  return !groupRoles || groupRoles.includes(normalized);
};

export const getVisibleModules = (role: string | undefined): ModuleDef[] =>
  MODULES.filter((module) => canAccessModule(module, role));

export const groupModules = (modules: ModuleDef[]): Array<ModuleGroup & { modules: ModuleDef[] }> =>
  MODULE_GROUPS.map((group) => ({
    ...group,
    modules: modules.filter((module) => module.group === group.id),
  })).filter((group) => group.modules.length > 0);

export const searchModules = (query: string, role?: string): ModuleDef[] => {
  const term = query.trim().toLowerCase();
  if (!term) {
    return [];
  }
  return getVisibleModules(role).filter(
    (module) =>
      module.name.toLowerCase().includes(term) ||
      module.description.toLowerCase().includes(term) ||
      module.id.includes(term),
  );
};

export const modulesByKind = (kind: ModuleKind, role?: string): ModuleDef[] =>
  getVisibleModules(role).filter((module) => module.kind === kind);

export const countByKind = (kind: ModuleKind): number =>
  MODULES.filter((module) => module.kind === kind).length;
