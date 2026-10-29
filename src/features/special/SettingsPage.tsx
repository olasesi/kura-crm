import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/i18n/I18nProvider";
import type { ModuleDef } from "@/modules/types";
import { useAuthStore } from "@/store/authStore";
import { ACCENTS, DESIGNS, useTheme } from "@/theme/ThemeProvider";

import { PageHeader } from "./ui";

interface SettingsPageProps {
  module: ModuleDef;
}

type SettingsTab =
  "general" | "appearance" | "localization" | "notifications" | "roles" | "integrations";

const STORAGE_KEY = "kura-crm.settings";

interface WorkspaceSettings {
  workspaceName: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  notifications: Record<string, boolean>;
}

const DEFAULT_SETTINGS: WorkspaceSettings = {
  workspaceName: "Kura CRM",
  timezone: "UTC",
  dateFormat: "DD MMM YYYY",
  currency: "USD",
  notifications: {
    deals: true,
    invoices: true,
    tickets: false,
    mentions: true,
    digest: true,
  },
};

const readSettings = (): WorkspaceSettings => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw) as Partial<WorkspaceSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const ROLE_KEYS = ["admin", "manager", "sales", "finance", "hr", "support"] as const;

const INTEGRATIONS = [
  {
    id: "webhooks",
    icon: "webhook" as const,
    titleKey: "settings.integrations.webhooks",
    textKey: "settings.integrations.webhooksText",
  },
  {
    id: "graphql",
    icon: "link" as const,
    titleKey: "settings.integrations.graphql",
    textKey: "settings.integrations.graphqlText",
  },
  {
    id: "sso",
    icon: "shield" as const,
    titleKey: "settings.integrations.sso",
    textKey: "settings.integrations.ssoText",
  },
];

const NOTIFICATION_KEYS = [
  { id: "deals", labelKey: "settings.notif.deals" },
  { id: "invoices", labelKey: "settings.notif.invoices" },
  { id: "tickets", labelKey: "settings.notif.tickets" },
  { id: "mentions", labelKey: "settings.notif.mentions" },
  { id: "digest", labelKey: "settings.notif.digest" },
];

