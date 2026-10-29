import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { I18nProvider, useI18n } from "./I18nProvider";

const Probe = () => {
  const { t, language, setLanguage, languages } = useI18n();
  return (
    <div>
      <p data-testid="language">{language}</p>
      <p data-testid="dashboard-label">{t("nav.dashboard")}</p>
      <p data-testid="fallback">{t("missing.key", "Fallback value")}</p>
      <p data-testid="count">{languages.length}</p>
      <button type="button" onClick={() => setLanguage("fr")}>
        Switch to French
      </button>
    </div>
  );
};

describe("I18nProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = "";
  });

  it("translates and switches language", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    expect(screen.getByTestId("dashboard-label")).toHaveTextContent("Dashboard");
    expect(screen.getByTestId("count")).toHaveTextContent("4");

    await user.click(screen.getByRole("button", { name: "Switch to French" }));

    expect(screen.getByTestId("language")).toHaveTextContent("fr");
    expect(screen.getByTestId("dashboard-label")).toHaveTextContent("Tableau de bord");
    expect(window.localStorage.getItem("kura-crm.language")).toBe("fr");
  });

  it("uses fallbacks for missing keys", () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId("fallback")).toHaveTextContent("Fallback value");
  });
});
