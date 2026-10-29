import { useI18n } from "@/i18n/I18nProvider";
import { useRecords } from "@/features/dashboard/data";
import type { ModuleDef, ModuleRecord } from "@/modules/types";

import { PageHeader, SummaryGrid } from "./ui";

interface CareerSitePageProps {
  module: ModuleDef;
}

export const CareerSitePage = ({ module }: CareerSitePageProps) => {
  const { t } = useI18n();
  const jobs = useRecords("jobs");

  const open = jobs.filter((job) => String(job.status ?? "").toLowerCase() === "open");
  const openings = open.reduce((total, job) => total + Number(job.openings ?? 0), 0);
  const departments = new Set(open.map((job) => String(job.department ?? "")));
  const locations = new Set(open.map((job) => String(job.location ?? "")));

  return (
    <main className="page page--wide">
      <PageHeader
        eyebrow={t("nav.recruit")}
        title={t(`modules.${module.id}`, module.name)}
        description={t("special.careerText")}
      />

      <section className="career-hero">
        <p className="page__eyebrow">{t("app.tagline")}</p>
        <h2 className="career-hero__title">{t("special.careerTitle")}</h2>
        <p className="career-hero__text">{t("special.careerText")}</p>
      </section>

      <SummaryGrid
        items={[
          { label: "Open roles", value: String(open.length) },
          { label: "Openings", value: String(openings) },
          { label: "Departments", value: String(departments.size) },
          { label: "Locations", value: String(locations.size) },
        ]}
      />

      <section className="career-grid" aria-label={t("special.careerTitle")}>
        {open.map((job: ModuleRecord) => (
          <article key={job.id} className="career-card">
            <div className="career-card__head">
              <span className="career-card__icon">K</span>
              <span className="badge badge--success">{String(job.type ?? "Full-time")}</span>
            </div>
            <h3 className="career-card__title">{String(job.title)}</h3>
            <p className="career-card__meta">
              {String(job.department ?? "")} · {String(job.location ?? "")} ·{" "}
              {Number(job.openings ?? 1)} openings
            </p>
            <p className="career-card__text">{String(job.description ?? "")}</p>
            <a
              className="btn btn--sm"
              href={`mailto:careers@kura-crm.com?subject=${encodeURIComponent(
                `Application: ${String(job.title)}`,
              )}`}
            >
              Apply now
            </a>
          </article>
        ))}
      </section>
    </main>
  );
};

export default CareerSitePage;
