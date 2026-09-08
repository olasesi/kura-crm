import * as Sentry from "@sentry/react";

import { env } from "@/config/env";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const minimumLevel: LogLevel = ["debug", "info", "warn", "error"].includes(env.logLevel)
  ? (env.logLevel as LogLevel)
  : env.isProduction
    ? "warn"
    : "debug";

const enabled = (level: LogLevel): boolean => LEVEL_ORDER[level] >= LEVEL_ORDER[minimumLevel];

const write = (level: LogLevel, message: unknown, meta?: unknown): void => {
  if (!enabled(level)) return;
  const fn =
    level === "debug"
      ? console.debug
      : level === "info"
        ? console.info
        : level === "warn"
          ? console.warn
          : console.error;
  if (meta !== undefined) fn(`[${env.appName}] ${String(message)}`, meta);
  else fn(`[${env.appName}] ${String(message)}`);
  if (level === "error" && env.sentryDsn && meta instanceof Error === false) {
    Sentry.captureMessage(String(message), "error");
  }
};

export const logger = {
  debug: (message: unknown, meta?: unknown): void => write("debug", message, meta),
  info: (message: unknown, meta?: unknown): void => write("info", message, meta),
  warn: (message: unknown, meta?: unknown): void => write("warn", message, meta),
  error: (message: unknown, meta?: unknown): void => write("error", message, meta),
};
