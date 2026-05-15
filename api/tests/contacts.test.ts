import request from "supertest";
import app from "../src/app";

describe("Contacts API", () => {
  let accessToken: string;

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "Password123!",
    });
    accessToken = res.body.data?.tokens?.accessToken;
  });

  const testContact = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+1234567890",
    company: "Test Corp",
  };

  describe("POST /api/contacts", () => {
    it("should create a contact when authenticated", async () => {
      const res = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(testContact);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testContact.email);
    });

    it("should reject creation without auth", async () => {
      const res = await request(app).post("/api/contacts").send(testContact);
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/contacts", () => {
    it("should list contacts when authenticated", async () => {
      const res = await request(app)
        .get("/api/contacts")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
