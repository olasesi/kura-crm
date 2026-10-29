import { useI18n } from "@/i18n/I18nProvider";
import { useRecords } from "@/features/dashboard/data";
import { statusTone } from "@/modules/moduleUtils";
import type { ModuleDef, ModuleRecord } from "@/modules/types";

import { PageHeader, SummaryGrid } from "./ui";

interface RoadmapPageProps {
  module: ModuleDef;
}

const formatDate = (value: string | number | undefined): string => {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
};

export const RoadmapPage = ({ module }: RoadmapPageProps) => {
  const { t } = useI18n();
  const projects = useRecords("projects");

  const active = projects.filter((project) =>
    ["active", "planning"].includes(String(project.status ?? "").toLowerCase()),
  );
  const completed = projects.filter(
    (project) => String(project.status ?? "").toLowerCase() === "completed",
  );
  const progress =
    projects.length > 0
      ? Math.round(
          projects.reduce((total, project) => total + Number(project.progress ?? 0), 0) /
            projects.length,
        )
      : 0;

  const ordered = [...projects].sort((left, right) =>
    String(left.endDate ?? "").localeCompare(String(right.endDate ?? "")),
  );

  return (
    <main className="page page--wide">
      <PageHeader
        eyebrow={t("nav.work")}
        title={t(`modules.${module.id}`, module.name)}
        description={t("special.roadmapText")}
      />

      <SummaryGrid
        items={[
          { label: "Projects", value: String(projects.length) },
          { label: "In flight", value: String(active.length) },
          { label: "Completed", value: String(completed.length) },
          { label: "Average progress", value: `${progress}%` },
        ]}
      />

      <section className="card">
        <div className="card__header">
          <div>
            <h2 className="card__title">{t("special.roadmapTitle")}</h2>
            <p className="card__subtitle">{t("special.roadmapText")}</p>
          </div>
        </div>
        <div className="card__body">
          <div className="roadmap">
            {ordered.map((project: ModuleRecord) => {
              const value = Math.min(100, Math.max(0, Number(project.progress ?? 0)));
              return (
                <article key={project.id} className="roadmap__row">
                  <div className="roadmap__head">
                    <div>
                      <p className="roadmap__title">{String(project.name)}</p>
                      <p className="roadmap__meta">
                        {String(project.client ?? "")} · {String(project.owner ?? "")} ·{" "}
                        {formatDate(project.endDate)}
                      </p>
                    </div>
                    <span className={`badge ${statusTone(project.status)}`}>
                      {String(project.status ?? "")}
                    </span>
                  </div>
                  <div className="roadmap__track">
                    <div className="roadmap__fill" style={{ width: `${value}%` }} />
                  </div>
                  <div className="roadmap__foot">
                    <span>{value}%</span>
                    <span>
                      {t("fields.budget")}: ${Number(project.budget ?? 0).toLocaleString()}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
};

export default RoadmapPage;
