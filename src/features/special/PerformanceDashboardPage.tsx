import { Link } from "react-router-dom";

import { Icon } from "@/components/ui/Icon";
import { countByStatus, useRecords } from "@/features/dashboard/data";
import { useI18n } from "@/i18n/I18nProvider";
import { statusTone } from "@/modules/moduleUtils";
import type { ModuleDef, ModuleRecord } from "@/modules/types";

import { PageHeader, SummaryGrid } from "./ui";

interface PerformanceDashboardPageProps {
  module: ModuleDef;
}

const average = (records: ModuleRecord[], key: string): number => {
  if (records.length === 0) {
    return 0;
  }
  return Math.round(
    records.reduce((total, record) => total + Number(record[key] ?? 0), 0) / records.length,
  );
};

const formatDate = (value: string | number | undefined): string => {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
};

export const PerformanceDashboardPage = ({ module }: PerformanceDashboardPageProps) => {
  const { t } = useI18n();
  const objectives = useRecords("objectives");
  const okrs = useRecords("okr-scores");
  const meetings = useRecords("one-on-ones");

  const averageProgress = average(objectives, "progress");
  const averageScore = average(okrs, "score");
  const atRisk = countByStatus(objectives, ["at risk", "off track"]);
  const onTrack = countByStatus(objectives, ["on track", "done"]);
  const scheduled = countByStatus(meetings, ["scheduled"]);

  const ordered = [...objectives].sort(
    (left, right) => Number(right.progress ?? 0) - Number(left.progress ?? 0),
  );

  return (
    <main className="page page--wide">
      <PageHeader
        eyebrow={t("nav.performance")}
        title={t(`modules.${module.id}`, module.name)}
        description={module.description}
        actions={
          <Link to="/app/objectives" className="btn btn--secondary btn--sm">
            <span className="btn__icon">
              <Icon name="objective" />
            </span>
            {t("modules.objectives")}
          </Link>
        }
      />

      <SummaryGrid
        items={[
          {
            label: "Average progress",
            value: `${averageProgress}%`,
            meta: `${objectives.length} objectives`,
          },
          { label: "OKR score", value: `${averageScore}%`, meta: `${okrs.length} key results` },
          { label: "On track", value: String(onTrack), meta: `${atRisk} at risk` },
          { label: "1:1s scheduled", value: String(scheduled), meta: `${meetings.length} total` },
        ]}
      />

      <div className="special-grid">
        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Objective health</h2>
              <p className="card__subtitle">Progress against the current quarter</p>
            </div>
          </div>
          <div className="card__body">
            <div className="roadmap">
              {ordered.map((objective: ModuleRecord) => {
                const value = Math.min(100, Math.max(0, Number(objective.progress ?? 0)));
                return (
                  <article key={objective.id} className="roadmap__row">
                    <div className="roadmap__head">
                      <div>
                        <p className="roadmap__title">{String(objective.title)}</p>
                        <p className="roadmap__meta">
                          {String(objective.owner ?? "Unassigned")} ·{" "}
                          {String(objective.quarter ?? "")} · {formatDate(objective.dueDate)}
                        </p>
                      </div>
                      <span className={`badge ${statusTone(objective.status)}`}>
                        {String(objective.status ?? "")}
                      </span>
                    </div>
                    <div className="roadmap__track">
                      <div className="roadmap__fill" style={{ width: `${value}%` }} />
                    </div>
                    <div className="roadmap__foot">
                      <span>{value}%</span>
                      <span>{String(objective.status ?? "")}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <div className="special-stack">
          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Key results</h2>
                <p className="card__subtitle">Weighted scores by objective</p>
              </div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Key result</th>
                    <th scope="col">Score</th>
                    <th scope="col">{t("common.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {okrs.map((okr: ModuleRecord) => (
                    <tr key={okr.id}>
                      <td className="table__primary">{String(okr.keyResult ?? okr.objective)}</td>
                      <td>{Number(okr.score ?? 0)}%</td>
                      <td>
                        <span className={`badge ${statusTone(okr.status)}`}>
                          {String(okr.status ?? "")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Upcoming 1:1s</h2>
                <p className="card__subtitle">Coaching conversations this cycle</p>
              </div>
            </div>
            <div className="card__body">
              <ul className="event-list">
                {meetings.slice(0, 5).map((meeting: ModuleRecord) => (
                  <li key={meeting.id} className="event-list__item">
                    <span className="event-list__date">{formatDate(meeting.date)}</span>
                    <div>
                      <p className="event-list__title">{String(meeting.employee)}</p>
                      <p className="event-list__meta">{String(meeting.manager ?? "")}</p>
                    </div>
                    <span className={`badge ${statusTone(meeting.status)}`}>
                      {String(meeting.status ?? "")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default PerformanceDashboardPage;
