import { Link } from "react-router-dom";
import { useMemo } from "react";

import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/i18n/I18nProvider";
import { getVisibleModules } from "@/modules/registry";
import type { ModuleDef } from "@/modules/types";
import { useAuthStore } from "@/store/authStore";

import { PageHeader } from "./ui";

interface ReportsIndexPageProps {
  module: ModuleDef;
}

export const ReportsIndexPage = ({ module }: ReportsIndexPageProps) => {
  const { t } = useI18n();
  const role = useAuthStore((state) => state.user?.role);

  const reports = useMemo(
    () =>
      getVisibleModules(role).filter(
        (candidate) => candidate.group === "reports" && candidate.kind === "report",
      ),
    [role],
  );

  return (
    <main className="page page--wide">
      <PageHeader
        eyebrow={t("nav.overview")}
        title={t(`modules.${module.id}`, module.name)}
        description={t("reports.subtitle")}
      />

      <section className="report-grid" aria-label={t("reports.title")}>
        {reports.map((report) => (
          <Link key={report.id} to={`/app/${report.id}`} className="report-card">
            <span className="report-card__icon">
              <Icon name={report.icon} />
            </span>
            <span className="report-card__title">{t(`modules.${report.id}`, report.name)}</span>
            <span className="report-card__text">{report.description}</span>
            <span className="report-card__meta">
              {t("reports.run")} <Icon name="arrowRight" size={13} />
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
};

export default ReportsIndexPage;
