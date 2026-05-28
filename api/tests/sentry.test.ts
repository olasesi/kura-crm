import request from "supertest";
import app, { apolloReady } from "../src/app";
import { AppError } from "../src/middleware/errorHandler";
import { env } from "../src/config/env";

describe("Sentry configuration", () => {
  beforeAll(async () => {
    await apolloReady;
  });

  it("should have SENTRY_DSN env var defined", () => {
    expect(env).toHaveProperty("SENTRY_DSN");
  });

  it("should handle AppError with proper status codes", async () => {
    const error = new AppError("Test error", 400);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Test error");
  });

  it("should return 404 for unknown routes (Sentry middleware passes through)", async () => {
    const res = await request(app).get("/api/nonexistent-route");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
