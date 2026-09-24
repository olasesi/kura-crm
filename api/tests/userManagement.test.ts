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

jest.mock("../src/models/User", () => ({
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    scope: jest.fn().mockReturnThis(),
  },
}));

jest.mock("../src/models/Contact", () => ({
  Contact: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

jest.mock("../src/models/Webhook", () => ({
  Webhook: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    scope: jest.fn().mockReturnThis(),
  },
}));

jest.mock("../src/models/Role", () => ({
  Role: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
  },
}));

jest.mock("../src/services/webhookService", () => ({
  WebhookService: {
    dispatch: jest.fn().mockResolvedValue(undefined),
  },
}));

const { User } = jest.requireMock("../src/models/User");
const { Role } = jest.requireMock("../src/models/Role");
const { WebhookService } = jest.requireMock("../src/services/webhookService");

const gqlRequest = (query: string, variables?: Record<string, unknown>) =>
  request(app)
    .post("/graphql")
    .set("Authorization", "Bearer test-token")
    .send({ query, variables });

const roleRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: "support_lead",
  description: "Support team lead",
  permissions: '["contacts:read","contacts:write"]',
  isSystem: false,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  update: jest.fn(),
  destroy: jest.fn(),
  ...overrides,
});

const userRow = (overrides: Record<string, unknown> = {}) => ({
  id: 2,
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  password: "hashed",
  role: "user",
  roleId: null,
  isActive: true,
  refreshToken: null,
  failedLoginAttempts: 0,
  lockoutUntil: null,
  totpEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  update: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn().mockResolvedValue(undefined),
  save: jest.fn().mockResolvedValue(undefined),
  validatePassword: jest.fn().mockResolvedValue(true),
  ...overrides,
});

beforeAll(async () => {
  await apolloReady;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthenticated = true;
  mockRole = "admin";
  (Role.findAll as jest.Mock).mockResolvedValue([]);
  (Role.findOne as jest.Mock).mockResolvedValue(null);
  (User.findOne as jest.Mock).mockResolvedValue(null);
  (User.count as jest.Mock).mockResolvedValue(2);
  (Role.count as jest.Mock).mockResolvedValue(0);
  (User.findByPk as jest.Mock).mockResolvedValue(userRow({ id: 2, email: "jane@example.com", role: "user" }));
  (User.create as jest.Mock).mockResolvedValue(userRow());
  (Role.create as jest.Mock).mockResolvedValue(roleRow());
  (Role.findByPk as jest.Mock).mockResolvedValue(roleRow());
});

