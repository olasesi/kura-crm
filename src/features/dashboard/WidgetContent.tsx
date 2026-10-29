import { useQuery } from "@tanstack/react-query";
import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";

import { Icon, type IconName } from "@/components/ui/Icon";
import { useI18n } from "@/i18n/I18nProvider";
import { api } from "@/lib/api";
import { statusTone } from "@/modules/moduleUtils";
import { useAuthStore } from "@/store/authStore";

import {
  countByStatus,
  currentMonthEventDays,
  formatCompactMoney,
  formatMoney,
  formatPercent,
  monthlyTotals,
  numberValue,
  percentChange,
  sortByDateAsc,
  sortByNumberDesc,
  sumBy,
  useRecords,
} from "./data";

interface KpiBodyProps {
  icon: IconName;
  label: string;
  value: string;
  meta?: string;
  trend?: number;
}

const KpiBody = ({ icon, label, value, meta, trend }: KpiBodyProps) => (
  <div className="widget-kpi">
    <div>
      <p className="kpi__label">{label}</p>
      <p className="kpi__value">{value}</p>
      {trend !== undefined ? (
        <p className={`trend ${trend >= 0 ? "trend--up" : "trend--down"}`}>
          <Icon name={trend >= 0 ? "arrowUp" : "arrowDown"} size={12} />
          {Math.abs(Math.round(trend))}% <span className="u-text-muted">vs last month</span>
        </p>
      ) : meta ? (
        <p className="kpi__meta">{meta}</p>
      ) : null}
    </div>
    <span className="widget-kpi__icon">
      <Icon name={icon} />
    </span>
  </div>
);

const WidgetLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="widget__footer-link">
    {children}
    <Icon name="arrowRight" size={13} />
  </Link>
);

const RevenueWidget = () => {
  const { t } = useI18n();
  const payments = useRecords("payments");
  const points = monthlyTotals(payments, "amount", 2, (record) =>
    ["completed", "paid"].includes(String(record.status ?? "").toLowerCase()),
  );
  const current = points[points.length - 1]?.total ?? 0;
  const previous = points[0]?.total ?? 0;
  return (
    <KpiBody
      icon="bank"
      label={t("dashboard.kpi.revenue")}
      value={formatCompactMoney(current)}
      trend={percentChange(current, previous)}
    />
  );
};

const DealsWidget = () => {
  const { t } = useI18n();
  const deals = useRecords("deals");
  const open = deals.filter((record) =>
    ["open", "discovery", "proposal", "negotiation"].includes(
      String(record.status ?? "").toLowerCase(),
    ),
  );
  return (
    <KpiBody
      icon="handshake"
      label={t("dashboard.kpi.deals")}
      value={String(open.length)}
      meta={`${formatCompactMoney(sumBy(open, "value"))} ${t("dashboard.pipeline").toLowerCase()}`}
    />
  );
};

const InvoicesWidget = () => {
  const { t } = useI18n();
  const invoices = useRecords("invoices");
  const outstanding = invoices.filter((record) =>
    ["sent", "overdue", "draft"].includes(String(record.status ?? "").toLowerCase()),
  );
  return (
    <KpiBody
      icon="invoice"
      label={t("dashboard.kpi.invoices")}
      value={formatCompactMoney(sumBy(outstanding, "amount"))}
      meta={`${outstanding.length} ${t("reports.rows")}`}
    />
  );
};

const HeadcountWidget = () => {
  const { t } = useI18n();
  const employees = useRecords("employees");
  const active = countByStatus(employees, ["active"]);
  return (
    <KpiBody
      icon="employee"
      label={t("dashboard.kpi.headcount")}
      value={String(employees.length)}
      meta={`${active} ${t("dashboard.people")} ${t("common.actions").toLowerCase()}`}
    />
  );
};

const TicketsWidget = () => {
  const { t } = useI18n();
  const tickets = useRecords("tickets");
  const open = countByStatus(tickets, ["open", "in progress"]);
  const high = tickets.filter(
    (record) =>
      String(record.priority ?? "") === "High" &&
      !["resolved", "closed"].includes(String(record.status ?? "").toLowerCase()),
  ).length;
  return (
    <KpiBody
      icon="ticket"
      label={t("dashboard.kpi.tickets")}
      value={String(open)}
      meta={`${high} high priority`}
    />
  );
};

const AttendanceWidget = () => {
  const { t } = useI18n();
  const attendance = useRecords("attendance");
  const present = countByStatus(attendance, ["present", "remote"]);
  const rate = attendance.length > 0 ? (present / attendance.length) * 100 : 0;
  return (
    <KpiBody
      icon="attendance"
      label={t("dashboard.kpi.attendance")}
      value={formatPercent(rate)}
      meta={`${attendance.length} ${t("dashboard.thisWeek").toLowerCase()}`}
    />
  );
};

