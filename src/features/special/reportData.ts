import type { ModuleRecord } from "@/modules/types";

export interface ReportRow {
  label: string;
  value: number;
  meta?: string;
}

export interface ReportSummaryItem {
  label: string;
  value: string;
  meta?: string;
}

export type ReportValueFormat = "number" | "currency" | "hours";

export interface ReportResult {
  summary: ReportSummaryItem[];
  rows: ReportRow[];
  format: ReportValueFormat;
  rowLabel: string;
}

export interface ReportSources {
  tasks: ModuleRecord[];
  timesheets: ModuleRecord[];
  leaves: ModuleRecord[];
  attendance: ModuleRecord[];
  expenses: ModuleRecord[];
  deals: ModuleRecord[];
  invoices: ModuleRecord[];
  payments: ModuleRecord[];
  jobs: ModuleRecord[];
  applications: ModuleRecord[];
  screenshots: ModuleRecord[];
  attendanceLogs: ModuleRecord[];
  payrollRuns: ModuleRecord[];
  overtime: ModuleRecord[];
  purchaseOrders: ModuleRecord[];
  bills: ModuleRecord[];
}

const money = (value: number): string =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const number = (value: number): string =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);

const numeric = (value: string | number | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sum = (records: ModuleRecord[], key: string): number =>
  records.reduce((total, record) => total + numeric(record[key]), 0);

const withStatus = (records: ModuleRecord[], statuses: string[]): ModuleRecord[] => {
  const allowed = new Set(statuses.map((status) => status.toLowerCase()));
  return records.filter((record) => allowed.has(String(record.status ?? "").toLowerCase()));
};

const countBy = (records: ModuleRecord[], key: string): ReportRow[] => {
  const totals = new Map<string, number>();
  for (const record of records) {
    const label = String(record[key] ?? "Unassigned") || "Unassigned";
    totals.set(label, (totals.get(label) ?? 0) + 1);
  }
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value);
};

const sumBy = (records: ModuleRecord[], key: string, valueKey: string): ReportRow[] => {
  const totals = new Map<string, number>();
  for (const record of records) {
    const label = String(record[key] ?? "Unassigned") || "Unassigned";
    totals.set(label, (totals.get(label) ?? 0) + numeric(record[valueKey]));
  }
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value);
};

const share = (value: number, total: number): string => {
  if (total <= 0) {
    return "0%";
  }
  return `${Math.round((value / total) * 100)}%`;
};

const isOverdue = (record: ModuleRecord): boolean => {
  const raw = record.dueDate ?? record.date ?? record.endDate;
  const due = new Date(String(raw ?? ""));
  if (Number.isNaN(due.getTime())) {
    return false;
  }
  return due.getTime() < Date.now() && String(record.status ?? "").toLowerCase() !== "done";
};

const monthKey = (value: string | number | undefined): string => {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return new Intl.DateTimeFormat(undefined, { month: "short", year: "2-digit" }).format(date);
};

const monthly = (records: ModuleRecord[], valueKey: string): ReportRow[] => {
  const totals = new Map<string, number>();
  for (const record of records) {
    const key = monthKey(record.date ?? record.createdAt);
    totals.set(key, (totals.get(key) ?? 0) + numeric(record[valueKey]));
  }
  return [...totals.entries()].map(([label, value]) => ({ label, value })).reverse();
};

const sortRows = (rows: ReportRow[]): ReportRow[] =>
  [...rows].sort((left, right) => right.value - left.value);

/**
 * Builds every operational report from the same set of module records. The
 * switch keeps report metrics declarative and avoids one page per data shape.
 */
