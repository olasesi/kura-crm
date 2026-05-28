import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  MAX_LOGIN_ATTEMPTS: number;
  LOCKOUT_DURATION_MINUTES: number;
  MFA_TOKEN_EXPIRES_IN: string;
  DB_HOST: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_PORT: number;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
  LOG_LEVEL: string;
  REDIS_URL: string;
  SENTRY_DSN: string;
  RECAPTCHA_SITE_KEY: string;
  RECAPTCHA_SECRET_KEY: string;
  GRAPHQL_PATH: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] !== undefined ? process.env[key] : defaultValue;
  if (value === undefined || value === null) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value as string;
};

const getOptionalEnvVar = (key: string, defaultValue = ""): string => {
  return process.env[key] !== undefined ? (process.env[key] as string) : defaultValue;
};

export const env: EnvConfig = {
  NODE_ENV: getEnvVar("NODE_ENV", "development"),
  PORT: parseInt(getEnvVar("PORT", "5000"), 10),
  MAX_LOGIN_ATTEMPTS: parseInt(getEnvVar("MAX_LOGIN_ATTEMPTS", "5"), 10),
  LOCKOUT_DURATION_MINUTES: parseInt(getEnvVar("LOCKOUT_DURATION_MINUTES", "15"), 10),
  MFA_TOKEN_EXPIRES_IN: getEnvVar("MFA_TOKEN_EXPIRES_IN", "5m"),
  DB_HOST: getEnvVar("DB_HOST", "localhost"),
  DB_USER: getEnvVar("DB_USER", "root"),
  DB_PASSWORD: getOptionalEnvVar("DB_PASSWORD", ""),
  DB_NAME: getEnvVar("DB_NAME", "crm_database"),
  DB_PORT: parseInt(getEnvVar("DB_PORT", "3306"), 10),
  JWT_SECRET: getEnvVar("JWT_SECRET", "your-jwt-secret-change-in-production"),
  JWT_REFRESH_SECRET: getEnvVar("JWT_REFRESH_SECRET", "your-refresh-secret-change-in-production"),
  JWT_EXPIRES_IN: getEnvVar("JWT_EXPIRES_IN", "15m"),
  JWT_REFRESH_EXPIRES_IN: getEnvVar("JWT_REFRESH_EXPIRES_IN", "7d"),
  CORS_ORIGIN: getEnvVar("CORS_ORIGIN", "*"),
  RATE_LIMIT_WINDOW_MS: parseInt(getEnvVar("RATE_LIMIT_WINDOW_MS", "900000"), 10),
  RATE_LIMIT_MAX: parseInt(getEnvVar("RATE_LIMIT_MAX", "100"), 10),
  LOG_LEVEL: getEnvVar("LOG_LEVEL", "debug"),
  REDIS_URL: getOptionalEnvVar("REDIS_URL", "redis://localhost:6379"),
  SENTRY_DSN: getOptionalEnvVar("SENTRY_DSN"),
  RECAPTCHA_SITE_KEY: getOptionalEnvVar("RECAPTCHA_SITE_KEY"),
  RECAPTCHA_SECRET_KEY: getOptionalEnvVar("RECAPTCHA_SECRET_KEY"),
  GRAPHQL_PATH: getEnvVar("GRAPHQL_PATH", "/graphql"),
};
