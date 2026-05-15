import { Sequelize } from "sequelize";
import { env } from "./env";
import { logger } from "./logger";

export const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: "mysql",
  logging: (msg: string) => logger.debug(msg),
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
  retry: {
    max: 3,
  },
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info("Database connection established successfully.");
    await sequelize.sync({ alter: env.NODE_ENV === "development" });
    logger.info("Database models synchronized.");
  } catch (error) {
    logger.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};
