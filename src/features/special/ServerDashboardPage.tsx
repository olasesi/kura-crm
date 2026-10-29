import { Link } from "react-router-dom";

import { Icon } from "@/components/ui/Icon";
import { countByStatus, formatMoney, sumBy, useRecords } from "@/features/dashboard/data";
import { useI18n } from "@/i18n/I18nProvider";
import { statusTone } from "@/modules/moduleUtils";
import type { ModuleDef, ModuleRecord } from "@/modules/types";

import { PageHeader, SummaryGrid } from "./ui";

interface ServerDashboardPageProps {
  module: ModuleDef;
}

const formatDate = (value: string | number | undefined): string => {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
};

export const ServerDashboardPage = ({ module }: ServerDashboardPageProps) => {
  const { t } = useI18n();
  const hosting = useRecords("hosting");
  const domains = useRecords("domains");
  const providers = useRecords("providers");

  const hostingCost = sumBy(hosting, "cost");
  const providerCost = sumBy(providers, "cost");
  const expiringHosts = countByStatus(hosting, ["expiring", "expired"]);
  const expiringDomains = countByStatus(domains, ["expiring", "expired"]);
  const activeProviders = countByStatus(providers, ["active"]);

  return (
    <main className="page page--wide">
      <PageHeader
        eyebrow={t("nav.servers")}
        title={t(`modules.${module.id}`, module.name)}
        description={module.description}
        actions={
          <>
            <Link to="/app/hosting" className="btn btn--secondary btn--sm">
              <span className="btn__icon">
                <Icon name="hosting" />
              </span>
              {t("modules.hosting")}
            </Link>
            <Link to="/app/domains" className="btn btn--sm">
              <span className="btn__icon">
                <Icon name="domain" />
              </span>
              {t("modules.domains")}
            </Link>
          </>
        }
      />

      <SummaryGrid
        items={[
          {
            label: "Hosting spend",
            value: formatMoney(hostingCost),
            meta: `${hosting.length} hosts`,
          },
          {
            label: "Provider spend",
            value: formatMoney(providerCost),
            meta: `${activeProviders} active`,
          },
          {
            label: "Renewals due",
            value: String(expiringHosts + expiringDomains),
            meta: "Hosting and domains",
          },
          { label: "Domains", value: String(domains.length), meta: `${expiringDomains} expiring` },
        ]}
      />

      <div className="special-grid">
        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Hosting health</h2>
              <p className="card__subtitle">Plans, renewals and monthly cost</p>
            </div>
            <Link to="/app/hosting" className="btn btn--ghost btn--sm">
              {t("special.openModule")}
            </Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Host</th>
                  <th scope="col">Provider</th>
                  <th scope="col">Type</th>
                  <th scope="col">Renews</th>
                  <th scope="col">{t("common.status")}</th>
                  <th scope="col" className="table__cell--right">
                    {t("common.amount")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {hosting.map((host: ModuleRecord) => (
                  <tr key={host.id}>
                    <td className="table__primary">{String(host.name)}</td>
                    <td>{String(host.provider ?? "—")}</td>
                    <td>{String(host.type ?? "—")}</td>
                    <td>{formatDate(host.renewalDate)}</td>
                    <td>
                      <span className={`badge ${statusTone(host.status)}`}>
                        {String(host.status ?? "")}
                      </span>
                    </td>
                    <td className="table__cell--right">{formatMoney(Number(host.cost ?? 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Domain portfolio</h2>
              <p className="card__subtitle">Registrars and renewal windows</p>
            </div>
            <Link to="/app/domains" className="btn btn--ghost btn--sm">
              {t("special.openModule")}
            </Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Domain</th>
                  <th scope="col">Expires</th>
                  <th scope="col">Auto renew</th>
                  <th scope="col">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((domain: ModuleRecord) => (
                  <tr key={domain.id}>
                    <td className="table__primary">{String(domain.name)}</td>
                    <td>{formatDate(domain.expiry)}</td>
                    <td>{String(domain.autoRenew ?? "—")}</td>
                    <td>
                      <span className={`badge ${statusTone(domain.status)}`}>
                        {String(domain.status ?? "")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card__header">
          <div>
            <h2 className="card__title">Providers</h2>
            <p className="card__subtitle">Cloud, hosting and domain vendors</p>
          </div>
          <Link to="/app/providers" className="btn btn--secondary btn--sm">
            <span className="btn__icon">
              <Icon name="provider" />
            </span>
            {t("special.openModule")}
          </Link>
        </div>
        <div className="card__body">
          <div className="special-grid">
            {providers.map((provider: ModuleRecord) => (
              <article key={provider.id} className="tool-card">
                <span className="tool-card__icon">
                  <Icon name="provider" />
                </span>
                <span className="tool-card__title">{String(provider.name)}</span>
                <span className="tool-card__text">
                  {String(provider.service ?? "")} · {formatMoney(Number(provider.cost ?? 0))} /
                  month
                </span>
                <span className={`badge ${statusTone(provider.status)}`}>
                  {String(provider.status ?? "")}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ServerDashboardPage;