export const SettingsPage = ({ module }: SettingsPageProps) => {
  const { t, language, languages, setLanguage } = useI18n();
  const { colorMode, setColorMode, accent, setAccent, design, setDesign, resetTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [settings, setSettings] = useState<WorkspaceSettings>(readSettings);
  const [saved, setSaved] = useState(false);

  const tabs = useMemo(
    () =>
      [
        { id: "general", labelKey: "settings.tab.general", icon: "settings" as const },
        { id: "appearance", labelKey: "settings.tab.appearance", icon: "spark" as const },
        { id: "localization", labelKey: "settings.tab.localization", icon: "globe" as const },
        { id: "notifications", labelKey: "settings.tab.notifications", icon: "bell" as const },
        { id: "roles", labelKey: "settings.tab.roles", icon: "shield" as const },
        { id: "integrations", labelKey: "settings.tab.integrations", icon: "link" as const },
      ] satisfies Array<{
        id: SettingsTab;
        labelKey: string;
        icon: "settings" | "spark" | "globe" | "bell" | "shield" | "link";
      }>,
    [],
  );

  useEffect(() => {
    if (!saved) {
      return;
    }
    const timer = window.setTimeout(() => setSaved(false), 2600);
    return () => window.clearTimeout(timer);
  }, [saved]);

  const persist = (next: WorkspaceSettings) => {
    setSettings(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures; the in-memory value still applies.
    }
    setSaved(true);
  };

  const update = <Key extends keyof WorkspaceSettings>(key: Key, value: WorkspaceSettings[Key]) =>
    persist({ ...settings, [key]: value });

  const toggleNotification = (id: string) =>
    persist({
      ...settings,
      notifications: { ...settings.notifications, [id]: !settings.notifications[id] },
    });

  return (
    <main className="page page--wide">
      <PageHeader
        eyebrow={t("nav.overview")}
        title={t(`modules.${module.id}`, module.name)}
        description={t("settings.subtitle")}
        actions={
          saved ? (
            <span className="badge badge--success" role="status">
              {t("settings.saved")}
            </span>
          ) : undefined
        }
      />

      <div className="settings-layout">
        <nav className="settings-nav" aria-label={t("settings.title")}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`settings-nav__item ${activeTab === tab.id ? "settings-nav__item--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              <Icon name={tab.icon} size={15} />
              {t(tab.labelKey)}
            </button>
          ))}
        </nav>

        <div className="settings-section">
          {activeTab === "general" ? (
            <section className="settings-group">
              <h2 className="settings-group__title">{t("settings.general.title")}</h2>
              <p className="settings-group__text">{t("settings.general.text")}</p>
              <div className="settings-group__body">
                <div className="field">
                  <label className="field__label" htmlFor="workspace-name">
                    {t("settings.workspaceName")}
                  </label>
                  <input
                    id="workspace-name"
                    className="input"
                    value={settings.workspaceName}
                    onChange={(event) => update("workspaceName", event.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="workspace-timezone">
                    {t("settings.timezone")}
                  </label>
                  <select
                    id="workspace-timezone"
                    className="select"
                    value={settings.timezone}
                    onChange={(event) => update("timezone", event.target.value)}
                  >
                    {[
                      "UTC",
                      "Europe/London",
                      "Europe/Paris",
                      "Africa/Nairobi",
                      "America/New_York",
                      "Asia/Dubai",
                    ].map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="workspace-date">
                    {t("settings.dateFormat")}
                  </label>
                  <select
                    id="workspace-date"
                    className="select"
                    value={settings.dateFormat}
                    onChange={(event) => update("dateFormat", event.target.value)}
                  >
                    {["DD MMM YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD/MM/YYYY"].map((format) => (
                      <option key={format} value={format}>
                        {format}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="workspace-currency">
                    {t("settings.currency")}
                  </label>
                  <select
                    id="workspace-currency"
                    className="select"
                    value={settings.currency}
                    onChange={(event) => update("currency", event.target.value)}
                  >
                    {["USD", "EUR", "GBP", "KES", "TZS"].map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === "appearance" ? (
            <section className="settings-group">
              <h2 className="settings-group__title">{t("settings.appearance.title")}</h2>
              <p className="settings-group__text">{t("settings.appearance.text")}</p>
              <div className="settings-group__body">
                <div className="settings-row">
                  <div>
                    <p className="settings-row__label">{t("settings.colorMode")}</p>
                    <p className="settings-row__text">{colorMode === "dark" ? "Dark" : "Light"}</p>
                  </div>
                  <div className="segmented" role="group" aria-label={t("settings.colorMode")}>
                    {(["light", "dark"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={`segmented__item ${colorMode === mode ? "segmented__item--active" : ""}`}
                        onClick={() => setColorMode(mode)}
                        aria-pressed={colorMode === mode}
                      >
                        <Icon name={mode === "dark" ? "moon" : "sun"} size={14} />
                        {mode === "dark" ? "Dark" : "Light"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="settings-row">
                  <div>
                    <p className="settings-row__label">{t("settings.accent")}</p>
                    <p className="settings-row__text">
                      {ACCENTS.find((item) => item.id === accent)?.label}
                    </p>
                  </div>
                  <div className="swatches" role="group" aria-label={t("settings.accent")}>
                    {ACCENTS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`swatch ${accent === item.id ? "swatch--active" : ""}`}
                        style={{ backgroundColor: item.color }}
                        onClick={() => setAccent(item.id)}
                        aria-label={item.label}
                        aria-pressed={accent === item.id}
                      />
                    ))}
                  </div>
                </div>

                <div className="settings-row">
                  <div>
                    <p className="settings-row__label">{t("settings.design")}</p>
                    <p className="settings-row__text">{t("settings.designHelp")}</p>
                  </div>
                  <div className="segmented" role="group" aria-label={t("settings.design")}>
                    {DESIGNS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`segmented__item ${design === item.id ? "segmented__item--active" : ""}`}
                        onClick={() => setDesign(item.id)}
                        aria-pressed={design === item.id}
                      >
                        {t(`dashboard.design.${item.id}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="settings-row">
                  <div>
                    <p className="settings-row__label">{t("common.reset")}</p>
                    <p className="settings-row__text">{t("settings.appearance.text")}</p>
                  </div>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={resetTheme}>
                    <span className="btn__icon">
                      <Icon name="repeat" />
                    </span>
                    {t("common.reset")}
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === "localization" ? (
            <section className="settings-group">
              <h2 className="settings-group__title">{t("settings.localization.title")}</h2>
              <p className="settings-group__text">{t("settings.localization.text")}</p>
              <div className="settings-group__body">
                <div className="settings-row">
                  <div>
                    <p className="settings-row__label">{t("settings.interfaceLanguage")}</p>
                    <p className="settings-row__text">
                      {languages.find((item) => item.code === language)?.nativeLabel}
                    </p>
                  </div>
                  <div
                    className="segmented"
                    role="group"
                    aria-label={t("settings.interfaceLanguage")}
                  >
                    {languages.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        className={`segmented__item ${language === item.code ? "segmented__item--active" : ""}`}
                        onClick={() => setLanguage(item.code)}
                        aria-pressed={language === item.code}
                      >
                        {item.nativeLabel}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="settings-row">
                  <div>
                    <p className="settings-row__label">{t("settings.rtl")}</p>
                    <p className="settings-row__text">{t("common.notAvailable")}</p>
                  </div>
                  <span className="badge badge--warning">LTR</span>
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === "notifications" ? (
            <section className="settings-group">
              <h2 className="settings-group__title">{t("settings.notifications.title")}</h2>
              <p className="settings-group__text">{t("settings.notifications.text")}</p>
              <div className="settings-group__body">
                {NOTIFICATION_KEYS.map((item) => (
                  <div key={item.id} className="settings-row">
                    <div>
                      <p className="settings-row__label">{t(item.labelKey)}</p>
                      <p className="settings-row__text">Email and in-app</p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.notifications[item.id])}
                        aria-label={t(item.labelKey)}
                        onChange={() => toggleNotification(item.id)}
                      />
                      <span className="switch__track">
                        <span className="switch__thumb" />
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "roles" ? (
            <section className="settings-group">
              <h2 className="settings-group__title">{t("settings.roles.title")}</h2>
              <p className="settings-group__text">{t("settings.roles.text")}</p>
              <div className="settings-group__body">
                {user ? (
                  <div className="settings-row">
                    <div>
                      <p className="settings-row__label">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="settings-row__text">{user.email}</p>
                    </div>
                    <span className="badge badge--accent">{user.role}</span>
                  </div>
                ) : null}
                {ROLE_KEYS.map((role) => (
                  <div key={role} className="settings-row">
                    <div>
                      <p className="settings-row__label">{t(`roles.${role}`)}</p>
                      <p className="settings-row__text">{t(`settings.roles.${role}`)}</p>
                    </div>
                    <span className="badge">{t(`roles.${role}`)}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "integrations" ? (
            <section className="settings-group">
              <h2 className="settings-group__title">{t("settings.integrations.title")}</h2>
              <p className="settings-group__text">{t("settings.integrations.text")}</p>
              <div className="settings-group__body">
                {INTEGRATIONS.map((integration) => (
                  <div key={integration.id} className="settings-row">
                    <div className="settings-row__inline">
                      <span className="tool-card__icon">
                        <Icon name={integration.icon} size={18} />
                      </span>
                      <div>
                        <p className="settings-row__label">{t(integration.titleKey)}</p>
                        <p className="settings-row__text">{t(integration.textKey)}</p>
                      </div>
                    </div>
                    <div className="settings-row__actions">
                      <span className="badge badge--success">{t("settings.connected")}</span>
                      <button type="button" className="btn btn--secondary btn--sm">
                        {t("settings.configure")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
};

export default SettingsPage;
