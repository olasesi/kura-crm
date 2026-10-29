import { Link } from "react-router-dom";

import { Icon } from "@/components/ui/Icon";
import { countByStatus, useRecords } from "@/features/dashboard/data";
import { useI18n } from "@/i18n/I18nProvider";
import { statusTone } from "@/modules/moduleUtils";
import type { ModuleDef, ModuleRecord } from "@/modules/types";

import { PageHeader, SummaryGrid } from "./ui";

interface MonitorCenterPageProps {
  module: ModuleDef;
}

const formatDate = (value: string | number | undefined): string => {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export const MonitorCenterPage = ({ module }: MonitorCenterPageProps) => {
  const { t } = useI18n();
  const devices = useRecords("biometric-devices");
  const screenshots = useRecords("screenshots");
  const policies = useRecords("agent-config");
  const analytics = useRecords("screen-analytics");

  const online = countByStatus(devices, ["online"]);
  const pending = countByStatus(screenshots, ["pending"]);
  const flagged = countByStatus(screenshots, ["flagged"]) + countByStatus(analytics, ["flagged"]);
  const activePolicies = countByStatus(policies, ["active"]);

  const recent = [...screenshots]
    .sort((left, right) =>
      String(right.capturedAt ?? "").localeCompare(String(left.capturedAt ?? "")),
    )
    .slice(0, 6);

  const utilisation = analytics.reduce(
    (total, record) => total + Number(record.activeHours ?? 0),
    0,
  );
  const averageUtilisation =
    analytics.length > 0 ? Math.round((utilisation / analytics.length) * 10) / 10 : 0;

  return (
    <main className="page page--wide">
      <PageHeader
        eyebrow={t("nav.monitoring")}
        title={t(`modules.${module.id}`, module.name)}
        description={module.description}
        actions={
          <Link to="/app/screenshots" className="btn btn--secondary btn--sm">
            <span className="btn__icon">
              <Icon name="screenshot" />
            </span>
            {t("modules.screenshots")}
          </Link>
        }
      />

      <SummaryGrid
        items={[
          {
            label: "Devices online",
            value: `${online}/${devices.length}`,
            meta: "Biometric terminals",
          },
          { label: "Screenshots pending", value: String(pending), meta: "Awaiting review" },
          { label: "Flagged activity", value: String(flagged), meta: "Needs attention" },
          {
            label: "Average active hours",
            value: `${averageUtilisation} h`,
            meta: `${activePolicies} active policies`,
          },
        ]}
      />

      <div className="special-grid">
        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Device health</h2>
              <p className="card__subtitle">Biometric terminals and their last sync</p>
            </div>
            <Link to="/app/biometric-devices" className="btn btn--ghost btn--sm">
              {t("special.openModule")}
            </Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Device</th>
                  <th scope="col">Location</th>
                  <th scope="col">{t("common.status")}</th>
                  <th scope="col">{t("dashboard.activity")}</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device: ModuleRecord) => (
                  <tr key={device.id}>
                    <td className="table__primary">{String(device.name)}</td>
                    <td>{String(device.location ?? "—")}</td>
                    <td>
                      <span className={`badge ${statusTone(device.status)}`}>
                        {String(device.status ?? "")}
                      </span>
                    </td>
                    <td>{formatDate(device.lastSync)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Screenshot review</h2>
              <p className="card__subtitle">Most recent captures across the workforce</p>
            </div>
            <Link to="/app/screenshots" className="btn btn--ghost btn--sm">
              {t("special.openModule")}
            </Link>
          </div>
          <div className="card__body">
            <ul className="event-list">
              {recent.map((shot: ModuleRecord) => (
                <li key={shot.id} className="event-list__item">
                  <span className="avatar avatar--sm">
                    {String(shot.employee ?? "?")
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part.charAt(0))
                      .join("")}
                  </span>
                  <div>
                    <p className="event-list__title">{String(shot.employee)}</p>
                    <p className="event-list__meta">
                      {String(shot.project ?? "Unassigned")} · {formatDate(shot.capturedAt)}
                    </p>
                  </div>
                  <span className={`badge ${statusTone(shot.status)}`}>
                    {String(shot.status ?? "")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card__header">
          <div>
            <h2 className="card__title">Agent policies</h2>
            <p className="card__subtitle">Rollout status across operating systems</p>
          </div>
          <Link to="/app/agent-download" className="btn btn--secondary btn--sm">
            <span className="btn__icon">
              <Icon name="download" />
            </span>
            {t("special.agentTitle")}
          </Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Policy</th>
                <th scope="col">Platform</th>
                <th scope="col">Version</th>
                <th scope="col">{t("common.status")}</th>
                <th scope="col">{t("common.updated")}</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy: ModuleRecord) => (
                <tr key={policy.id}>
                  <td className="table__primary">{String(policy.name)}</td>
                  <td>{String(policy.platform ?? "—")}</td>
                  <td>{String(policy.version ?? "—")}</td>
                  <td>
                    <span className={`badge ${statusTone(policy.status)}`}>
                      {String(policy.status ?? "")}
                    </span>
                  </td>
                  <td>{formatDate(policy.updated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default MonitorCenterPage;
