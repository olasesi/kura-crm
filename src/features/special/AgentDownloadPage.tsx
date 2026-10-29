import { Icon, type IconName } from "@/components/ui/Icon";
import { useI18n } from "@/i18n/I18nProvider";
import type { ModuleDef } from "@/modules/types";

import { PageHeader } from "./ui";

interface AgentDownloadPageProps {
  module: ModuleDef;
}

interface Platform {
  id: string;
  name: string;
  file: string;
  icon: IconName;
  note: string;
  primary?: boolean;
}

const PLATFORMS: Platform[] = [
  {
    id: "windows",
    name: "Windows",
    file: "kura-agent-windows-x64.msi",
    icon: "monitor",
    note: "Windows 10 and 11 · 64-bit",
    primary: true,
  },
  {
    id: "macos",
    name: "macOS",
    file: "kura-agent-macos-universal.pkg",
    icon: "device",
    note: "macOS 12 Monterey or later",
  },
  {
    id: "linux",
    name: "Linux",
    file: "kura-agent-linux-x86_64.deb",
    icon: "server",
    note: "Ubuntu 20.04+, Debian 11+",
  },
];

const downloadPlaceholder = (file: string) => {
  const content = [
    "Kura CRM monitoring agent",
    "=========================",
    "",
    `Installer: ${file}`,
    "This is a demo installer generated locally by the Kura CRM frontend.",
    "In production this endpoint serves a code-signed binary from the release bucket.",
    "",
    `Issued: ${new Date().toISOString()}`,
  ].join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${file}.txt`;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const AgentDownloadPage = ({ module }: AgentDownloadPageProps) => {
  const { t } = useI18n();

  return (
    <main className="page page--wide">
      <PageHeader
        eyebrow={t("nav.monitoring")}
        title={t(`modules.${module.id}`, module.name)}
        description={t("special.agentText")}
      />

      <div className="download-layout">
        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">{t("special.agentTitle")}</h2>
              <p className="card__subtitle">{t("special.agentText")}</p>
            </div>
          </div>
          <div className="card__body download-grid">
            {PLATFORMS.map((platform) => (
              <article key={platform.id} className="download-card">
                <span className="download-card__icon">
                  <Icon name={platform.icon} />
                </span>
                <h3 className="download-card__title">{platform.name}</h3>
                <p className="download-card__text">{platform.note}</p>
                <button
                  type="button"
                  className={`btn btn--sm ${platform.primary ? "" : "btn--secondary"}`}
                  onClick={() => downloadPlaceholder(platform.file)}
                >
                  <span className="btn__icon">
                    <Icon name="download" />
                  </span>
                  {t("common.download" in {} ? "Download" : "Download")}
                </button>
                <code className="download-card__file">{platform.file}</code>
              </article>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Requirements</h2>
              <p className="card__subtitle">Before you install the agent</p>
            </div>
          </div>
          <div className="card__body">
            <ul className="check-list">
              <li>
                <Icon name="check" size={15} /> Administrator rights on the device
              </li>
              <li>
                <Icon name="check" size={15} /> Outbound HTTPS access to your Kura workspace
              </li>
              <li>
                <Icon name="check" size={15} /> A device enrollment token from{" "}
                <strong>{t("modules.agent-config")}</strong>
              </li>
              <li>
                <Icon name="check" size={15} /> Employee mapping completed for attendance sync
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AgentDownloadPage;
