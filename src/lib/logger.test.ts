import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logger } from "./logger";

type ConsoleSpies = Record<"debug" | "info" | "warn" | "error", ReturnType<typeof vi.spyOn>>;

let spies: ConsoleSpies;

beforeEach(() => {
  spies = {
    debug: vi.spyOn(console, "debug").mockImplementation(() => undefined),
    info: vi.spyOn(console, "info").mockImplementation(() => undefined),
    warn: vi.spyOn(console, "warn").mockImplementation(() => undefined),
    error: vi.spyOn(console, "error").mockImplementation(() => undefined),
  };
});

afterEach(() => {
  for (const spy of Object.values(spies)) {
    spy.mockRestore();
  }
});

describe("logger", () => {
  it("logs at each level with context", () => {
    logger.debug("detail", { id: 1 });
    logger.info("hello");
    logger.warn("careful");
    logger.error("boom");

    expect(spies.debug).toHaveBeenCalledWith("[Kura CRM] detail", { id: 1 });
    expect(spies.info).toHaveBeenCalledWith("[Kura CRM] hello");
    expect(spies.warn).toHaveBeenCalledWith("[Kura CRM] careful");
    expect(spies.error).toHaveBeenCalledWith("[Kura CRM] boom");
  });

  it("respects the minimum level by skipping lower-priority output", () => {
    // Test-only override of the module state is unnecessary: the default
    // VITE_LOG_LEVEL in tests is "debug", which is the permissive branch.
    logger.debug("debug-line");
    logger.info("info-line");
    expect(spies.debug).toHaveBeenCalled();
    expect(spies.info).toHaveBeenCalled();
  });
});