describe("Roles REST API", () => {
  test("GET /api/roles lists built-in roles merged with stored roles", async () => {
    (Role.findAll as jest.Mock).mockResolvedValue([
      roleRow({ id: 7, name: "support_lead", permissions: '["contacts:read"]' }),
    ]);
    const res = await request(app).get("/api/roles").set("Authorization", "Bearer ok");
    expect(res.status).toBe(200);
    const names = res.body.data.map((r: { name: string }) => r.name);
    expect(names).toContain("admin");
    expect(names).toContain("manager");
    expect(names).toContain("user");
    expect(names).toContain("support_lead");
    const admin = res.body.data.find((r: { name: string }) => r.name === "admin");
    expect(admin.isSystem).toBe(true);
    expect(admin.permissions).toContain("users:delete");
    const support = res.body.data.find((r: { name: string }) => r.name === "support_lead");
    expect(support.id).toBe(7);
  });

  test("GET /api/roles?active=true filters inactive roles", async () => {
    (Role.findAll as jest.Mock).mockResolvedValue([
      roleRow({ id: 7, name: "support_lead", isActive: false }),
    ]);
    const res = await request(app).get("/api/roles?active=true").set("Authorization", "Bearer ok");
    expect(res.status).toBe(200);
    expect(res.body.data.find((r: { name: string }) => r.name === "support_lead")).toBeUndefined();
    expect(res.body.data.find((r: { name: string }) => r.name === "admin")).toBeDefined();
  });

  test("GET /api/roles returns 401 without auth", async () => {
    mockAuthenticated = false;
    const res = await request(app).get("/api/roles");
    expect(res.status).toBe(401);
  });

  test("GET /api/roles returns 403 for regular users", async () => {
    mockRole = "user";
    const res = await request(app).get("/api/roles").set("Authorization", "Bearer ok");
    expect(res.status).toBe(403);
  });

  test("GET /api/roles/catalog returns permission modules", async () => {
    const res = await request(app).get("/api/roles/catalog").set("Authorization", "Bearer ok");
    expect(res.status).toBe(200);
    const users = res.body.data.find((m: { module: string }) => m.module === "users");
    expect(users.permissions).toEqual(["users:read", "users:write", "users:delete"]);
  });

  test("GET /api/roles/admin returns the built-in admin role", async () => {
    const res = await request(app).get("/api/roles/admin").set("Authorization", "Bearer ok");
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("admin");
    expect(res.body.data.isSystem).toBe(true);
  });

  test("GET /api/roles/:id returns a stored role by id", async () => {
    const res = await request(app).get("/api/roles/7").set("Authorization", "Bearer ok");
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("support_lead");
  });

  test("GET /api/roles/unknown returns 404", async () => {
    const res = await request(app).get("/api/roles/banana").set("Authorization", "Bearer ok");
    expect(res.status).toBe(404);
  });

  test("POST /api/roles creates a custom role", async () => {
    const res = await request(app)
      .post("/api/roles")
      .set("Authorization", "Bearer ok")
      .send({ name: "support_lead", description: "Support team lead", permissions: ["contacts:read", "contacts:write"] });
    expect(res.status).toBe(201);
    const [args] = (Role.create as jest.Mock).mock.calls[0];
    expect(args.name).toBe("support_lead");
    expect(JSON.parse(args.permissions)).toEqual(["contacts:read", "contacts:write"]);
    expect(WebhookService.dispatch).toHaveBeenCalledWith("role.created", expect.any(Object));
  });

  test("POST /api/roles rejects system role names", async () => {
    const res = await request(app)
      .post("/api/roles")
      .set("Authorization", "Bearer ok")
      .send({ name: "admin", permissions: [] });
    expect(res.status).toBe(409);
  });

  test("POST /api/roles rejects unknown permissions", async () => {
    const res = await request(app)
      .post("/api/roles")
      .set("Authorization", "Bearer ok")
      .send({ name: "custom", permissions: ["banana:peel"] });
    expect(res.status).toBe(400);
  });

  test("POST /api/roles returns 403 for non-admins", async () => {
    mockRole = "manager";
    const res = await request(app)
      .post("/api/roles")
      .set("Authorization", "Bearer ok")
      .send({ name: "custom", permissions: [] });
    expect(res.status).toBe(403);
  });

  test("PUT /api/roles/user upserts permissions onto a built-in role", async () => {
    (Role.findOne as jest.Mock).mockResolvedValue(null);
    const res = await request(app)
      .put("/api/roles/user")
      .set("Authorization", "Bearer ok")
      .send({ permissions: ["contacts:read"] });
    expect(res.status).toBe(200);
    const [args] = (Role.create as jest.Mock).mock.calls[0];
    expect(args.name).toBe("user");
    expect(args.isSystem).toBe(true);
    expect(JSON.parse(args.permissions)).toEqual(["contacts:read"]);
    expect(WebhookService.dispatch).toHaveBeenCalledWith("role.updated", expect.any(Object));
  });

  test("PUT /api/roles/admin cannot deactivate a system role", async () => {
    const res = await request(app)
      .put("/api/roles/admin")
      .set("Authorization", "Bearer ok")
      .send({ isActive: false });
    expect(res.status).toBe(403);
  });

  test("PUT /api/roles/unknown returns 404", async () => {
    const res = await request(app)
      .put("/api/roles/banana")
      .set("Authorization", "Bearer ok")
      .send({ description: "x" });
    expect(res.status).toBe(404);
  });

  test("DELETE /api/roles/admin is forbidden for system roles", async () => {
    const res = await request(app).delete("/api/roles/admin").set("Authorization", "Bearer ok");
    expect(res.status).toBe(403);
  });

  test("DELETE /api/roles/:id deletes an unused custom role", async () => {
    const instance = roleRow({ id: 7 });
    (Role.findOne as jest.Mock).mockResolvedValue(instance);
    (User.count as jest.Mock).mockResolvedValue(0);
    const res = await request(app).delete("/api/roles/7").set("Authorization", "Bearer ok");
    expect(res.status).toBe(200);
    expect(instance.destroy).toHaveBeenCalledTimes(1);
    expect(WebhookService.dispatch).toHaveBeenCalledWith("role.deleted", expect.any(Object));
  });

  test("DELETE /api/roles/:id is blocked when the role is assigned to users", async () => {
    (Role.findOne as jest.Mock).mockResolvedValue(roleRow({ id: 7 }));
    (User.count as jest.Mock).mockResolvedValue(3);
    const res = await request(app).delete("/api/roles/7").set("Authorization", "Bearer ok");
    expect(res.status).toBe(409);
    expect(Role.destroy).not.toHaveBeenCalled();
  });
});

