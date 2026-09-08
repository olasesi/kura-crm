import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initMonitoring } from "./monitoring";

vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn(),
  replayIntegration: vi.fn(),
  captureMessage: vi.fn(),
  metrics: { increment: vi.fn() },
}));

vi.mock("web-vitals", () => ({
  onCLS: vi.fn((handler: (metric: unknown) => void) =>
    handler({ name: "CLS", value: 0.01, rating: "good" }),
  ),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onTTFB: vi.fn(),
}));

let warn: ReturnType<typeof vi.spyOn>;
let info: ReturnType<typeof vi.spyOn>;

describe("monitoring", () => {
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    info = vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
    info.mockRestore();
  });

  it("does not throw without a Sentry DSN and registers web vitals", () => {
    expect(() => initMonitoring()).not.toThrow();
    expect(warn.mock.calls.some(([message]) => String(message).includes("Sentry"))).toBe(true);
    expect(info.mock.calls.some(([message]) => String(message).includes("web-vitals"))).toBe(true);
  });
});
