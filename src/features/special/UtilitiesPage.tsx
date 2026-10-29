import { useI18n } from "@/i18n/I18nProvider";
import type { ModuleDef } from "@/modules/types";

import { PageHeader, ToolCard } from "./ui";

interface UtilitiesPageProps {
  module: ModuleDef;
}

const TOOLS = [
  {
    to: "/app/qr-code",
    icon: "qr" as const,
    titleKey: "special.tool.qr",
    textKey: "special.tool.qrText",
  },
  {
    to: "/app/letter-generator",
    icon: "letter" as const,
    titleKey: "special.tool.letters",
    textKey: "special.tool.lettersText",
  },
  {
    to: "/app/reports",
    icon: "report" as const,
    titleKey: "special.tool.export",
    textKey: "special.tool.exportText",
  },
  {
    to: "/app/project-roadmap",
    icon: "roadmap" as const,
    titleKey: "special.tool.roadmap",
    textKey: "special.tool.roadmapText",
  },
  {
    to: "/app/career-site",
    icon: "career" as const,
    titleKey: "special.tool.career",
    textKey: "special.tool.careerText",
  },
  {
    to: "/app/feedback-qr",
    icon: "qr" as const,
    titleKey: "special.tool.feedback",
    textKey: "special.tool.feedbackText",
  },
];

export const UtilitiesPage = ({ module }: UtilitiesPageProps) => {
  const { t } = useI18n();

  return (
    <main className="page page--wide">
      <PageHeader
        eyebrow={t("nav.overview")}
        title={t(`modules.${module.id}`, module.name)}
        description={t("special.utilitiesText")}
      />

      <section className="tool-grid" aria-label={t("special.utilitiesTitle")}>
        {TOOLS.map((tool) => (
          <ToolCard
            key={tool.to}
            to={tool.to}
            icon={tool.icon}
            title={t(tool.titleKey)}
            text={t(tool.textKey)}
          />
        ))}
      </section>

      <section className="card">
        <div className="card__header">
          <div>
            <h2 className="card__title">{t("settings.tab.appearance")}</h2>
            <p className="card__subtitle">{t("settings.appearance.text")}</p>
          </div>
        </div>
        <div className="card__body">
          <p className="u-text-muted">
            {t("settings.designHelp")} {t("nav.theme")}: {t("dashboard.design.studio")},{" "}
            {t("dashboard.design.compact")}, {t("dashboard.design.analytics")}.
          </p>
        </div>
      </section>
    </main>
  );
};

export default UtilitiesPage;
