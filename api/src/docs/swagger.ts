import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Kura CRM API",
      version: "1.0.0",
      description:
        "Enterprise-grade CRM API with authentication, user management & RBAC roles, contact management, webhooks, " +
        "GraphQL, and a full settings engine (company, app, notification, currency, theme, security, and more).",
      contact: {
        name: "API Support",
        email: "support@kura-crm.com",
      },
    },
    servers: [
      { url: "http://localhost:5000", description: "Development server" },
      { url: "https://api.kura-crm.com", description: "Production server" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["admin", "manager", "user"] },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Contact: {
          type: "object",
          properties: {
            id: { type: "integer" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            company: { type: "string" },
            createdBy: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" },
            message: { type: "string" },
            error: { type: "string" },
          },
        },
        Setting: {
          type: "object",
          properties: {
            id: { type: "integer" },
            group: { type: "string" },
            key: { type: "string" },
            value: { type: "string", description: "JSON-encoded value" },
            userId: { type: "integer", description: "0 for global settings, otherwise the owning user" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        SettingGroupMeta: {
          type: "object",
          properties: {
            group: { type: "string" },
            description: { type: "string" },
            scope: { type: "string", enum: ["global", "user", "both"] },
            sensitive: { type: "boolean" },
          },
        },
        Role: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string", description: "Role slug, e.g. admin, manager, support_lead" },
            description: { type: "string" },
            permissions: {
              type: "array",
              items: { type: "string", description: "Permission key, e.g. users:write" },
            },
            isSystem: { type: "boolean", description: "Built-in roles cannot be renamed/deleted" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        PermissionModule: {
          type: "object",
          properties: {
            module: { type: "string" },
            label: { type: "string" },
            permissions: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    paths: {},
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