describe("User management REST API", () => {
  test("POST /api/users creates a user as admin", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", "Bearer ok")
      .send({ firstName: "Jane", lastName: "Doe", email: "jane@example.com", role: "user", password: "password123" });
    expect(res.status).toBe(201);
    const [args] = (User.create as jest.Mock).mock.calls[0];
    expect(args.email).toBe("jane@example.com");
    expect(args.role).toBe("user");
    expect(WebhookService.dispatch).toHaveBeenCalledWith("user.created", expect.any(Object));
  });

  test("POST /api/users rejects duplicate emails", async () => {
    (User.findOne as jest.Mock).mockResolvedValue(userRow());
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", "Bearer ok")
      .send({ firstName: "Jane", lastName: "Doe", email: "jane@example.com" });
    expect(res.status).toBe(409);
  });

  test("POST /api/users assigns a custom role via roleId", async () => {
    (Role.findOne as jest.Mock).mockResolvedValue(roleRow({ id: 7, name: "support_lead" }));
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", "Bearer ok")
      .send({ firstName: "Jane", lastName: "Doe", email: "jane@example.com", roleName: "support_lead" });
    expect(res.status).toBe(201);
    const [args] = (User.create as jest.Mock).mock.calls[0];
    expect(args.role).toBe("user");
    expect(args.roleId).toBe(7);
  });

  test("POST /api/users returns 403 for non-admins", async () => {
    mockRole = "user";
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", "Bearer ok")
      .send({ firstName: "Jane", lastName: "Doe", email: "jane@example.com" });
    expect(res.status).toBe(403);
  });

  test("POST /api/users returns 401 without auth", async () => {
    mockAuthenticated = false;
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", "Bearer ok")
      .send({ firstName: "Jane", lastName: "Doe", email: "jane@example.com" });
    expect(res.status).toBe(401);
  });

  test("PATCH /api/users/:id/active deactivates a user", async () => {
    const res = await request(app)
      .patch("/api/users/2/active")
      .set("Authorization", "Bearer ok")
      .send({ isActive: false });
    expect(res.status).toBe(200);
    expect(User.findByPk).toHaveBeenCalledWith(2);
    expect(WebhookService.dispatch).toHaveBeenCalledWith("user.updated", { userId: 2, isActive: false, actorUserId: 1 });
  });

  test("PATCH /api/users/:id/active blocks deactivating yourself", async () => {
    const res = await request(app)
      .patch("/api/users/1/active")
      .set("Authorization", "Bearer ok")
      .send({ isActive: false });
    expect(res.status).toBe(409);
  });

  test("PATCH /api/users/:id/active blocks deactivating the last active admin", async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(userRow({ id: 2, role: "admin", isActive: true }));
    (User.count as jest.Mock).mockResolvedValue(1);
    const res = await request(app)
      .patch("/api/users/2/active")
      .set("Authorization", "Bearer ok")
      .send({ isActive: false });
    expect(res.status).toBe(409);
  });

  test("PUT /api/users/:id/role assigns an enum role", async () => {
    const res = await request(app)
      .put("/api/users/2/role")
      .set("Authorization", "Bearer ok")
      .send({ role: "manager" });
    expect(res.status).toBe(200);
    expect(User.findByPk).toHaveBeenCalledWith(2);
    expect(WebhookService.dispatch).toHaveBeenCalledWith("user.role_changed", expect.any(Object));
  });

  test("PUT /api/users/:id/role with unknown role returns 404", async () => {
    const res = await request(app)
      .put("/api/users/2/role")
      .set("Authorization", "Bearer ok")
      .send({ role: "banana" });
    expect(res.status).toBe(404);
  });

  test("PUT /api/users/:id/password resets a user password", async () => {
    const res = await request(app)
      .put("/api/users/2/password")
      .set("Authorization", "Bearer ok")
      .send({ newPassword: "newpass123" });
    expect(res.status).toBe(200);
    expect(User.scope).toHaveBeenCalledWith("withCredentials");
    expect(WebhookService.dispatch).toHaveBeenCalledWith("user.updated", { userId: 2, action: "password_reset", actorUserId: 1 });
  });

  test("PUT /api/users/:id/password rejects short passwords", async () => {
    const res = await request(app)
      .put("/api/users/2/password")
      .set("Authorization", "Bearer ok")
      .send({ newPassword: "short" });
    expect(res.status).toBe(400);
  });

  test("DELETE /api/users/:id blocks deleting yourself", async () => {
    const res = await request(app).delete("/api/users/1").set("Authorization", "Bearer ok");
    expect(res.status).toBe(409);
  });

  test("DELETE /api/users/:id blocks deleting the last active admin", async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(userRow({ id: 2, role: "admin" }));
    (User.count as jest.Mock).mockResolvedValue(1);
    const res = await request(app).delete("/api/users/2").set("Authorization", "Bearer ok");
    expect(res.status).toBe(409);
  });

  test("DELETE /api/users/:id deletes another user", async () => {
    const user = userRow({ id: 2, role: "user" });
    (User.findByPk as jest.Mock).mockResolvedValue(user);
    const res = await request(app).delete("/api/users/2").set("Authorization", "Bearer ok");
    expect(res.status).toBe(200);
    expect(user.destroy).toHaveBeenCalledTimes(1);
    expect(WebhookService.dispatch).toHaveBeenCalledWith("user.deleted", expect.any(Object));
  });

  test("GET /api/users returns 403 for regular users", async () => {
    mockRole = "user";
    const res = await request(app).get("/api/users").set("Authorization", "Bearer ok");
    expect(res.status).toBe(403);
  });
});