const ConversionWidget = () => {
  const { t } = useI18n();
  const leads = useRecords("leads");
  const qualified = countByStatus(leads, ["qualified"]);
  const rate = leads.length > 0 ? (qualified / leads.length) * 100 : 0;
  return (
    <KpiBody
      icon="target"
      label={t("dashboard.kpi.conversion")}
      value={formatPercent(rate)}
      meta={`${qualified} / ${leads.length}`}
    />
  );
};

const PayrollWidget = () => {
  const { t } = useI18n();
  const runs = useRecords("payroll-runs");
  const latest = [...runs].sort((left, right) =>
    String(right.date ?? "").localeCompare(String(left.date ?? "")),
  )[0];
  return (
    <KpiBody
      icon="payroll"
      label={t("dashboard.kpi.payroll")}
      value={formatCompactMoney(latest ? numberValue(latest.amount) : 0)}
      meta={String(latest?.period ?? latest?.name ?? t("dashboard.thisMonth"))}
    />
  );
};

const ScreensWidget = () => {
  const { t } = useI18n();
  const screenshots = useRecords("screenshots");
  const pending = countByStatus(screenshots, ["pending"]);
  return (
    <KpiBody
      icon="screenshot"
      label={t("dashboard.kpi.screens")}
      value={String(screenshots.length)}
      meta={`${pending} pending review`}
    />
  );
};

const DomainsWidget = () => {
  const { t } = useI18n();
  const domains = useRecords("domains");
  const due = countByStatus(domains, ["expiring", "expired"]);
  return (
    <KpiBody
      icon="domain"
      label={t("dashboard.kpi.domains")}
      value={String(due)}
      meta={`${domains.length} ${t("modules.domains").toLowerCase()}`}
    />
  );
};

const RevenueExpensesWidget = () => {
  const { t } = useI18n();
  const payments = useRecords("payments");
  const expenses = useRecords("expenses");
  const revenue = monthlyTotals(payments, "amount", 6, (record) =>
    ["completed", "paid"].includes(String(record.status ?? "").toLowerCase()),
  );
  const spend = monthlyTotals(expenses, "amount", 6, (record) =>
    ["approved", "reimbursed"].includes(String(record.status ?? "").toLowerCase()),
  );
  const max = Math.max(
    1,
    ...revenue.map((point) => point.total),
    ...spend.map((point) => point.total),
  );

  return (
    <div>
      <div className="chart">
        {revenue.map((point, index) => (
          <div key={point.key} className="chart__col">
            <div className="chart__pair">
              <span
                className="chart__bar"
                style={{ height: `${Math.max(4, (point.total / max) * 100)}%` }}
                title={`${point.label}: ${formatMoney(point.total)}`}
              />
              <span
                className="chart__bar chart__bar--muted"
                style={{ height: `${Math.max(4, ((spend[index]?.total ?? 0) / max) * 100)}%` }}
                title={`${point.label}: ${formatMoney(spend[index]?.total ?? 0)}`}
              />
            </div>
            <span className="chart__label">{point.label}</span>
          </div>
        ))}
      </div>
      <div className="chart__legend">
        <span>
          <i className="chart__dot" /> {t("dashboard.revenue")}
        </span>
        <span>
          <i className="chart__dot chart__dot--muted" /> {t("dashboard.expenses")}
        </span>
        <Link to="/app/report-income-expense" className="chart__legend-link">
          {t("reports.run")}
        </Link>
      </div>
    </div>
  );
};

const RecentDealsWidget = () => {
  const { t } = useI18n();
  const deals = useRecords("deals");
  const rows = sortByNumberDesc(deals, "value").slice(0, 4);
  return (
    <div className="widget-list">
      {rows.map((record) => (
        <div key={record.id} className="widget-list__item">
          <div className="widget-list__main">
            <p className="widget-list__title">{String(record.name ?? record.company)}</p>
            <p className="widget-list__meta">
              {String(record.company ?? "")} · {String(record.stage ?? record.status ?? "")}
            </p>
          </div>
          <span className="widget-list__value">
            {formatCompactMoney(numberValue(record.value))}
          </span>
        </div>
      ))}
      <WidgetLink to="/app/deals">{t("common.view")}</WidgetLink>
    </div>
  );
};

