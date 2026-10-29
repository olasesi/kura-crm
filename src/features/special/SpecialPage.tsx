import type { ModuleDef } from "@/modules/types";

import { AgentDownloadPage } from "./AgentDownloadPage";
import { CalendarPage } from "./CalendarPage";
import { CareerSitePage } from "./CareerSitePage";
import { LetterGeneratorPage } from "./LetterGeneratorPage";
import { MonitorCenterPage } from "./MonitorCenterPage";
import { PerformanceDashboardPage } from "./PerformanceDashboardPage";
import { QrPage } from "./QrPage";
import { RecruitDashboardPage } from "./RecruitDashboardPage";
import { ReportPage } from "./ReportPage";
import { ReportsIndexPage } from "./ReportsIndexPage";
import { RoadmapPage } from "./RoadmapPage";
import { ServerDashboardPage } from "./ServerDashboardPage";
import { SettingsPage } from "./SettingsPage";
import { TimesheetsOverviewPage } from "./TimesheetsOverviewPage";
import { UtilitiesPage } from "./UtilitiesPage";

interface SpecialPageProps {
  module: ModuleDef;
}

/**
 * Dispatches every non-CRUD module to its dedicated screen. Keeping the switch
 * in one place means the router only has to look up a module id.
 */
export const SpecialPage = ({ module }: SpecialPageProps) => {
  if (module.kind === "report") {
    return <ReportPage module={module} />;
  }

  switch (module.id) {
    case "calendar":
      return <CalendarPage module={module} />;
    case "utilities":
      return <UtilitiesPage module={module} />;
    case "qr-code":
    case "feedback-qr":
      return <QrPage module={module} />;
    case "letter-generator":
      return <LetterGeneratorPage module={module} />;
    case "project-roadmap":
      return <RoadmapPage module={module} />;
    case "timesheets-overview":
      return <TimesheetsOverviewPage module={module} />;
    case "career-site":
      return <CareerSitePage module={module} />;
    case "agent-download":
      return <AgentDownloadPage module={module} />;
    case "reports":
      return <ReportsIndexPage module={module} />;
    case "settings":
      return <SettingsPage module={module} />;
    case "monitor-center":
      return <MonitorCenterPage module={module} />;
    case "performance-dashboard":
      return <PerformanceDashboardPage module={module} />;
    case "recruit-dashboard":
      return <RecruitDashboardPage module={module} />;
    case "server-dashboard":
      return <ServerDashboardPage module={module} />;
    default:
      return <ReportPage module={module} />;
  }
};

export default SpecialPage;
