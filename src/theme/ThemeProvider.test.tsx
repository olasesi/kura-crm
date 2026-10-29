import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { ThemeProvider, useTheme } from "./ThemeProvider";

const Probe = () => {
  const { colorMode, accent, design, toggleColorMode, setAccent, setDesign, resetTheme } =
    useTheme();
  return (
    <div>
      <p data-testid="mode">{colorMode}</p>
      <p data-testid="accent">{accent}</p>
      <p data-testid="design">{design}</p>
      <button type="button" onClick={toggleColorMode}>
        Toggle mode
      </button>
      <button type="button" onClick={() => setAccent("emerald")}>
        Emerald accent
      </button>
      <button type="button" onClick={() => setDesign("analytics")}>
        Analytics design
      </button>
      <button type="button" onClick={resetTheme}>
        Reset theme
      </button>
    </div>
  );
};

describe("ThemeProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-color-mode");
    document.documentElement.removeAttribute("data-accent");
    document.documentElement.removeAttribute("data-design");
  });

  it("applies the default theme to the document", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("mode")).toHaveTextContent("light");
    expect(screen.getByTestId("accent")).toHaveTextContent("indigo");
    expect(screen.getByTestId("design")).toHaveTextContent("studio");
    expect(document.documentElement.dataset.colorMode).toBe("light");
    expect(document.documentElement.dataset.accent).toBe("indigo");
    expect(document.documentElement.dataset.design).toBe("studio");
  });

  it("updates and persists the theme", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Toggle mode" }));
    await user.click(screen.getByRole("button", { name: "Emerald accent" }));
    await user.click(screen.getByRole("button", { name: "Analytics design" }));

    expect(screen.getByTestId("mode")).toHaveTextContent("dark");
    expect(screen.getByTestId("accent")).toHaveTextContent("emerald");
    expect(screen.getByTestId("design")).toHaveTextContent("analytics");
    expect(document.documentElement.dataset.colorMode).toBe("dark");
    expect(document.documentElement.dataset.accent).toBe("emerald");
    expect(document.documentElement.dataset.design).toBe("analytics");

    const stored = JSON.parse(window.localStorage.getItem("kura-crm.theme") ?? "{}") as {
      colorMode?: string;
      accent?: string;
      design?: string;
    };
    expect(stored).toEqual({ colorMode: "dark", accent: "emerald", design: "analytics" });
  });

  it("resets to the default theme", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Toggle mode" }));
    await user.click(screen.getByRole("button", { name: "Reset theme" }));

    expect(screen.getByTestId("mode")).toHaveTextContent("light");
    expect(screen.getByTestId("accent")).toHaveTextContent("indigo");
    expect(screen.getByTestId("design")).toHaveTextContent("studio");
  });

  it("ignores corrupt stored themes", () => {
    window.localStorage.setItem("kura-crm.theme", "{not-json");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("accent")).toHaveTextContent("indigo");
    expect(screen.getByTestId("design")).toHaveTextContent("studio");
  });
});
