import request from "supertest";
import { Response, NextFunction } from "express";
import app, { apolloReady } from "../src/app";

let mockAuthenticated = true;
let mockRole = "admin";

jest.mock("../src/middleware/auth", () => ({
  authenticate: (req: any, _res: Response, next: NextFunction) => {
    if (!mockAuthenticated) {
      return _res.status(401).json({ success: false, error: "Access denied. No token provided." });
    }
    req.user = { userId: 1, email: "admin@example.com", role: mockRole };
    next();
  },
  optionalAuth: (req: any, _res: Response, next: NextFunction) => {
    if (mockAuthenticated) {
      req.user = { userId: 1, email: "admin@example.com", role: mockRole };
    }
    next();
  },
  authorize: (...roles: string[]) => (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Insufficient permissions." });
    }
    next();
  },
}));

jest.mock("../src/models/Setting", () => ({
  Setting: {
    findAll: jest.fn(),
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
  },
}));

jest.mock("../src/services/webhookService", () => ({
  WebhookService: {
    dispatch: jest.fn().mockResolvedValue(undefined),
  },
}));

const { Setting } = jest.requireMock("../src/models/Setting");
const { WebhookService } = jest.requireMock("../src/services/webhookService");

const gqlRequest = (query: string, variables?: Record<string, unknown>) =>
  request(app)
    .post("/graphql")
    .set("Authorization", "Bearer test-token")
    .send({ query, variables });

const defaultRow = (key: string, rawValue: string) => ({ key, value: rawValue });

beforeAll(async () => {
  await apolloReady;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthenticated = true;
  mockRole = "admin";
  (Setting.findAll as jest.Mock).mockResolvedValue([]);
  (Setting.bulkCreate as jest.Mock).mockResolvedValue([]);
  (Setting.destroy as jest.Mock).mockResolvedValue(1);
});

