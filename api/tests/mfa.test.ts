import request from "supertest";
import app from "../src/app";
import { MfaService } from "../src/services/mfaService";
import { AppError } from "../src/middleware/errorHandler";
import { Response, NextFunction } from "express";

let mockAuthenticated = true;

jest.mock("../src/middleware/auth", () => ({
  authenticate: (req: any, _res: Response, next: NextFunction) => {
    if (mockAuthenticated) {
      req.user = { userId: 1, email: "test@example.com", role: "user" };
      next();
    } else {
      _res.status(401).json({ success: false, error: "Access denied. No token provided." });
    }
  },
  optionalAuth: (req: any, _res: Response, next: NextFunction) => {
    if (mockAuthenticated) {
      req.user = { userId: 1, email: "test@example.com", role: "user" };
    }
    next();
  },
  authorize: () => (_req: any, _res: Response, next: NextFunction) => next(),
}));

jest.mock("../src/services/mfaService");

const mockedMfaService = MfaService as jest.Mocked<typeof MfaService>;

const makeError = (message: string, statusCode: number): AppError => {
  return new AppError(message, statusCode);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthenticated = true;
});

describe("MFA API", () => {
  describe("POST /api/auth/mfa/setup", () => {
    it("should setup MFA and return secret + QR code", async () => {
      mockedMfaService.setup.mockResolvedValue({
        secret: "JBSWY3DPEHPK3PXP",
        uri: "otpauth://totp/Kura%20CRM:test@example.com?secret=JBSWY3DPEHPK3PXP",
        qrCode: "data:image/png;base64,iVBOR...",
      });

      const res = await request(app)
        .post("/api/auth/mfa/setup")
        .set("Authorization", "Bearer test-token");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("secret");
      expect(res.body.data).toHaveProperty("qrCode");
      expect(res.body.data).toHaveProperty("uri");
    });

    it("should reject setup without auth", async () => {
      mockAuthenticated = false;
      const res = await request(app).post("/api/auth/mfa/setup");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/mfa/verify", () => {
    it("should enable MFA with valid code", async () => {
      mockedMfaService.verify.mockResolvedValue(undefined);

      const res = await request(app)
        .post("/api/auth/mfa/verify")
        .set("Authorization", "Bearer test-token")
        .send({ code: "123456" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("MFA enabled");
    });

    it("should reject invalid code", async () => {
      mockedMfaService.verify.mockRejectedValue(makeError("Invalid verification code.", 400));

      const res = await request(app)
        .post("/api/auth/mfa/verify")
        .set("Authorization", "Bearer test-token")
        .send({ code: "000000" });
      expect(res.status).toBe(400);
    });

    it("should reject verify without code", async () => {
      const res = await request(app)
        .post("/api/auth/mfa/verify")
        .set("Authorization", "Bearer test-token")
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/mfa/disable", () => {
    it("should disable MFA with valid password", async () => {
      mockedMfaService.disable.mockResolvedValue(undefined);

      const res = await request(app)
        .post("/api/auth/mfa/disable")
        .set("Authorization", "Bearer test-token")
        .send({ password: "Password123!" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("MFA disabled");
    });

    it("should not disable MFA without password", async () => {
      const res = await request(app)
        .post("/api/auth/mfa/disable")
        .set("Authorization", "Bearer test-token")
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/mfa/challenge", () => {
    it("should return tokens with valid MFA code", async () => {
      mockedMfaService.challenge.mockResolvedValue({
        accessToken: "access-token-123",
        refreshToken: "refresh-token-123",
      });

      const res = await request(app)
        .post("/api/auth/mfa/challenge")
        .send({ mfaToken: "mfa-token-123", code: "123456" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("accessToken");
      expect(res.body.data).toHaveProperty("refreshToken");
    });

    it("should reject challenge with invalid code", async () => {
      mockedMfaService.challenge.mockRejectedValue(makeError("Invalid MFA code.", 401));

      const res = await request(app)
        .post("/api/auth/mfa/challenge")
        .send({ mfaToken: "mfa-token-123", code: "000000" });
      expect(res.status).toBe(401);
    });

    it("should reject challenge without mfaToken", async () => {
      const res = await request(app)
        .post("/api/auth/mfa/challenge")
        .send({ code: "123456" });
      expect(res.status).toBe(400);
    });

    it("should reject challenge without code", async () => {
      const res = await request(app)
        .post("/api/auth/mfa/challenge")
        .send({ mfaToken: "mfa-token-123" });
      expect(res.status).toBe(400);
    });
  });
});
