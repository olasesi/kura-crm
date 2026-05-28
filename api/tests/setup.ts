import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.JWT_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.DB_NAME = "crm_test";
process.env.LOG_LEVEL = "silent";
process.env.MAX_LOGIN_ATTEMPTS = "5";
process.env.LOCKOUT_DURATION_MINUTES = "15";
process.env.MFA_TOKEN_EXPIRES_IN = "5m";
