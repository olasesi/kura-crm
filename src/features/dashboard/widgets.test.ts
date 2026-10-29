import { describe, expect, it } from "vitest";

import {
  defaultLayout,
  getWidget,
  normalizeDashboardRole,
  resolveLayout,
  widgetsForRole,
} from "./widgets";

describe("dashboard widgets", () => {
  it("normalizes workspace roles", () => {
    expect(normalizeDashboardRole("Administrator")).toBe("admin");
    expect(normalizeDashboardRole("super owner")).toBe("admin");
    expect(normalizeDashboardRole("Sales lead")).toBe("manager");
    expect(normalizeDashboardRole("Account executive")).toBe("sales");
    expect(normalizeDashboardRole("Finance accountant")).toBe("finance");
    expect(normalizeDashboardRole("People operations")).toBe("hr");
    expect(normalizeDashboardRole("Support agent")).toBe("support");
    expect(normalizeDashboardRole(undefined)).toBe("user");
  });

  it("builds a role layout that always contains health and account", () => {
    const layout = defaultLayout("admin", "role");
    expect(layout).toContain("health");
    expect(layout).toContain("account");
    expect(new Set(layout).size).toBe(layout.length);
  });

  it("filters widgets that a role is not allowed to see", () => {
    const salesWidgets = widgetsForRole("sales").map((widget) => widget.id);
    expect(salesWidgets).not.toContain("kpi-payroll");
    expect(widgetsForRole("admin").map((widget) => widget.id)).toContain("kpi-payroll");
  });

  it("resolves stored order before the default layout", () => {
    const stored = { order: ["account", "health"], hidden: ["health", "unknown"] };
    const { order, hidden } = resolveLayout("admin", "role", stored);

    expect(order[0]).toBe("account");
    expect(order[1]).toBe("health");
    expect(hidden).toEqual(["health"]);
  });

  it("ignores stored widgets that the role cannot see", () => {
    const { order } = resolveLayout("support", "role", { order: ["kpi-payroll"] });
    expect(order).not.toContain("kpi-payroll");
  });

  it("returns widget metadata by id", () => {
    const widget = getWidget("health");
    expect(widget?.icon).toBe("shield");
    expect(getWidget("does-not-exist")).toBeUndefined();
  });
});
