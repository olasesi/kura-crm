import request from "supertest";
import app from "../src/app";
import { AuthService } from "../src/services/authService";
import { AppError } from "../src/middleware/errorHandler";

jest.mock("../src/services/authService");

const mockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

const makeError = (message: string, statusCode: number): AppError => {
  return new AppError(message, statusCode);
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Auth API", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      mockedAuthService.register.mockResolvedValue({
        user: { id: 1, firstName: "Test", lastName: "User", email: "test@example.com", role: "user", isActive: true } as any,
        tokens: { accessToken: "token123", refreshToken: "refresh123" },
      });

      const res = await request(app).post("/api/auth/register").send({
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "Password123!",
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("user");
      expect(res.body.data.user.email).toBe("test@example.com");
      expect(res.body.data).toHaveProperty("tokens");
    });

    it("should handle duplicate email error", async () => {
      mockedAuthService.register.mockRejectedValue(makeError("Email already registered.", 409));

      const res = await request(app).post("/api/auth/register").send({
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "Password123!",
      });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      mockedAuthService.login.mockResolvedValue({
        user: { id: 1, firstName: "Test", lastName: "User", email: "test@example.com", role: "user", isActive: true } as any,
        tokens: { accessToken: "token123", refreshToken: "refresh123" },
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "Password123!",
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("tokens");
    });

    it("should reject invalid password", async () => {
      mockedAuthService.login.mockRejectedValue(makeError("Invalid email or password.", 401));

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });
      expect(res.status).toBe(401);
    });

    it("should lock account after max failed attempts", async () => {
      mockedAuthService.login.mockRejectedValue(
        makeError("Account temporarily locked. Try again in 15 minute(s).", 429)
      );

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });
      expect(res.status).toBe(429);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("locked");
    });

    it("should allow login after lockout expires", async () => {
      mockedAuthService.login.mockResolvedValue({
        user: { id: 1, firstName: "Test", lastName: "User", email: "test@example.com", role: "user", isActive: true } as any,
        tokens: { accessToken: "token123", refreshToken: "refresh123" },
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "Password123!",
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("tokens");
    });

    it("should reset failed attempts on successful login", async () => {
      let callCount = 0;
      mockedAuthService.login.mockImplementation(async () => {
        callCount++;
        if (callCount <= 3) {
          throw makeError("Invalid email or password.", 401);
        }
        return {
          user: { id: 1, firstName: "Test", lastName: "User", email: "test@example.com", role: "user", isActive: true } as any,
          tokens: { accessToken: "token123", refreshToken: "refresh123" },
        };
      });

      const fail1 = await request(app).post("/api/auth/login").send({ email: "test@example.com", password: "wrong" });
      expect(fail1.status).toBe(401);

      const fail2 = await request(app).post("/api/auth/login").send({ email: "test@example.com", password: "wrong" });
      expect(fail2.status).toBe(401);

      const fail3 = await request(app).post("/api/auth/login").send({ email: "test@example.com", password: "wrong" });
      expect(fail3.status).toBe(401);

      const success = await request(app).post("/api/auth/login").send({ email: "test@example.com", password: "Password123!" });
      expect(success.status).toBe(200);
      expect(success.body.data).toHaveProperty("tokens");
    });
  });
});
