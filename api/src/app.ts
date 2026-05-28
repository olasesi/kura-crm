import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectDatabase, sequelize } from "./config/database";
import { connectRedis, redis } from "./config/redis";
import { initializeQueues } from "./config/queue";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { generalLimiter, authLimiter } from "./middleware/rateLimiter";
import { monitorMiddleware, metricsHandler } from "./middleware/monitor";
import { correlationIdMiddleware } from "./middleware/correlationId";
import { authenticate, optionalAuth } from "./middleware/auth";
import { swaggerSpec } from "./docs/swagger";
import { createApolloServer } from "./graphql";
import routes from "./routes";
import { addAuditLog } from "./config/queue";

const app = express();
const httpServer = http.createServer(app);

app.use(helmet({ contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false }));
app.use(compression());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(correlationIdMiddleware);
app.use(generalLimiter);
app.use(monitorMiddleware);

app.get("/", (_req, res) => {
  res.json({ success: true, message: "Kura CRM API", version: "3.0.0" });
});

app.get("/health", async (_req, res) => {
  const checks: Record<string, string> = {};

  try {
    await sequelize.authenticate();
    checks.database = "connected";
  } catch {
    checks.database = "disconnected";
  }

  try {
    await redis.ping();
    checks.redis = "connected";
  } catch {
    checks.redis = "disconnected";
  }

  const healthy = Object.values(checks).every((v) => v === "connected");
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? "healthy" : "degraded",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks,
  });
});

app.get("/metrics", metricsHandler);

// Sentry setup outside start() so middleware applies before routes even in test
let sentryInitialized = false;
if (env.SENTRY_DSN) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require("@sentry/node");
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: env.NODE_ENV === "production" ? 0.2 : 1.0,
    });
    Sentry.setupExpressErrorHandler(app);
    sentryInitialized = true;
    logger.info("Sentry initialized");
  } catch (err) {
    logger.warn("Failed to initialize Sentry:", err);
  }
}

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.use("/api", routes);

const apolloServer = createApolloServer(httpServer);
const apolloReady = apolloServer.start().then(() => {
  app.use(env.GRAPHQL_PATH, optionalAuth);
  (apolloServer as any).applyMiddleware({ app, path: env.GRAPHQL_PATH, bodyParserConfig: false });
  app.use(notFoundHandler);
  app.use(errorHandler);
  logger.info(`Apollo Server ready at ${env.GRAPHQL_PATH}`);
});

export { apolloReady, sentryInitialized };

const start = async (): Promise<void> => {
  try {
    await connectDatabase();

    if (env.REDIS_URL) {
      await connectRedis();
      await initializeQueues();
    }

    await apolloReady;

    httpServer.listen(env.PORT, () => {
      logger.info(`Kura CRM server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`REST API:      http://localhost:${env.PORT}/api`);
      logger.info(`GraphQL:       http://localhost:${env.PORT}${env.GRAPHQL_PATH}`);
      logger.info(`Swagger Docs:  http://localhost:${env.PORT}/api/docs`);
      logger.info(`Health:        http://localhost:${env.PORT}/health`);
      logger.info(`Metrics:       http://localhost:${env.PORT}/metrics`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  httpServer.close(async () => {
    logger.info("HTTP server closed");

    try {
      await sequelize.close();
      logger.info("Database connection closed");

      if (redis.status === "ready") {
        await redis.quit();
        logger.info("Redis connection closed");
      }

      if (sentryInitialized) {
        const Sentry = require("@sentry/node");
        await Sentry.close(2000);
        logger.info("Sentry closed");
      }
    } catch (error) {
      logger.error("Error during shutdown:", error);
    }

    logger.info("Graceful shutdown complete");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

if (env.NODE_ENV !== "test") {
  start();
}

export { httpServer };
export default app;