export const buildReport = (metric: string | undefined, sources: ReportSources): ReportResult => {
  switch (metric) {
    case "time": {
      const approved = withStatus(sources.timesheets, ["approved"]);
      const total = sum(sources.timesheets, "hours");
      return {
        summary: [
          { label: "Hours logged", value: `${number(total)} h` },
          { label: "Approved", value: `${number(sum(approved, "hours"))} h` },
          { label: "Timesheets", value: String(sources.timesheets.length) },
          {
            label: "Approval rate",
            value: share(approved.length, sources.timesheets.length),
          },
        ],
        rows: sumBy(sources.timesheets, "project", "hours"),
        format: "hours",
        rowLabel: "Project",
      };
    }
    case "weekly-timesheet": {
      const approved = withStatus(sources.timesheets, ["approved"]);
      const rows = sumBy(sources.timesheets, "week", "hours").sort((left, right) =>
        right.label.localeCompare(left.label),
      );
      return {
        summary: [
          { label: "Weeks tracked", value: String(rows.length) },
          { label: "Hours", value: `${number(sum(sources.timesheets, "hours"))} h` },
          { label: "Approved", value: `${number(sum(approved, "hours"))} h` },
          {
            label: "Submitted",
            value: String(withStatus(sources.timesheets, ["submitted"]).length),
          },
        ],
        rows,
        format: "hours",
        rowLabel: "Week starting",
      };
    }
    case "finance": {
      const collected = sum(withStatus(sources.payments, ["completed", "paid"]), "amount");
      const outstanding = sum(withStatus(sources.invoices, ["sent", "overdue"]), "amount");
      const spend = sum(withStatus(sources.expenses, ["approved", "reimbursed"]), "amount");
      const rows = ["Draft", "Sent", "Paid", "Overdue"].map((status) => ({
        label: status,
        value: sum(withStatus(sources.invoices, [status]), "amount"),
      }));
      return {
        summary: [
          { label: "Collected", value: money(collected) },
          {
            label: "Outstanding",
            value: money(outstanding),
            meta: `${withStatus(sources.invoices, ["sent", "overdue"]).length} invoices`,
          },
          { label: "Operating spend", value: money(spend) },
          { label: "Net position", value: money(collected - spend) },
        ],
        rows,
        format: "currency",
        rowLabel: "Invoice status",
      };
    }
    case "income-expense": {
      const income = monthly(withStatus(sources.payments, ["completed", "paid"]), "amount");
      const spendByMonth = new Map(
        monthly(withStatus(sources.expenses, ["approved", "reimbursed"]), "amount").map((row) => [
          row.label,
          row.value,
        ]),
      );
      const rows = income.map((row) => ({
        ...row,
        meta: `expenses ${money(spendByMonth.get(row.label) ?? 0)}`,
      }));
      const totalIncome = income.reduce((total, row) => total + row.value, 0);
      const totalSpend = [...spendByMonth.values()].reduce((total, value) => total + value, 0);
      return {
        summary: [
          { label: "Income", value: money(totalIncome) },
          { label: "Expenses", value: money(totalSpend) },
          { label: "Net", value: money(totalIncome - totalSpend) },
          {
            label: "Margin",
            value: totalIncome > 0 ? share(totalIncome - totalSpend, totalIncome) : "0%",
          },
        ],
        rows,
        format: "currency",
        rowLabel: "Month",
      };
    }
    case "leave": {
      return {
        summary: [
          { label: "Requests", value: String(sources.leaves.length) },
          { label: "Approved", value: String(withStatus(sources.leaves, ["approved"]).length) },
          { label: "Pending", value: String(withStatus(sources.leaves, ["pending"]).length) },
          { label: "Rejected", value: String(withStatus(sources.leaves, ["rejected"]).length) },
        ],
        rows: countBy(sources.leaves, "type"),
        format: "number",
        rowLabel: "Leave type",
      };
    }
    case "attendance": {
      const present = withStatus(sources.attendance, ["present", "remote"]);
      return {
        summary: [
          { label: "Records", value: String(sources.attendance.length) },
          { label: "Present", value: String(present.length) },
          { label: "Late", value: String(withStatus(sources.attendance, ["late"]).length) },
          { label: "Absent", value: String(withStatus(sources.attendance, ["absent"]).length) },
        ],
        rows: countBy(sources.attendance, "status"),
        format: "number",
        rowLabel: "Status",
      };
    }
    case "expense": {
      const approved = withStatus(sources.expenses, ["approved", "reimbursed"]);
      return {
        summary: [
          { label: "Total submitted", value: money(sum(sources.expenses, "amount")) },
          { label: "Approved", value: money(sum(approved, "amount")) },
          {
            label: "Pending",
            value: money(sum(withStatus(sources.expenses, ["pending"]), "amount")),
          },
          {
            label: "Average claim",
            value: money(
              sources.expenses.length > 0
                ? sum(sources.expenses, "amount") / sources.expenses.length
                : 0,
            ),
          },
        ],
        rows: sumBy(sources.expenses, "category", "amount"),
        format: "currency",
        rowLabel: "Category",
      };
    }
    case "deals": {
      const won = withStatus(sources.deals, ["won"]);
      const lost = withStatus(sources.deals, ["lost"]);
      const open = sources.deals.filter((record) =>
        ["open", "discovery", "proposal", "negotiation"].includes(
          String(record.status ?? "").toLowerCase(),
        ),
      );
      return {
        summary: [
          { label: "Pipeline value", value: money(sum(open, "value")) },
          { label: "Won", value: money(sum(won, "value")) },
          {
            label: "Win rate",
            value: share(won.length, won.length + lost.length),
          },
          { label: "Open deals", value: String(open.length) },
        ],
        rows: sumBy(sources.deals, "stage", "value"),
        format: "currency",
        rowLabel: "Stage",
      };
    }
    case "sales": {
      const paid = withStatus(sources.invoices, ["paid"]);
      const outstanding = withStatus(sources.invoices, ["sent", "overdue"]);
      return {
        summary: [
          { label: "Bookings", value: money(sum(sources.invoices, "amount")) },
          { label: "Collected", value: money(sum(paid, "amount")) },
          { label: "Outstanding", value: money(sum(outstanding, "amount")) },
          { label: "Invoices", value: String(sources.invoices.length) },
        ],
        rows: [
          { label: "Paid", value: sum(paid, "amount") },
          { label: "Sent", value: sum(withStatus(sources.invoices, ["sent"]), "amount") },
          { label: "Overdue", value: sum(withStatus(sources.invoices, ["overdue"]), "amount") },
          { label: "Draft", value: sum(withStatus(sources.invoices, ["draft"]), "amount") },
        ],
        format: "currency",
        rowLabel: "Status",
      };
    }
    case "recruit": {
      const openJobs = sources.jobs.filter(
        (record) => String(record.status ?? "").toLowerCase() === "open",
      );
      const openings = sum(openJobs, "openings");
      const hired = withStatus(sources.applications, ["hired"]);
      const rejected = withStatus(sources.applications, ["rejected"]);
      return {
        summary: [
          { label: "Open roles", value: String(openJobs.length) },
          { label: "Openings", value: String(openings) },
          { label: "Applications", value: String(sources.applications.length) },
          {
            label: "Offer acceptance",
            value: share(hired.length, hired.length + rejected.length),
          },
        ],
        rows: countBy(sources.applications, "stage"),
        format: "number",
        rowLabel: "Stage",
      };
    }
    case "monitoring": {
      const flagged = withStatus(sources.screenshots, ["flagged"]);
      const pending = withStatus(sources.screenshots, ["pending"]);
      const present = withStatus(sources.attendanceLogs, ["present", "late", "remote"]);
      return {
        summary: [
          { label: "Screenshots", value: String(sources.screenshots.length) },
          { label: "Pending review", value: String(pending.length) },
          { label: "Flagged", value: String(flagged.length) },
          {
            label: "Attendance",
            value: share(present.length, sources.attendanceLogs.length),
          },
        ],
        rows: countBy(sources.screenshots, "project"),
        format: "number",
        rowLabel: "Project",
      };
    }
    case "payroll": {
      const paid = withStatus(sources.payrollRuns, ["paid"]);
      const approvedOvertime = withStatus(sources.overtime, ["approved"]);
      return {
        summary: [
          { label: "Payroll cost", value: money(sum(sources.payrollRuns, "amount")) },
          { label: "Paid runs", value: String(paid.length) },
          { label: "Employees paid", value: String(sum(paid, "employees")) },
          { label: "Overtime hours", value: `${number(sum(approvedOvertime, "hours"))} h` },
        ],
        rows: sumBy(sources.payrollRuns, "period", "amount").sort((left, right) =>
          right.label.localeCompare(left.label),
        ),
        format: "currency",
        rowLabel: "Period",
      };
    }
    case "purchase": {
      const outstanding = withStatus(sources.bills, ["unpaid", "partial", "overdue"]);
      const ordered = sum(sources.purchaseOrders, "amount");
      const billed = sum(sources.bills, "amount");
      return {
        summary: [
          { label: "Ordered", value: money(ordered) },
          { label: "Billed", value: money(billed) },
          { label: "Outstanding", value: money(sum(outstanding, "amount")) },
          { label: "Purchase orders", value: String(sources.purchaseOrders.length) },
        ],
        rows: sumBy(sources.purchaseOrders, "vendor", "amount"),
        format: "currency",
        rowLabel: "Vendor",
      };
    }
    default: {
      const done = withStatus(sources.tasks, ["done"]);
      const high = sources.tasks.filter(
        (record) =>
          String(record.priority ?? "") === "High" &&
          String(record.status ?? "").toLowerCase() !== "done",
      );
      return {
        summary: [
          { label: "Tasks", value: String(sources.tasks.length) },
          { label: "Completed", value: share(done.length, sources.tasks.length) },
          { label: "Overdue", value: String(sources.tasks.filter(isOverdue).length) },
          { label: "High priority", value: String(high.length) },
        ],
        rows: sortRows(countBy(sources.tasks, "status")),
        format: "number",
        rowLabel: "Status",
      };
    }
  }
};

export const formatReportValue = (value: number, format: ReportValueFormat): string => {
  if (format === "currency") {
    return money(value);
  }
  if (format === "hours") {
    return `${number(value)} h`;
  }
  return number(value);
};
