import request from "supertest";
import app, { apolloReady } from "../src/app";
import { Response, NextFunction } from "express";

let mockAuthenticated = true;
let mockUser: Record<string, unknown> = {
  id: 1,
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  role: "user",
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

jest.mock("../src/middleware/auth", () => ({
  authenticate: (req: any, _res: Response, next: NextFunction) => {
    if (mockAuthenticated) {
      req.user = { userId: mockUser.id, email: mockUser.email, role: mockUser.role };
      next();
    } else {
      _res.status(401).json({ success: false, error: "Access denied. No token provided." });
    }
  },
  optionalAuth: (req: any, _res: Response, next: NextFunction) => {
    if (mockAuthenticated) {
      req.user = { userId: mockUser.id, email: mockUser.email, role: mockUser.role };
    }
    next();
  },
  authorize: () => (_req: any, _res: Response, next: NextFunction) => next(),
}));

jest.mock("../src/models/User", () => ({
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
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

const { User } = jest.requireMock("../src/models/User");
const { Contact } = jest.requireMock("../src/models/Contact");
const { Webhook } = jest.requireMock("../src/models/Webhook");

const gqlRequest = (query: string, variables?: Record<string, unknown>) =>
  request(app)
    .post("/graphql")
    .set("Authorization", "Bearer test-token")
    .send({ query, variables });

const gqlRequestPublic = (query: string, variables?: Record<string, unknown>) =>
  request(app)
    .post("/graphql")
    .send({ query, variables });

beforeAll(async () => {
  await apolloReady;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthenticated = true;
  mockUser = {
    id: 1,
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    role: "user",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
});

describe("GraphQL API", () => {
  describe("Query.me", () => {
    it("should return authenticated user profile", async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const res = await gqlRequest(`{ me { id firstName email role } }`);
      expect(res.status).toBe(200);
      expect(res.body.data.me).toMatchObject({
        id: "1",
        firstName: "Test",
        email: "test@example.com",
        role: "user",
      });
    });

    it("should reject unauthenticated requests", async () => {
      mockAuthenticated = false;
      const res = await request(app)
        .post("/graphql")
        .send({ query: "{ me { id } }" });
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toContain("Not authenticated");
    });
  });

  describe("Query.users", () => {
    it("should return paginated users", async () => {
      const mockRows = [
        { id: 1, firstName: "Alice", lastName: "A", email: "alice@test.com", role: "admin" },
        { id: 2, firstName: "Bob", lastName: "B", email: "bob@test.com", role: "user" },
      ];
      (User.findAndCountAll as jest.Mock).mockResolvedValue({ rows: mockRows, count: 2 });

      const res = await gqlRequest(`{ users(page: 1, limit: 10) { data { id firstName email role } total } }`);
      expect(res.status).toBe(200);
      expect(res.body.data.users.data).toHaveLength(2);
      expect(res.body.data.users.total).toBe(2);
    });
  });

  describe("Query.contacts", () => {
    it("should return paginated contacts", async () => {
      const mockRows = [
        { id: 1, firstName: "Client", lastName: "X", email: "x@test.com" },
      ];
      (Contact.findAndCountAll as jest.Mock).mockResolvedValue({ rows: mockRows, count: 1 });

      const res = await gqlRequest(`{ contacts(page: 1, limit: 10) { data { id firstName email } total } }`);
      expect(res.status).toBe(200);
      expect(res.body.data.contacts.data).toHaveLength(1);
    });
  });

  describe("Query.webhooks", () => {
    it("should return webhooks for authenticated user", async () => {
      (Webhook.findAll as jest.Mock).mockResolvedValue([
        { id: 1, userId: 1, url: "https://hook.example.com", events: ["contact.created"], enabled: true },
      ]);

      const res = await gqlRequest(`{ webhooks { id url events enabled } }`);
      expect(res.status).toBe(200);
      expect(res.body.data.webhooks).toHaveLength(1);
      expect(res.body.data.webhooks[0].url).toBe("https://hook.example.com");
    });
  });

  describe("Mutation.register", () => {
    it("should register a new user", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue({
        id: 2,
        firstName: "New",
        lastName: "User",
        email: "new@test.com",
        role: "user",
        toJSON: () => ({ id: 2, firstName: "New", lastName: "User", email: "new@test.com", role: "user" }),
        update: jest.fn().mockResolvedValue(true),
      } as any);

      const res = await gqlRequestPublic(
        `mutation($f: String!, $l: String!, $e: String!, $p: String!) {
          register(firstName: $f, lastName: $l, email: $e, password: $p) { user { id email } accessToken refreshToken }
        }`,
        { f: "New", l: "User", e: "new@test.com", p: "Password123!" }
      );
      expect(res.status).toBe(200);
      expect(res.body.data.register.user.email).toBe("new@test.com");
      expect(res.body.data.register.accessToken).toBeDefined();
    });
  });

  describe("Mutation.login", () => {
    it("should login with valid credentials", async () => {
      const mockUserRecord = {
        id: 1,
        email: "test@test.com",
        role: "user",
        isActive: true,
        totpEnabled: false,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        validatePassword: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ id: 1, email: "test@test.com", role: "user" }),
        update: jest.fn().mockResolvedValue(true),
      };
      (User.scope as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockUserRecord),
      } as any);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUserRecord);

      const res = await gqlRequestPublic(
        `mutation($e: String!, $p: String!) { login(email: $e, password: $p) { ... on AuthPayload { user { id email } accessToken refreshToken } ... on MfaRequired { mfaRequired mfaToken } } }`,
        { e: "test@test.com", p: "Password123!" }
      );
      expect(res.status).toBe(200);
      expect(res.body.data.login.user.email).toBe("test@test.com");
    });

    it("should reject invalid credentials", async () => {
      const mockUserRecord = {
        isActive: true,
        totpEnabled: false,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        validatePassword: jest.fn().mockResolvedValue(false),
        update: jest.fn().mockResolvedValue(true),
        id: 1,
      };
      (User.scope as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockUserRecord),
      } as any);

      const res = await gqlRequestPublic(
        `mutation($e: String!, $p: String!) { login(email: $e, password: $p) { ... on AuthPayload { user { id } } ... on MfaRequired { mfaRequired } } }`,
        { e: "test@test.com", p: "wrong" }
      );
      expect(res.status).toBe(200);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toContain("Invalid email or password");
    });
  });

  describe("Mutation.createContact", () => {
    it("should create a contact", async () => {
      (Contact.create as jest.Mock).mockResolvedValue({
        id: 1,
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@test.com",
      });

      const res = await gqlRequest(
        `mutation { createContact(firstName: "Jane", lastName: "Doe", email: "jane@test.com") { id firstName email } }`
      );
      expect(res.status).toBe(200);
      expect(res.body.data.createContact.email).toBe("jane@test.com");
    });
  });

  describe("Mutation.webhookSubscribe", () => {
    it("should subscribe a webhook", async () => {
      (Webhook.create as jest.Mock).mockResolvedValue({
        id: 1,
        userId: 1,
        url: "https://hook.test.com",
        events: ["contact.created"],
        enabled: true,
      });

      const res = await gqlRequest(
        `mutation { webhookSubscribe(url: "https://hook.test.com", events: ["contact.created"]) { id url events enabled } }`
      );
      expect(res.status).toBe(200);
      expect(res.body.data.webhookSubscribe.url).toBe("https://hook.test.com");
    });
  });
});