describe("Roles & users GraphQL API", () => {
  test("roles query lists roles for admins", async () => {
    const res = await gqlRequest('{ roles { data { name permissions } total } }');
    expect(res.body.errors).toBeUndefined();
    const names = res.body.data.roles.data.map((r: { name: string }) => r.name);
    expect(names).toContain("admin");
    expect(res.body.data.roles.total).toBeGreaterThanOrEqual(3);
  });

  test("roles query rejected for regular users", async () => {
    mockRole = "user";
    const res = await gqlRequest('{ roles { data { name } } }');
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toMatch(/Insufficient permissions/i);
  });

  test("role query returns a single role", async () => {
    const res = await gqlRequest('{ role(ref: "manager") { name isSystem } }');
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.role.name).toBe("manager");
    expect(res.body.data.role.isSystem).toBe(true);
  });

  test("permissionCatalog query returns modules", async () => {
    const res = await gqlRequest('{ permissionCatalog { module permissions } }');
    expect(res.body.errors).toBeUndefined();
    const users = res.body.data.permissionCatalog.find((m: { module: string }) => m.module === "users");
    expect(users.permissions).toContain("users:write");
  });

  test("createRole mutation creates a role as admin", async () => {
    const res = await gqlRequest(
      'mutation { createRole(name: "analyst", permissions: ["reports:read", "contacts:read"]) { name permissions } }'
    );
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.createRole.name).toBe("support_lead");
    expect(Role.create).toHaveBeenCalledTimes(1);
    expect(WebhookService.dispatch).toHaveBeenCalledWith("role.created", expect.any(Object));
  });

  test("createRole mutation rejected for non-admins", async () => {
    mockRole = "user";
    const res = await gqlRequest(
      'mutation { createRole(name: "analyst", permissions: ["reports:read"]) { name } }'
    );
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toMatch(/Insufficient permissions/i);
  });

  test("adminCreateUser mutation creates a user", async () => {
    const res = await gqlRequest(
      'mutation { adminCreateUser(firstName: "Jane", lastName: "Doe", email: "jane@example.com", role: "user") { email role } }'
    );
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.adminCreateUser.email).toBe("jane@example.com");
    expect(User.create).toHaveBeenCalledTimes(1);
  });

  test("assignUserRole mutation updates a user role", async () => {
    const res = await gqlRequest(
      'mutation { assignUserRole(id: "2", role: "manager") { id role } }'
    );
    expect(res.body.errors).toBeUndefined();
    expect(User.findByPk).toHaveBeenCalledWith(2);
    expect(WebhookService.dispatch).toHaveBeenCalledWith("user.role_changed", expect.any(Object));
  });

  test("setUserActive mutation deactivates a user", async () => {
    const res = await gqlRequest('mutation { setUserActive(id: "2", isActive: false) { id isActive } }');
    expect(res.body.errors).toBeUndefined();
    expect(WebhookService.dispatch).toHaveBeenCalledWith("user.updated", expect.any(Object));
  });

  test("resetUserPassword mutation resets a password", async () => {
    const res = await gqlRequest('mutation { resetUserPassword(id: "2", newPassword: "newpass123") }');
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.resetUserPassword).toBe(true);
    expect(User.scope).toHaveBeenCalledWith("withCredentials");
  });

  test("deleteRole mutation deletes an unused role as admin", async () => {
    const instance = roleRow({ id: 7 });
    (Role.findOne as jest.Mock).mockResolvedValue(instance);
    (User.count as jest.Mock).mockResolvedValue(0);
    const res = await gqlRequest('mutation { deleteRole(ref: "7") }');
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.deleteRole).toBe(true);
    expect(instance.destroy).toHaveBeenCalledTimes(1);
  });

  test("resetUserPassword mutation rejected for non-admins", async () => {
    mockRole = "user";
    const res = await gqlRequest('mutation { resetUserPassword(id: "2", newPassword: "newpass123") }');
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toMatch(/Insufficient permissions/i);
  });
});