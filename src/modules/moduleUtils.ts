import type { FieldDef, ModuleDef, ModuleRecord, ModuleStats } from "./types";

const POSITIVE_STATUSES = new Set([
  "active",
  "paid",
  "completed",
  "approved",
  "won",
  "present",
  "published",
  "online",
  "hired",
  "success",
  "open",
  "fulfilled",
  "connected",
  "received",
  "live",
  "processed",
  "reviewed",
]);

export const statusTone = (status: string | number | undefined): string => {
  if (status === undefined) {
    return "";
  }
  const value = String(status).toLowerCase();
  if (
    [
      "active",
      "paid",
      "completed",
      "approved",
      "won",
      "present",
      "published",
      "online",
      "hired",
      "success",
      "connected",
      "received",
      "live",
      "fulfilled",
    ].includes(value)
  ) {
    return "badge--success";
  }
  if (
    [
      "pending",
      "processing",
      "draft",
      "sent",
      "queued",
      "scheduled",
      "reviewing",
      "partial",
      "on hold",
      "expiring",
      "retrying",
      "screening",
    ].includes(value)
  ) {
    return "badge--warning";
  }
  if (
    [
      "rejected",
      "failed",
      "overdue",
      "cancelled",
      "canceled",
      "expired",
      "lost",
      "terminated",
      "absent",
      "offline",
      "flagged",
      "at risk",
      "off track",
    ].includes(value)
  ) {
    return "badge--danger";
  }
  if (["new", "open", "in progress", "contacted", "qualified", "prospect"].includes(value)) {
    return "badge--info";
  }
  return "";
};

export const formatValue = (value: string | number | undefined, fieldDef?: FieldDef): string => {
  if (value === undefined || value === "") {
    return "—";
  }
  if (
    fieldDef?.type === "currency" ||
    (fieldDef && /amount|value|price|cost|salary|budget|balance/i.test(fieldDef.key))
  ) {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(numeric);
    }
  }
  return String(value);
};

export const formatDay = (value: string | number | undefined): string => {
  if (value === undefined || value === "") {
    return "—";
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
};

export const computeStats = (module: ModuleDef, records: ModuleRecord[]): ModuleStats => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const valueField = module.fields.find(
    (item) =>
      item.type === "currency" || /amount|value|price|cost|salary|budget|balance/i.test(item.key),
  );

  return records.reduce<ModuleStats>(
    (stats, record) => {
      const created = new Date(record.createdAt);
      const status = String(record.status ?? "").toLowerCase();
      return {
        total: stats.total + 1,
        active: stats.active + (POSITIVE_STATUSES.has(status) ? 1 : 0),
        createdThisMonth:
          stats.createdThisMonth +
          (created.getMonth() === month && created.getFullYear() === year ? 1 : 0),
        totalValue: stats.totalValue + (valueField ? Number(record[valueField.key] ?? 0) : 0),
      };
    },
    { total: 0, active: 0, createdThisMonth: 0, totalValue: 0 },
  );
};

export const filterRecords = (
  records: ModuleRecord[],
  query: string,
  status: string,
): ModuleRecord[] => {
  const term = query.trim().toLowerCase();
  return records.filter((record) => {
    if (status !== "all" && String(record.status ?? "") !== status) {
      return false;
    }
    if (!term) {
      return true;
    }
    return Object.entries(record).some(([key, value]) => {
      if (key === "id" || key === "createdAt" || key === "updatedAt") {
        return false;
      }
      return String(value).toLowerCase().includes(term);
    });
  });
};

export const sortRecords = (
  records: ModuleRecord[],
  key: string,
  direction: "asc" | "desc",
): ModuleRecord[] => {
  const factor = direction === "asc" ? 1 : -1;
  return [...records].sort((left, right) => {
    const a = left[key];
    const b = right[key];
    const numericA = Number(a);
    const numericB = Number(b);
    if (!Number.isNaN(numericA) && !Number.isNaN(numericB) && a !== "" && b !== "") {
      return (numericA - numericB) * factor;
    }
    return String(a ?? "").localeCompare(String(b ?? "")) * factor;
  });
};

const escapeCsv = (value: string | number | undefined): string => {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export const toCsv = (module: ModuleDef, records: ModuleRecord[]): string => {
  const columns = module.fields.map((item) => item.key);
  const header = columns.map((key) =>
    escapeCsv(module.fields.find((item) => item.key === key)?.label ?? key),
  );
  const lines = records.map((record) => columns.map((key) => escapeCsv(record[key])).join(","));
  return [header.join(","), ...lines].join("\r\n");
};

export const downloadCsv = (filename: string, csv: string): void => {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const getStatusOptions = (module: ModuleDef): string[] => {
  const statusField = module.fields.find((item) => item.key === "status");
  return statusField?.options ?? [];
};
