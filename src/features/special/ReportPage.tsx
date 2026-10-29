import { useMemo, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { useRecords } from "@/features/dashboard/data";
import { useI18n } from "@/i18n/I18nProvider";
import { downloadCsv } from "@/modules/moduleUtils";
import type { ModuleDef } from "@/modules/types";

import { buildReport, formatReportValue } from "./reportData";
import { BarList, PageHeader, SummaryGrid } from "./ui";

interface ReportPageProps {
  module: ModuleDef;
}

export const ReportPage = ({ module }: ReportPageProps) => {
  const { t } = useI18n();
  const [period, setPeriod] = useState("30");

  const tasks = useRecords("tasks");
  const timesheets = useRecords("timesheets");
  const leaves = useRecords("leaves");
  const attendance = useRecords("attendance");
  const expenses = useRecords("expenses");
  const deals = useRecords("deals");
  const invoices = useRecords("invoices");
  const payments = useRecords("payments");
  const jobs = useRecords("jobs");
  const applications = useRecords("job-applications");
  const screenshots = useRecords("screenshots");
  const attendanceLogs = useRecords("attendance-logs");
  const payrollRuns = useRecords("payroll-runs");
  const overtime = useRecords("overtime-requests");
  const purchaseOrders = useRecords("purchase-orders");
  const bills = useRecords("bills");

  const report = useMemo(
    () =>
      buildReport(module.reportMetric, {
        tasks,
        timesheets,
        leaves,
        attendance,
        expenses,
        deals,
        invoices,
        payments,
        jobs,
        applications,
        screenshots,
        attendanceLogs,
        payrollRuns,
        overtime,
        purchaseOrders,
        bills,
      }),
    [
      applications,
      attendance,
      attendanceLogs,
      bills,
      deals,
      expenses,
      invoices,
      jobs,
      leaves,
      module.reportMetric,
      overtime,
      payments,
      payrollRuns,
      purchaseOrders,
      screenshots,
      tasks,
      timesheets,
    ],
  );

  const title = t(`modules.${module.id}`, module.name);

  const handleExport = () => {
    const lines = [
      `${report.rowLabel},Value`,
      ...report.rows.map((row) => `${row.label.replace(/,/g, " ")},${row.value}`),
    ];
    downloadCsv(`${module.id}.csv`, lines.join("\r\n"));
  };

  const periodLabel =
    period === "quarter"
      ? t("reports.quarter")
      : period === "year"
        ? t("reports.year")
        : t("reports.last30");

  return (
    <main className="page page--wide">
      <PageHeader
        eyebrow={t("reports.title")}
        title={title}
        description={module.description}
        actions={
          <>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => window.print()}
            >
              <span className="btn__icon">
                <Icon name="document" />
              </span>
              {t("special.letterPrint")}
            </button>
            <button type="button" className="btn btn--sm" onClick={handleExport}>
              <span className="btn__icon">
                <Icon name="download" />
              </span>
              {t("reports.export")}
            </button>
          </>
        }
      />

      <section className="toolbar">
        <div className="search-box" style={{ maxWidth: 240 }}>
          <span className="search-box__icon">
            <Icon name="calendar" />
          </span>
          <select
            className="select"
            aria-label={t("reports.period")}
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          >
            <option value="30">{t("reports.last30")}</option>
            <option value="quarter">{t("reports.quarter")}</option>
            <option value="year">{t("reports.year")}</option>
          </select>
        </div>
        <span className="toolbar__spacer" />
        <span className="u-text-muted" style={{ fontSize: "var(--text-xs)" }}>
          {t("reports.generated")} · {periodLabel}
        </span>
      </section>

      <SummaryGrid items={report.summary} />

      <div className="special-grid">
        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">{t("reports.breakdown")}</h2>
              <p className="card__subtitle">{report.rowLabel}</p>
            </div>
          </div>
          <div className="card__body">
            <BarList
              rows={report.rows}
              format={(value) => formatReportValue(value, report.format)}
            />
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">{t("reports.summary")}</h2>
              <p className="card__subtitle">
                {report.rows.length} {t("reports.rows")}
              </p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{report.rowLabel}</th>
                  <th scope="col" className="table__cell--right">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={row.label}>
                    <td className="table__primary">{row.label}</td>
                    <td className="table__cell--right">
                      {formatReportValue(row.value, report.format)}
                      {row.meta ? <span className="u-text-muted"> · {row.meta}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ReportPage;
