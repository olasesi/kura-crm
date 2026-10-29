import type { IconName } from "@/components/ui/Icon";

export type DashboardRole = "admin" | "manager" | "sales" | "finance" | "hr" | "support" | "user";

export type LayoutVariant = "role" | "executive" | "advanced" | "private";

export interface WidgetDef {
  id: string;
  titleKey: string;
  icon: IconName;
  /** Grid columns out of 12. */
  span: number;
  /** Roles that can see the widget. Omitted means every role. */
  roles?: DashboardRole[];
}

export const DASHBOARD_ROLES: DashboardRole[] = [
  "admin",
  "manager",
  "sales",
  "finance",
  "hr",
  "support",
  "user",
];

export const LAYOUT_VARIANTS: Array<{ id: LayoutVariant; labelKey: string }> = [
  { id: "role", labelKey: "dashboard.layout.role" },
  { id: "executive", labelKey: "dashboard.layout.executive" },
  { id: "advanced", labelKey: "dashboard.layout.advanced" },
  { id: "private", labelKey: "dashboard.layout.private" },
];

/**
 * Widget catalogue. Each widget id maps to a renderer in WidgetContent.tsx.
 * New widgets only need an entry here, a role placement below and a renderer.
 */
export const WIDGETS: WidgetDef[] = [
  {
    id: "kpi-revenue",
    titleKey: "dashboard.kpi.revenue",
    icon: "bank",
    span: 3,
    roles: ["admin", "manager", "sales", "finance"],
  },
  {
    id: "kpi-deals",
    titleKey: "dashboard.kpi.deals",
    icon: "handshake",
    span: 3,
    roles: ["admin", "manager", "sales"],
  },
  {
    id: "kpi-invoices",
    titleKey: "dashboard.kpi.invoices",
    icon: "invoice",
    span: 3,
    roles: ["admin", "manager", "finance"],
  },
  {
    id: "kpi-headcount",
    titleKey: "dashboard.kpi.headcount",
    icon: "employee",
    span: 3,
    roles: ["admin", "manager", "hr"],
  },
  {
    id: "kpi-tickets",
    titleKey: "dashboard.kpi.tickets",
    icon: "ticket",
    span: 3,
    roles: ["admin", "manager", "support"],
  },
  {
    id: "kpi-attendance",
    titleKey: "dashboard.kpi.attendance",
    icon: "attendance",
    span: 3,
    roles: ["admin", "manager", "hr"],
  },
  {
    id: "kpi-conversion",
    titleKey: "dashboard.kpi.conversion",
    icon: "target",
    span: 3,
    roles: ["admin", "manager", "sales"],
  },
  {
    id: "kpi-payroll",
    titleKey: "dashboard.kpi.payroll",
    icon: "payroll",
    span: 3,
    roles: ["admin", "finance", "hr"],
  },
  {
    id: "kpi-screens",
    titleKey: "dashboard.kpi.screens",
    icon: "screenshot",
    span: 3,
    roles: ["admin", "manager"],
  },
  {
    id: "kpi-domains",
    titleKey: "dashboard.kpi.domains",
    icon: "domain",
    span: 3,
    roles: ["admin"],
  },
  {
    id: "chart-revenue-expenses",
    titleKey: "dashboard.revenueVsExpenses",
    icon: "analytics",
    span: 8,
    roles: ["admin", "manager", "finance"],
  },
  {
    id: "list-deals",
    titleKey: "dashboard.recentDeals",
    icon: "handshake",
    span: 4,
    roles: ["admin", "manager", "sales"],
  },
  {
    id: "list-tasks",
    titleKey: "dashboard.tasks",
    icon: "task",
    span: 4,
  },
  {
    id: "list-tickets",
    titleKey: "dashboard.openTickets",
    icon: "ticket",
    span: 4,
    roles: ["admin", "manager", "support"],
  },
  {
    id: "list-leave",
    titleKey: "dashboard.leaveRequests",
    icon: "leave",
    span: 4,
    roles: ["admin", "manager", "hr"],
  },
  { id: "goals", titleKey: "dashboard.goals", icon: "objective", span: 4 },
  { id: "calendar", titleKey: "dashboard.calendar", icon: "calendar", span: 4 },
  { id: "account", titleKey: "dashboard.account", icon: "user", span: 4 },
  { id: "health", titleKey: "dashboard.health", icon: "shield", span: 4 },
  { id: "quick-links", titleKey: "dashboard.quickLinks", icon: "link", span: 4 },
  { id: "activity", titleKey: "dashboard.activity", icon: "log", span: 4 },
];

const WIDGET_BY_ID = new Map(WIDGETS.map((widget) => [widget.id, widget]));

