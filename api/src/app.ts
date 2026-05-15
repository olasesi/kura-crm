import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectDatabase, sequelize } from "./config/database";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { generalLimiter } from "./middleware/rateLimiter";
import { monitorMiddleware, metricsHandler } from "./middleware/monitor";
import { swaggerSpec } from "./docs/swagger";
import routes from "./routes";

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(generalLimiter);
app.use(monitorMiddleware);

app.get("/", (_req, res) => {
  res.json({ success: true, message: "Kura CRM API is running", version: "1.0.0" });
});

app.get("/health", async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ success: true, status: "healthy", database: "connected", uptime: process.uptime() });
  } catch {
    res.status(503).json({ success: false, status: "unhealthy", database: "disconnected" });
  }
});

app.get("/metrics", metricsHandler);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async (): Promise<void> => {
  try {
    await connectDatabase();
    app.listen(env.PORT, () => {
      logger.info(`Kura CRM server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`API Documentation: http://localhost:${env.PORT}/api/docs`);
      logger.info(`Health check: http://localhost:${env.PORT}/health`);
      logger.info(`Metrics: http://localhost:${env.PORT}/metrics`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();

export default app;