describe("Settings REST API", () => {
  test("GET /api/settings/groups lists all setting groups", async () => {
    const res = await request(app).get("/api/settings/groups").set("Authorization", "Bearer ok");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const groups = res.body.data;
    expect(Array.isArray(groups)).toBe(true);
    expect(groups.length).toBeGreaterThanOrEqual(40);
    const company = groups.find((g: { group: string }) => g.group === "company");
    expect(company).toBeDefined();
    expect(company.scope).toBe("global");
    const payment = groups.find((g: { group: string }) => g.group === "payment_credentials");
    expect(payment.sensitive).toBe(true);
  });

  test("GET /api/settings/groups returns 401 when unauthenticated", async () => {
    mockAuthenticated = false;
    const res = await request(app).get("/api/settings/groups");
    expect(res.status).toBe(401);
  });

  test("GET /api/settings/:group returns merged defaults and stored values", async () => {
    (Setting.findAll as jest.Mock).mockResolvedValue([defaultRow("companyName", '"Acme Corp"')]);
    const res = await request(app).get("/api/settings/company").set("Authorization", "Bearer ok");
    expect(res.status).toBe(200);
    expect(res.body.data.companyName).toBe("Acme Corp");
    expect(res.body.data.companyEmail).toBe("company@example.com");
  });

  test("GET /api/settings/:group returns redacted values for non-admin on non-sensitive group", async () => {
    mockRole = "user";

    (Setting.findAll as jest.Mock).mockResolvedValue([
      defaultRow("appUrl", '"https://kura.example.com"'),
      defaultRow("apiKey", '"sk_test_123"'),
    ]);

    const res = await request(app).get("/api/settings/app").set("Authorization", "Bearer ok");
    expect(res.status).toBe(200);
    expect(res.body.data.appUrl).toBe("https://kura.example.com");
    expect(res.body.data.apiKey).toBe("********");
  });

  test("GET /api/settings/:group on sensitive group returns 403 for non-admin", async () => {
    mockRole = "user";
    const res = await request(app).get("/api/settings/payment_credentials").set("Authorization", "Bearer ok");
    expect(res.status).toBe(403);
  });

  test("GET /api/settings/:group on sensitive group returns values for admin", async () => {
    (Setting.findAll as jest.Mock).mockResolvedValue([defaultRow("gateways", '["stripe"]')]);
    const res = await request(app).get("/api/settings/payment_credentials").set("Authorization", "Bearer ok");
    expect(res.status).toBe(200);
    expect(res.body.data.gateways).toEqual(["stripe"]);
  });

  test("GET /api/settings/:group returns 404 for unknown group", async () => {
    const res = await request(app).get("/api/settings/nopes_group").set("Authorization", "Bearer ok");
    expect(res.status).toBe(404);
  });

  test("GET /api/settings aggregate returns all groups for admin", async () => {
    const res = await request(app).get("/api/settings").set("Authorization", "Bearer ok");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("company");
    expect(res.body.data).toHaveProperty("app");
  });

  test("GET /api/settings aggregate returns 403 for non-admin", async () => {
    mockRole = "user";
    const res = await request(app).get("/api/settings").set("Authorization", "Bearer ok");
    expect(res.status).toBe(403);
  });

  test("PUT /api/settings/:group validates partial input and upserts", async () => {
    const res = await request(app)
      .put("/api/settings/app")
      .set("Authorization", "Bearer ok")
      .send({ timeFormat: "24h" });
    expect(res.status).toBe(200);
    expect(Setting.bulkCreate).toHaveBeenCalledTimes(1);
    const [entries, opts] = (Setting.bulkCreate as jest.Mock).mock.calls[0];
    expect(entries).toEqual([{ group: "app", key: "timeFormat", value: '"24h"', userId: 0 }]);
    expect(opts.updateOnDuplicate).toEqual(["value", "updatedAt"]);
    expect(WebhookService.dispatch).toHaveBeenCalledWith("setting.updated", expect.any(Object));
  });

  test("PUT /api/settings/:group rejects invalid values", async () => {
    const res = await request(app)
      .put("/api/settings/app")
      .set("Authorization", "Bearer ok")
      .send({ timeFormat: "26h" });
    expect(res.status).toBe(400);
    expect(Setting.bulkCreate).not.toHaveBeenCalled();
  });

  test("PUT /api/settings/:group returns 403 for non-admin", async () => {
    mockRole = "user";
    const res = await request(app)
      .put("/api/settings/app")
      .set("Authorization", "Bearer ok")
      .send({ timeFormat: "24h" });
    expect(res.status).toBe(403);
  });

  test("PUT /api/settings/:group returns 404 for unknown group", async () => {
    const res = await request(app)
      .put("/api/settings/banana")
      .set("Authorization", "Bearer ok")
      .send({ flavor: "sweet" });
    expect(res.status).toBe(404);
  });

  test("GET /api/settings/:group/me returns user-scoped settings", async () => {
    const res = await request(app).get("/api/settings/profile/me").set("Authorization", "Bearer ok");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  test("PUT /api/settings/:group/me updates user-scoped settings", async () => {
    mockRole = "user";
    const res = await request(app)
      .put("/api/settings/profile/me")
      .set("Authorization", "Bearer ok")
      .send({ language: "en" });
    expect(res.status).toBe(200);
    const [entries] = (Setting.bulkCreate as jest.Mock).mock.calls[0];
    expect(entries[0]).toEqual({ group: "profile", key: "language", value: '"en"', userId: 1 });
  });

  test("PUT /api/settings/:group/me rejects global groups", async () => {
    mockRole = "user";
    const res = await request(app)
      .put("/api/settings/company/me")
      .set("Authorization", "Bearer ok")
      .send({ companyName: '"Hack Co"' });
    expect(res.status).toBe(403);
  });

  test("DELETE /api/settings/:group/:key deletes a key", async () => {
    const res = await request(app).delete("/api/settings/company/companyName").set("Authorization", "Bearer ok");
    expect(res.status).toBe(200);
    expect(Setting.destroy).toHaveBeenCalledWith({ where: { group: "company", key: "companyName", userId: 0 } });
    expect(WebhookService.dispatch).toHaveBeenCalledWith("setting.deleted", expect.any(Object));
  });

  test("DELETE /api/settings/:group resets group to defaults", async () => {
    const res = await request(app).delete("/api/settings/currency").set("Authorization", "Bearer ok");
    expect(res.status).toBe(200);
    expect(Setting.destroy).toHaveBeenCalledWith({ where: { group: "currency", userId: 0 } });
    expect(WebhookService.dispatch).toHaveBeenCalledWith("setting.deleted", expect.any(Object));
  });

  test("DELETE /api/settings/:group returns 404 for unknown group", async () => {
    const res = await request(app).delete("/api/settings/banana").set("Authorization", "Bearer ok");
    expect(res.status).toBe(404);
  });
});

describe("Settings GraphQL API", () => {
  test("settingGroups query lists groups", async () => {
    const res = await gqlRequest("{ settingGroups { group scope sensitive } }");
    expect(res.body.errors).toBeUndefined();
    const groups = res.body.data.settingGroups;
    expect(groups.some((g: { group: string }) => g.group === "company")).toBe(true);
  });

  test("settings query returns entries with defaults merged", async () => {
    (Setting.findAll as jest.Mock).mockResolvedValue([defaultRow("companyName", '"Acme Corp"')]);
    const res = await gqlRequest('{ settings(group: "company") { key value } }');
    expect(res.body.errors).toBeUndefined();
    const entries = res.body.data.settings;
    expect(entries.find((e: { key: string }) => e.key === "companyName").value).toBe("Acme Corp");
    expect(entries.find((e: { key: string }) => e.key === "companyEmail").value).toBe("company@example.com");
  });

  test("settings query on sensitive group rejected for non-admin", async () => {
    mockRole = "user";
    const res = await gqlRequest('{ settings(group: "payment_credentials") { key } }');
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toMatch(/Insufficient permissions/i);
  });

  test("mySettings query returns the caller's settings", async () => {
    const res = await gqlRequest('{ mySettings(group: "profile") { key value } }');
    expect(res.body.errors).toBeUndefined();
    expect(Array.isArray(res.body.data.mySettings)).toBe(true);
  });

  test("updateSettings mutation requires admin", async () => {
    mockRole = "user";
    const res = await gqlRequest(
      'mutation { updateSettings(group: "app", input: [{ key: "timeFormat", value: "\\"24h\\"" }]) { key } }'
    );
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toMatch(/Insufficient permissions/i);
  });

  test("updateSettings mutation upserts settings as admin", async () => {
    (Setting.findAll as jest.Mock).mockResolvedValue([defaultRow("timeFormat", '"24h"')]);
    const res = await gqlRequest(
      'mutation { updateSettings(group: "app", input: [{ key: "timeFormat", value: "\\"24h\\"" }]) { key value } }'
    );
    expect(res.body.errors).toBeUndefined();
    const entries = res.body.data.updateSettings;
    expect(entries.find((e: { key: string }) => e.key === "timeFormat").value).toBe("24h");
    expect(Setting.bulkCreate).toHaveBeenCalledTimes(1);
    expect(WebhookService.dispatch).toHaveBeenCalledWith("setting.updated", expect.any(Object));
  });

  test("resetSettings mutation resets a group as admin", async () => {
    const res = await gqlRequest('mutation { resetSettings(group: "currency") }');
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.resetSettings).toBe(true);
  });
});