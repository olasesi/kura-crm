import { describe, expect, it } from "vitest";

import type { ModuleDef, ModuleRecord } from "./types";
import {
  computeStats,
  filterRecords,
  formatDay,
  formatValue,
  getStatusOptions,
  sortRecords,
  statusTone,
  toCsv,
} from "./moduleUtils";

const module: ModuleDef = {
  id: "test-records",
  name: "Test records",
  group: "crm",
  kind: "crud",
  icon: "users",
  description: "",
  fields: [
    { key: "name", label: "Name", type: "text" },
    { key: "amount", label: "Amount", type: "currency" },
    { key: "status", label: "Status", type: "select", options: ["Active", "Pending", "Failed"] },
    { key: "date", label: "Date", type: "date" },
  ],
  seed: { names: [] },
};

const records: ModuleRecord[] = [
  {
    id: "1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: "Alpha, Inc",
    amount: "1200",
    status: "Active",
    date: "2026-01-15",
  },
  {
    id: "2",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: "Beta",
    amount: "400",
    status: "Pending",
    date: "2025-11-02",
  },
  {
    id: "3",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: "Gamma",
    amount: "900",
    status: "Failed",
    date: "2026-02-01",
  },
];

describe("moduleUtils", () => {
  it("maps statuses to badge tones", () => {
    expect(statusTone("Active")).toBe("badge--success");
    expect(statusTone("pending")).toBe("badge--warning");
    expect(statusTone("Failed")).toBe("badge--danger");
    expect(statusTone("New")).toBe("badge--info");
    expect(statusTone("something")).toBe("");
    expect(statusTone(undefined)).toBe("");
  });

  it("formats currency, empty and date values", () => {
    expect(formatValue("1200", { key: "amount", label: "Amount", type: "currency" })).toContain(
      "1,200",
    );
    expect(formatValue(undefined)).toBe("—");
    expect(formatDay("2026-01-15")).toContain("2026");
    expect(formatDay("not-a-date")).toBe("not-a-date");
  });

  it("computes stats across the record set", () => {
    const stats = computeStats(module, records);
    expect(stats.total).toBe(3);
    expect(stats.active).toBe(1);
    expect(stats.totalValue).toBe(2500);
    expect(stats.createdThisMonth).toBe(3);
  });

  it("filters by free text and status", () => {
    expect(filterRecords(records, "alpha", "all")).toHaveLength(1);
    expect(filterRecords(records, "", "Pending")).toHaveLength(1);
    expect(filterRecords(records, "", "all")).toHaveLength(3);
    expect(filterRecords(records, "gamma", "Pending")).toHaveLength(0);
  });

  it("sorts numerically and lexically", () => {
    expect(sortRecords(records, "amount", "desc")[0]?.name).toBe("Alpha, Inc");
    expect(sortRecords(records, "amount", "asc")[0]?.name).toBe("Beta");
    expect(sortRecords(records, "name", "asc")[0]?.name).toBe("Alpha, Inc");
  });

  it("serialises CSV with escaping", () => {
    const csv = toCsv(module, records);
    const [header, firstRow] = csv.split("\r\n");
    expect(header).toBe("Name,Amount,Status,Date");
    expect(firstRow).toContain('"Alpha, Inc"');
  });

  it("reads status options from the schema", () => {
    expect(getStatusOptions(module)).toEqual(["Active", "Pending", "Failed"]);
    expect(getStatusOptions({ ...module, fields: [] })).toEqual([]);
  });
});