const TasksWidget = () => {
  const { t } = useI18n();
  const tasks = useRecords("tasks");
  const rows = sortByDateAsc(
    tasks.filter((record) => String(record.status ?? "").toLowerCase() !== "done"),
    "dueDate",
  ).slice(0, 4);
  return (
    <div className="widget-list">
      {rows.map((record) => (
        <div key={record.id} className="widget-list__item">
          <div className="widget-list__main">
            <p className="widget-list__title">{String(record.title)}</p>
            <p className="widget-list__meta">
              {String(record.project ?? "")} · {String(record.dueDate ?? "")}
            </p>
          </div>
          <span className={`badge ${statusTone(record.priority)}`}>
            {String(record.priority ?? "")}
          </span>
        </div>
      ))}
      <WidgetLink to="/app/tasks">{t("common.view")}</WidgetLink>
    </div>
  );
};

const OpenTicketsWidget = () => {
  const { t } = useI18n();
  const tickets = useRecords("tickets");
  const rows = tickets
    .filter((record) => ["open", "in progress"].includes(String(record.status ?? "").toLowerCase()))
    .slice(0, 4);
  return (
    <div className="widget-list">
      {rows.map((record) => (
        <div key={record.id} className="widget-list__item">
          <div className="widget-list__main">
            <p className="widget-list__title">{String(record.subject)}</p>
            <p className="widget-list__meta">
              {String(record.customer ?? "")} · {String(record.assignee ?? "")}
            </p>
          </div>
          <span className={`badge ${statusTone(record.priority)}`}>
            {String(record.priority ?? "")}
          </span>
        </div>
      ))}
      <WidgetLink to="/app/tickets">{t("common.view")}</WidgetLink>
    </div>
  );
};

const LeaveWidget = () => {
  const { t } = useI18n();
  const leaves = useRecords("leaves");
  const rows = leaves
    .filter((record) => String(record.status ?? "").toLowerCase() === "pending")
    .slice(0, 4);
  return (
    <div className="widget-list">
      {rows.length === 0 ? (
        <p className="u-text-muted">{t("module.emptyTitle")}</p>
      ) : (
        rows.map((record) => (
          <div key={record.id} className="widget-list__item">
            <div className="widget-list__main">
              <p className="widget-list__title">{String(record.employee)}</p>
              <p className="widget-list__meta">
                {String(record.type ?? "")} · {String(record.from ?? "")}
              </p>
            </div>
            <span className="badge badge--warning">{t("module.activeRecords")}</span>
          </div>
        ))
      )}
      <WidgetLink to="/app/leaves">{t("common.view")}</WidgetLink>
    </div>
  );
};

