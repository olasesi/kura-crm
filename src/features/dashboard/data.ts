import { useMemo } from "react";

import { getModuleById } from "@/modules/registry";
import { useModuleRecords } from "@/modules/useModuleRecords";
import type { ModuleDef, ModuleRecord } from "@/modules/types";

const FALLBACK_MODULES = new Map<string, ModuleDef>();

const fallbackModule = (id: string): ModuleDef => {
  const existing = FALLBACK_MODULES.get(id);
  if (existing) {
    return existing;
  }
  const created: ModuleDef = {
    id,
    name: id,
    group: "overview",
    kind: "crud",
    icon: "document",
    description: "",
    fields: [],
    seed: { names: [] },
  };
  FALLBACK_MODULES.set(id, created);
  return created;
};

/**
 * Subscribes to a module by id. Every dashboard widget owns its subscription so
 * editing a record refreshes only the widgets that read that module.
 */
export const useRecords = (moduleId: string): ModuleRecord[] => {
  const module = useMemo(() => getModuleById(moduleId) ?? fallbackModule(moduleId), [moduleId]);
  return useModuleRecords(module);
};

export const numberValue = (value: string | number | undefined): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const sumBy = (records: ModuleRecord[], key: string): number =>
  records.reduce((total, record) => total + numberValue(record[key]), 0);

export const countByStatus = (records: ModuleRecord[], statuses: string[]): number => {
  const allowed = new Set(statuses.map((status) => status.toLowerCase()));
  return records.filter((record) => allowed.has(String(record.status ?? "").toLowerCase())).length;
};

export const countMatching = (
  records: ModuleRecord[],
  predicate: (record: ModuleRecord) => boolean,
): number => records.filter(predicate).length;

export const formatMoney = (value: number): string =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export const formatCompactMoney = (value: number): string =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const formatPercent = (value: number): string =>
  `${Math.round(Number.isFinite(value) ? value : 0)}%`;

const recordDate = (record: ModuleRecord): Date => {
  const raw = record.date ?? record.startDate ?? record.createdAt ?? record.updatedAt;
  const date = new Date(String(raw ?? ""));
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

export interface MonthPoint {
  key: string;
  label: string;
  total: number;
}

export const lastMonths = (count: number): Array<{ key: string; label: string }> => {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat(undefined, { month: "short" }).format(date),
    };
  });
};

export const monthlyTotals = (
  records: ModuleRecord[],
  valueKey: string,
  count = 6,
  predicate?: (record: ModuleRecord) => boolean,
): MonthPoint[] => {
  const months = lastMonths(count);
  const totals = new Map(months.map((month) => [month.key, 0]));
  for (const record of records) {
    if (predicate && !predicate(record)) {
      continue;
    }
    const date = recordDate(record);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (totals.has(key)) {
      totals.set(key, (totals.get(key) ?? 0) + numberValue(record[valueKey]));
    }
  }
  return months.map((month) => ({ ...month, total: totals.get(month.key) ?? 0 }));
};

export const percentChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / previous) * 100;
};

export const sortByNumberDesc = (records: ModuleRecord[], key: string): ModuleRecord[] =>
  [...records].sort((left, right) => numberValue(right[key]) - numberValue(left[key]));

export const sortByDateAsc = (records: ModuleRecord[], key: string): ModuleRecord[] =>
  [...records].sort((left, right) => {
    const a = new Date(String(left[key] ?? "")).getTime();
    const b = new Date(String(right[key] ?? "")).getTime();
    return (Number.isNaN(a) ? 0 : a) - (Number.isNaN(b) ? 0 : b);
  });

export const currentMonthEventDays = (records: ModuleRecord[], dateKey = "date"): Set<number> => {
  const now = new Date();
  const days = new Set<number>();
  for (const record of records) {
    const date = new Date(String(record[dateKey] ?? ""));
    if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
      days.add(date.getDate());
    }
  }
  return days;
};
