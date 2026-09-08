import * as Sentry from "@sentry/react";
import { onCLS, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

import { env } from "@/config/env";
import { logger } from "@/lib/logger";

const initSentry = (): void => {
  if (!env.sentryDsn) {
    logger.warn("Sentry DSN not configured — error monitoring disabled.");
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.isProduction ? "production" : "development",
    release: `${env.appName}@${env.appVersion}`,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: env.isProduction ? 0.2 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
  });

  logger.info("Sentry initialized.");
};

const reportVital = (metric: Metric): void => {
  logger.info(`[web-vitals] ${metric.name}: ${metric.value.toFixed(0)} (${metric.rating})`, {
    id: metric.id,
    delta: metric.delta,
  });
  if (!env.sentryDsn) return;
  Sentry.metrics.increment(`web_vitals_${metric.name.toLowerCase()}_${metric.rating}`, 1);
};

const initWebVitals = (): void => {
  onCLS(reportVital);
  onINP(reportVital);
  onLCP(reportVital);
  onTTFB(reportVital);
};

export const initMonitoring = (): void => {
  initSentry();
  initWebVitals();
};
