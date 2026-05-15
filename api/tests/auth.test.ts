import request from "supertest";
import app from "../src/app";

describe("Auth API", () => {
  const testUser = {
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    password: "Password123!",
  };

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app).post("/api/auth/register").send(testUser);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("user");
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data).toHaveProperty("tokens");
      expect(res.body.data.tokens).toHaveProperty("accessToken");
      expect(res.body.data.tokens).toHaveProperty("refreshToken");
    });

    it("should reject duplicate email", async () => {
      const res = await request(app).post("/api/auth/register").send(testUser);
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should reject missing fields", async () => {
      const res = await request(app).post("/api/auth/register").send({ email: "bad@example.com" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("tokens");
    });

    it("should reject invalid password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "wrongpassword",
      });
      expect(res.status).toBe(401);
    });
  });
});
