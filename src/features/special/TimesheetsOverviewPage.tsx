import { useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { useRecords } from "@/features/dashboard/data";
import { useI18n } from "@/i18n/I18nProvider";
import { getModuleById } from "@/modules/registry";
import { statusTone } from "@/modules/moduleUtils";
import { updateRecord } from "@/modules/repository";
import type { ModuleDef, ModuleRecord } from "@/modules/types";

import { PageHeader, SummaryGrid } from "./ui";

interface TimesheetsPageProps {
  module: ModuleDef;
}

const formatDay = (value: string | number | undefined): string => {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime())
    ? String(value ?? "—")
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
};

export const TimesheetsOverviewPage = ({ module }: TimesheetsPageProps) => {
  const { t } = useI18n();
  const timesheets = useRecords("timesheets");
  const [toast, setToast] = useState<string | null>(null);
  const timesheetModule = getModuleById("timesheets");

  const approved = timesheets.filter(
    (record) => String(record.status ?? "").toLowerCase() === "approved",
  );
  const submitted = timesheets.filter(
    (record) => String(record.status ?? "").toLowerCase() === "submitted",
  );
  const totalHours = timesheets.reduce((total, record) => total + Number(record.hours ?? 0), 0);
  const approvedHours = approved.reduce((total, record) => total + Number(record.hours ?? 0), 0);

  const approve = (record: ModuleRecord) => {
    if (!timesheetModule) {
      return;
    }
    updateRecord(timesheetModule, record.id, { status: "Approved" });
    setToast(t("module.saved"));
  };

  return (
    <main className="page page--wide">
      <PageHeader
        eyebrow={t("nav.work")}
        title={t(`modules.${module.id}`, module.name)}
        description={t("special.timesheetText")}
      />

      <SummaryGrid
        items={[
          { label: "Total hours", value: `${Math.round(totalHours)} h` },
          { label: "Approved hours", value: `${Math.round(approvedHours)} h` },
          { label: "Awaiting approval", value: String(submitted.length) },
          {
            label: "Approval rate",
            value:
              timesheets.length > 0
                ? `${Math.round((approved.length / timesheets.length) * 100)}%`
                : "0%",
          },
        ]}
      />

      <section className="card">
        <div className="card__header">
          <div>
            <h2 className="card__title">{t("special.timesheetTitle")}</h2>
            <p className="card__subtitle">{t("special.timesheetText")}</p>
          </div>
          <span className="badge badge--accent">
            {timesheets.length} {t("reports.rows")}
          </span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t("fields.employee")}</th>
                <th scope="col">{t("fields.project")}</th>
                <th scope="col">{t("fields.date")}</th>
                <th scope="col" className="table__cell--right">
                  {t("fields.hours")}
                </th>
                <th scope="col">{t("common.status")}</th>
                <th scope="col" className="table__cell--right">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {timesheets.map((record) => (
                <tr key={record.id}>
                  <td className="table__primary">{String(record.employee)}</td>
                  <td>{String(record.project ?? "—")}</td>
                  <td>{formatDay(record.week)}</td>
                  <td className="table__cell--right">{Number(record.hours ?? 0)}</td>
                  <td>
                    <span className={`badge ${statusTone(record.status)}`}>
                      {String(record.status ?? "")}
                    </span>
                  </td>
                  <td className="table__cell--right">
                    {String(record.status ?? "").toLowerCase() === "submitted" ? (
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() => approve(record)}
                      >
                        <span className="btn__icon">
                          <Icon name="check" />
                        </span>
                        {t("common.confirm")}
                      </button>
                    ) : (
                      <span className="u-text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {toast ? (
        <div className="toast-stack">
          <div className="toast toast--success" role="status">
            <span className="alert__icon">✓</span>
            <span>{toast}</span>
            <button
              type="button"
              className="toast__close"
              aria-label={t("common.close")}
              onClick={() => setToast(null)}
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default TimesheetsOverviewPage;