const GoalsWidget = () => {
  const { t } = useI18n();
  const objectives = useRecords("objectives");
  return (
    <div className="u-stack">
      {objectives.slice(0, 3).map((record) => {
        const progress = Math.min(100, Math.max(0, numberValue(record.progress)));
        return (
          <div key={record.id}>
            <div className="u-spread">
              <p className="widget-list__title">{String(record.title)}</p>
              <span className="widget-list__meta">{progress}%</span>
            </div>
            <div className="progress">
              <div
                className={`progress__bar ${
                  progress < 40
                    ? "progress__bar--warning"
                    : progress > 80
                      ? "progress__bar--success"
                      : ""
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      })}
      <WidgetLink to="/app/objectives">{t("common.view")}</WidgetLink>
    </div>
  );
};

const CalendarWidget = () => {
  const { t } = useI18n();
  const events = useRecords("events");
  const eventDays = currentMonthEventDays(events, "startDate");
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) =>
    index < firstWeekday ? null : index - firstWeekday + 1,
  );
  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div>
      <p className="widget-list__meta">
        {new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(now)}
      </p>
      <div className="widget-calendar" aria-label={t("dashboard.calendar")}>
        {weekdays.map((day, index) => (
          <span key={`${day}-${index}`} className="widget-calendar__weekday">
            {day}
          </span>
        ))}
        {cells.map((day, index) =>
          day ? (
            <span
              key={`${month}-${day}-${index}`}
              className={`widget-calendar__day ${
                day === now.getDate() ? "widget-calendar__day--today" : ""
              } ${eventDays.has(day) && day !== now.getDate() ? "widget-calendar__day--event" : ""}`}
            >
              {day}
            </span>
          ) : (
            <span key={`empty-${index}`} />
          ),
        )}
      </div>
      <WidgetLink to="/app/calendar">{t("common.view")}</WidgetLink>
    </div>
  );
};

const AccountWidget = () => {
  const { t } = useI18n();
  const user = useAuthStore((state) => state.user);
  const name = user ? `${user.firstName} ${user.lastName}` : t("roles.user");
  return (
    <div className="widget-account">
      <span className="avatar avatar--lg">
        {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : "KU"}
      </span>
      <div>
        <p className="widget-account__name">{name}</p>
        <p className="widget-account__meta">{user?.email ?? "demo@kura-crm.com"}</p>
        <p className="widget-account__meta">{user?.role ?? "user"}</p>
      </div>
    </div>
  );
};

interface HealthResponse {
  success: boolean;
  status: string;
  uptime: number;
  checks: Record<string, string>;
}

const fetchHealth = async (): Promise<HealthResponse> => {
  const { data } = await api.get<HealthResponse>("/health");
  return data;
};

const HealthWidget = () => {
  const { t } = useI18n();
  // Retry policy comes from the shared QueryClient so tests and production can
  // tune it in one place.
  const { data, isError } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  if (isError) {
    return <p className="alert alert--danger">{t("dashboard.healthError")}</p>;
  }

  const checks = Object.entries(data?.checks ?? {});
  return (
    <div className="widget-health">
      <div className="widget-health__row">
        <span className="widget-health__label">{t("dashboard.healthStatus")}</span>
        <span className="widget-health__value">{data?.status ?? t("common.loading")}</span>
      </div>
      {checks.map(([key, value]) => (
        <div key={key} className="widget-health__row">
          <span className="widget-health__label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
          <span
            className={`widget-health__value ${
              value === "connected" || value === "healthy" ? "" : "widget-health__value--down"
            }`}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
};

const QUICK_LINKS = [
  { to: "/app/tasks", key: "modules.tasks", icon: "task" as IconName },
  { to: "/app/projects", key: "modules.projects", icon: "project" as IconName },
  { to: "/app/invoices", key: "modules.invoices", icon: "invoice" as IconName },
  { to: "/app/reports", key: "modules.reports", icon: "report" as IconName },
  { to: "/app/calendar", key: "modules.calendar", icon: "calendar" as IconName },
  { to: "/app/customers", key: "modules.customers", icon: "users" as IconName },
];

const QuickLinksWidget = () => {
  const { t } = useI18n();
  return (
    <div className="widget-links">
      {QUICK_LINKS.map((link) => (
        <Link key={link.to} to={link.to} className="widget-link">
          <Icon name={link.icon} />
          <span className="u-truncate">{t(link.key)}</span>
        </Link>
      ))}
    </div>
  );
};

const ActivityWidget = () => {
  const { t } = useI18n();
  const tasks = useRecords("tasks");
  const tickets = useRecords("tickets");
  const events = useRecords("events");
  const activity = [
    ...tasks.map((record) => ({
      id: record.id,
      title: String(record.title),
      meta: t("modules.tasks"),
      updated: String(record.updatedAt ?? ""),
    })),
    ...tickets.map((record) => ({
      id: record.id,
      title: String(record.subject),
      meta: t("modules.tickets"),
      updated: String(record.updatedAt ?? ""),
    })),
    ...events.map((record) => ({
      id: record.id,
      title: String(record.title),
      meta: t("modules.events"),
      updated: String(record.updatedAt ?? ""),
    })),
  ]
    .sort((left, right) => right.updated.localeCompare(left.updated))
    .slice(0, 5);

  return (
    <div className="widget-list">
      {activity.map((item) => (
        <div key={`${item.meta}-${item.id}`} className="widget-list__item">
          <span className="avatar avatar--sm">{item.title.slice(0, 2).toUpperCase()}</span>
          <div className="widget-list__main">
            <p className="widget-list__title">{item.title}</p>
            <p className="widget-list__meta">{item.meta}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export const WIDGET_CONTENT: Record<string, ComponentType> = {
  "kpi-revenue": RevenueWidget,
  "kpi-deals": DealsWidget,
  "kpi-invoices": InvoicesWidget,
  "kpi-headcount": HeadcountWidget,
  "kpi-tickets": TicketsWidget,
  "kpi-attendance": AttendanceWidget,
  "kpi-conversion": ConversionWidget,
  "kpi-payroll": PayrollWidget,
  "kpi-screens": ScreensWidget,
  "kpi-domains": DomainsWidget,
  "chart-revenue-expenses": RevenueExpensesWidget,
  "list-deals": RecentDealsWidget,
  "list-tasks": TasksWidget,
  "list-tickets": OpenTicketsWidget,
  "list-leave": LeaveWidget,
  goals: GoalsWidget,
  calendar: CalendarWidget,
  account: AccountWidget,
  health: HealthWidget,
  "quick-links": QuickLinksWidget,
  activity: ActivityWidget,
};

export const getWidgetContent = (id: string): ComponentType | undefined =>
  WIDGET_CONTENT[id] ?? undefined;
