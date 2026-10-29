import type { IconName } from "@/components/ui/Icon";

export type GroupId =
  | "overview"
  | "crm"
  | "sales"
  | "finance"
  | "work"
  | "hr"
  | "payroll"
  | "performance"
  | "recruit"
  | "purchase"
  | "support"
  | "collaboration"
  | "biometric"
  | "monitoring"
  | "servers"
  | "showroom"
  | "webhooks"
  | "reports"
  | "documents"
  | "settings";

export type ModuleKind = "crud" | "report" | "tool" | "special";

export type FieldType =
  "text" | "email" | "tel" | "number" | "currency" | "date" | "select" | "textarea" | "url";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  inTable?: boolean;
  readOnly?: boolean;
  min?: number;
  max?: number;
}

export interface SeedSpec {
  /** Human-friendly record names used to derive deterministic demo rows. */
  names: string[];
  statuses?: string[];
  categories?: string[];
}

export interface ModuleDef {
  id: string;
  name: string;
  group: GroupId;
  kind: ModuleKind;
  icon: IconName;
  description: string;
  fields: FieldDef[];
  seed: SeedSpec;
  demoCount?: number;
  /** Optional role allow-list. Omitted means every authenticated user. */
  roles?: string[];
  /** Reports use a shared report renderer with a pre-selected metric. */
  reportMetric?: string;
}

export interface ModuleRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: string | number;
}

export type RecordValues = Record<string, string | number>;

export interface ModuleStats {
  total: number;
  active: number;
  createdThisMonth: number;
  totalValue: number;
}

export const DEFAULT_STATUSES = ["Active", "Pending", "Completed", "Draft"];

export const PRIORITIES = ["High", "Medium", "Low"];

/**
 * Small field factory used by the catalog so definitions stay declarative and
 * consistent without repeating type/table metadata everywhere.
 */
export const field = (
  key: string,
  label: string,
  type: FieldType = "text",
  options: Partial<FieldDef> = {},
): FieldDef => ({
  key,
  label,
  type,
  inTable: true,
  ...options,
});

export const defineModule = (definition: ModuleDef): ModuleDef => definition;
