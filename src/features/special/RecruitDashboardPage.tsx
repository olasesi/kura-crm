import { Link } from "react-router-dom";

import { Icon } from "@/components/ui/Icon";
import { countByStatus, useRecords } from "@/features/dashboard/data";
import { useI18n } from "@/i18n/I18nProvider";
import { statusTone } from "@/modules/moduleUtils";
import type { ModuleDef, ModuleRecord } from "@/modules/types";

import { PageHeader, SummaryGrid } from "./ui";

interface RecruitDashboardPageProps {
  module: ModuleDef;
}

const STAGES = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"] as const;

const formatDate = (value: string | number | undefined): string => {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
};

export const RecruitDashboardPage = ({ module }: RecruitDashboardPageProps) => {
  const { t } = useI18n();
  const jobs = useRecords("jobs");
  const applications = useRecords("job-applications");
  const interviews = useRecords("interview-schedule");
  const offers = useRecords("offer-letters");

  const openJobs = jobs.filter((job) => String(job.status ?? "").toLowerCase() === "open");
  const openings = openJobs.reduce((total, job) => total + Number(job.openings ?? 0), 0);
  const hired = countByStatus(applications, ["hired"]);
  const activeApplications =
    applications.length - hired - countByStatus(applications, ["rejected"]);
  const scheduled = interviews.filter(
    (interview) => String(interview.status ?? "").toLowerCase() === "scheduled",
  );
  const acceptedOffers = countByStatus(offers, ["accepted"]);

  const stageRows = STAGES.map((stage) => ({
    stage,
    count: applications.filter(
      (application) => String(application.stage ?? "").toLowerCase() === stage.toLowerCase(),
    ).length,
  }));
  const maxStage = Math.max(1, ...stageRows.map((row) => row.count));

  const bySource = new Map<string, number>();
  for (const application of applications) {
    const source = String(application.source ?? "Careers site");
    bySource.set(source, (bySource.get(source) ?? 0) + 1);
  }

  return (
    <main className="page page--wide">
      <PageHeader
        eyebrow={t("nav.recruit")}
        title={t(`modules.${module.id}`, module.name)}
        description={module.description}
        actions={
          <>
            <Link to="/app/career-site" className="btn btn--secondary btn--sm">
              <span className="btn__icon">
                <Icon name="career" />
              </span>
              {t("special.careerTitle")}
            </Link>
            <Link to="/app/jobs" className="btn btn--sm">
              <span className="btn__icon">
                <Icon name="job" />
              </span>
              {t("modules.jobs")}
            </Link>
          </>
        }
      />

      <SummaryGrid
        items={[
          { label: "Open roles", value: String(openJobs.length), meta: `${openings} openings` },
          {
            label: "Active pipeline",
            value: String(activeApplications),
            meta: `${applications.length} applications`,
          },
          {
            label: "Interviews scheduled",
            value: String(scheduled.length),
            meta: `${interviews.length} total`,
          },
          {
            label: "Offers accepted",
            value: String(acceptedOffers),
            meta: `${offers.length} offers`,
          },
        ]}
      />

      <div className="special-grid">
        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Pipeline by stage</h2>
              <p className="card__subtitle">Candidate conversion across the funnel</p>
            </div>
          </div>
          <div className="card__body">
            <div className="report-bars">
              {stageRows.map((row) => (
                <div key={row.stage} className="report-bars__row">
                  <span className="report-bars__label">{row.stage}</span>
                  <span className="report-bars__track">
                    <span
                      className="report-bars__fill"
                      style={{ width: `${Math.max(2, (row.count / maxStage) * 100)}%` }}
                    />
                  </span>
                  <span className="report-bars__value">{row.count}</span>
                </div>
              ))}
            </div>

            <div className="report-bars" style={{ marginTop: "var(--space-5)" }}>
              {[...bySource.entries()].map(([source, count]) => (
                <div key={source} className="report-bars__row">
                  <span className="report-bars__label">{source}</span>
                  <span className="report-bars__track">
                    <span
                      className="report-bars__fill"
                      style={{
                        width: `${Math.max(2, (count / Math.max(1, applications.length)) * 100)}%`,
                      }}
                    />
                  </span>
                  <span className="report-bars__value">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="special-stack">
          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Open requisitions</h2>
                <p className="card__subtitle">Roles accepting applications</p>
              </div>
              <Link to="/app/jobs" className="btn btn--ghost btn--sm">
                {t("special.openModule")}
              </Link>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Role</th>
                    <th scope="col">Location</th>
                    <th scope="col">Openings</th>
                    <th scope="col">{t("common.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {openJobs.map((job: ModuleRecord) => (
                    <tr key={job.id}>
                      <td className="table__primary">{String(job.title)}</td>
                      <td>{String(job.location ?? "—")}</td>
                      <td>{Number(job.openings ?? 1)}</td>
                      <td>
                        <span className={`badge ${statusTone(job.status)}`}>
                          {String(job.status ?? "")}
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
                <h2 className="card__title">Next interviews</h2>
                <p className="card__subtitle">Panel schedule for the coming days</p>
              </div>
            </div>
            <div className="card__body">
              <ul className="event-list">
                {scheduled.slice(0, 5).map((interview: ModuleRecord) => (
                  <li key={interview.id} className="event-list__item">
                    <span className="event-list__date">{formatDate(interview.date)}</span>
                    <div>
                      <p className="event-list__title">{String(interview.candidate)}</p>
                      <p className="event-list__meta">
                        {String(interview.interviewer ?? "")} · {String(interview.mode ?? "")}
                      </p>
                    </div>
                    <span className={`badge ${statusTone(interview.status)}`}>
                      {String(interview.status ?? "")}
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

export default RecruitDashboardPage;
