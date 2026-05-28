import request from "supertest";
import app from "../src/app";
import { Webhook } from "../src/models/Webhook";
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

const mockWebhook = {
  id: 1,
  userId: 1,
  url: "https://example.com/webhook",
  events: ["contact.created", "user.registered"],
  enabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockWebhookList = [
  mockWebhook,
  { ...mockWebhook, id: 2, url: "https://other.com/hook", events: ["login.success"] },
];

jest.mock("../src/models/Webhook", () => ({
  Webhook: {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    scope: jest.fn().mockReturnThis(),
  },
}));

const mockedWebhook = Webhook as jest.Mocked<typeof Webhook>;

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthenticated = true;
});

describe("Webhooks API", () => {
  describe("POST /api/webhooks", () => {
    it("should subscribe a webhook", async () => {
      (mockedWebhook.create as jest.Mock).mockResolvedValue(mockWebhook);

      const res = await request(app)
        .post("/api/webhooks")
        .set("Authorization", "Bearer test-token")
        .send({ url: "https://example.com/webhook", events: ["contact.created"] });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("url");
    });

    it("should reject subscription without events", async () => {
      const res = await request(app)
        .post("/api/webhooks")
        .set("Authorization", "Bearer test-token")
        .send({ url: "https://example.com/webhook" });
      expect(res.status).toBe(400);
    });

    it("should reject subscription without auth", async () => {
      mockAuthenticated = false;
      const res = await request(app)
        .post("/api/webhooks")
        .send({ url: "https://example.com/webhook", events: ["contact.created"] });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/webhooks", () => {
    it("should list webhooks for user", async () => {
      (mockedWebhook.findAll as jest.Mock).mockResolvedValue(mockWebhookList);

      const res = await request(app)
        .get("/api/webhooks")
        .set("Authorization", "Bearer test-token");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    it("should reject list without auth", async () => {
      mockAuthenticated = false;
      const res = await request(app).get("/api/webhooks");
      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/webhooks/:id", () => {
    it("should update a webhook", async () => {
      const updatedWebhook = { ...mockWebhook, enabled: false };
      (mockedWebhook.findOne as jest.Mock).mockResolvedValue({
        update: jest.fn().mockResolvedValue(updatedWebhook),
      });

      const res = await request(app)
        .put("/api/webhooks/1")
        .set("Authorization", "Bearer test-token")
        .send({ enabled: false });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 404 for non-existent webhook", async () => {
      (mockedWebhook.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .put("/api/webhooks/999")
        .set("Authorization", "Bearer test-token")
        .send({ enabled: false });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/webhooks/:id", () => {
    it("should unsubscribe a webhook", async () => {
      (mockedWebhook.findOne as jest.Mock).mockResolvedValue({
        destroy: jest.fn().mockResolvedValue(undefined),
      });

      const res = await request(app)
        .delete("/api/webhooks/1")
        .set("Authorization", "Bearer test-token");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 404 for non-existent webhook", async () => {
      (mockedWebhook.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .delete("/api/webhooks/999")
        .set("Authorization", "Bearer test-token");
      expect(res.status).toBe(404);
    });
  });
});
