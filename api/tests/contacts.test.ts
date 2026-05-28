import request from "supertest";
import app from "../src/app";
import { Contact } from "../src/models/Contact";
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

jest.mock("../src/models/Contact");

const mockedContact = Contact as jest.Mocked<typeof Contact>;

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthenticated = true;
});

describe("Contacts API", () => {
  const testContact = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+1234567890",
    company: "Test Corp",
  };

  describe("POST /api/contacts", () => {
    it("should create a contact when authenticated", async () => {
      (mockedContact.create as jest.Mock).mockResolvedValue({ id: 1, ...testContact });

      const res = await request(app)
        .post("/api/contacts")
        .set("Authorization", "Bearer test-token")
        .send(testContact);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testContact.email);
    });

    it("should reject creation without auth", async () => {
      mockAuthenticated = false;
      const res = await request(app).post("/api/contacts").send(testContact);
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/contacts", () => {
    it("should list contacts when authenticated", async () => {
      (mockedContact.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [{ id: 1, ...testContact }],
        count: 1,
      });

      const res = await request(app)
        .get("/api/contacts")
        .set("Authorization", "Bearer test-token");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