const ROLE_ORDER: Record<DashboardRole, string[]> = {
  admin: [
    "kpi-revenue",
    "kpi-deals",
    "kpi-invoices",
    "kpi-headcount",
    "chart-revenue-expenses",
    "list-deals",
    "account",
    "health",
    "list-tasks",
    "goals",
    "calendar",
    "list-tickets",
    "quick-links",
    "activity",
  ],
  manager: [
    "kpi-revenue",
    "kpi-deals",
    "kpi-attendance",
    "kpi-screens",
    "chart-revenue-expenses",
    "list-deals",
    "account",
    "health",
    "list-tasks",
    "goals",
    "list-leave",
    "calendar",
    "quick-links",
    "activity",
  ],
  sales: [
    "kpi-revenue",
    "kpi-deals",
    "kpi-conversion",
    "kpi-invoices",
    "chart-revenue-expenses",
    "list-deals",
    "list-tasks",
    "goals",
    "calendar",
    "account",
    "health",
    "quick-links",
    "activity",
  ],
  finance: [
    "kpi-revenue",
    "kpi-invoices",
    "kpi-payroll",
    "chart-revenue-expenses",
    "list-tasks",
    "goals",
    "calendar",
    "account",
    "health",
    "quick-links",
    "activity",
  ],
  hr: [
    "kpi-headcount",
    "kpi-attendance",
    "kpi-payroll",
    "list-leave",
    "list-tasks",
    "goals",
    "calendar",
    "account",
    "health",
    "quick-links",
    "activity",
  ],
  support: [
    "kpi-tickets",
    "list-tickets",
    "list-tasks",
    "goals",
    "calendar",
    "account",
    "health",
    "quick-links",
    "activity",
  ],
  user: ["list-tasks", "goals", "calendar", "quick-links", "account", "health", "activity"],
};

/**
 * Curated layouts. "role" is the default, "advanced" exposes every widget the
 * role is allowed to see, while "private" keeps only personal productivity.
 */
const VARIANT_EXTRA: Record<LayoutVariant, string[]> = {
  role: [],
  executive: [
    "kpi-revenue",
    "kpi-deals",
    "kpi-invoices",
    "kpi-headcount",
    "kpi-payroll",
    "chart-revenue-expenses",
    "goals",
    "activity",
    "account",
    "health",
  ],
  advanced: [
    "kpi-headcount",
    "kpi-attendance",
    "kpi-screens",
    "kpi-payroll",
    "kpi-conversion",
    "kpi-domains",
    "list-leave",
    "list-tickets",
    "list-deals",
    "chart-revenue-expenses",
  ],
  private: ["list-tasks", "goals", "calendar", "quick-links", "account", "health"],
};

export const getWidget = (id: string): WidgetDef | undefined => WIDGET_BY_ID.get(id);

export const widgetsForRole = (role: DashboardRole): WidgetDef[] =>
  WIDGETS.filter((widget) => !widget.roles || widget.roles.includes(role));

export const defaultLayout = (role: DashboardRole, variant: LayoutVariant): string[] => {
  const allowed = new Set(widgetsForRole(role).map((widget) => widget.id));
  const base = variant === "role" ? ROLE_ORDER[role] : VARIANT_EXTRA[variant];
  const merged = variant === "advanced" ? [...ROLE_ORDER[role], ...base] : base;
  return [...new Set(merged)].filter((id) => allowed.has(id));
};

export interface StoredLayout {
  order?: string[];
  hidden?: string[];
}

export const resolveLayout = (
  role: DashboardRole,
  variant: LayoutVariant,
  stored?: StoredLayout | null,
): { order: string[]; hidden: string[] } => {
  const allowed = new Set(widgetsForRole(role).map((widget) => widget.id));
  const order = (stored?.order ?? []).filter((id) => allowed.has(id));
  for (const id of defaultLayout(role, variant)) {
    if (!order.includes(id)) {
      order.push(id);
    }
  }
  const hidden = (stored?.hidden ?? []).filter((id) => allowed.has(id) && order.includes(id));
  return { order, hidden };
};

export const normalizeDashboardRole = (role: string | undefined): DashboardRole => {
  const value = (role ?? "user").toLowerCase();
  if (value.includes("admin") || value.includes("owner") || value.includes("super")) {
    return "admin";
  }
  if (value.includes("manager") || value.includes("lead") || value.includes("director")) {
    return "manager";
  }
  if (value.includes("finance") || value.includes("accountant")) {
    return "finance";
  }
  if (value.includes("sale") || value.includes("account")) {
    return "sales";
  }
  if (value.includes("hr") || value.includes("people")) {
    return "hr";
  }
  if (value.includes("support") || value.includes("agent")) {
    return "support";
  }
  return "user";
};
