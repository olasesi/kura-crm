import { field, type ModuleDef } from "../types";

export const showroomModules: ModuleDef[] = [
  {
    id: "showroom-contacts",
    name: "Showroom contacts",
    group: "showroom",
    kind: "crud",
    icon: "contact",
    description: "Visitors and prospects captured at the showroom.",
    fields: [
      field("name", "Visitor", "text", { required: true }),
      field("company", "Company"),
      field("email", "Email", "email"),
      field("phone", "Phone", "tel", { inTable: false }),
      field("status", "Status", "select", {
        options: ["New", "Contacted", "Qualified", "Lost"],
      }),
      field("owner", "Host"),
      field("visited", "Visited", "date"),
      field("notes", "Notes", "textarea", { inTable: false }),
    ],
    seed: {
      names: [
        "Ada Lovelace",
        "Grace Hopper",
        "Kwame Mensah",
        "Sofia Rossi",
        "Liam Chen",
        "Amara Okafor",
      ],
    },
  },
  {
    id: "showroom-deals",
    name: "Showroom deals",
    group: "showroom",
    kind: "crud",
    icon: "handshake",
    description: "Opportunities that originated in the showroom.",
    fields: [
      field("name", "Deal", "text", { required: true }),
      field("contact", "Contact"),
      field("stage", "Stage", "select", {
        options: ["Discovery", "Proposal", "Negotiation", "Won", "Lost"],
      }),
      field("value", "Value", "currency"),
      field("status", "Status", "select", { options: ["Open", "Won", "Lost"] }),
      field("date", "Created", "date"),
      field("notes", "Notes", "textarea", { inTable: false }),
    ],
    seed: {
      names: [
        "Showroom enterprise demo",
        "Retail fit-out proposal",
        "Biometric access pilot",
        "Showroom partnership",
        "Kiosk deployment",
      ],
    },
  },
  {
    id: "feedback-qr",
    name: "Feedback QR code",
    group: "showroom",
    kind: "special",
    icon: "qr",
    description: "A printable QR code that opens the showroom feedback form.",
    fields: [],
    seed: { names: [] },
  },
];

export const webhookModules: ModuleDef[] = [
  {
    id: "webhooks",
    name: "Webhooks",
    group: "webhooks",
    kind: "crud",
    icon: "webhook",
    description: "Subscribe external systems to CRM events with signed deliveries.",
    fields: [
      field("name", "Endpoint", "text", { required: true }),
      field("url", "Endpoint URL", "url"),
      field("event", "Event", "select", {
        options: [
          "customer.created",
          "deal.won",
          "invoice.paid",
          "ticket.created",
          "employee.created",
          "payroll.completed",
        ],
      }),
      field("status", "Status", "select", { options: ["Active", "Paused", "Failed"] }),
      field("lastDelivery", "Last delivery", "date"),
      field("secret", "Signing secret", "text", { inTable: false }),
    ],
    seed: {
      names: [
        "Slack notifications",
        "Data warehouse sync",
        "Billing automation",
        "Support escalation",
        "HR onboarding",
        "Payroll ledger",
      ],
    },
  },
  {
    id: "webhook-logs",
    name: "Webhook log",
    group: "webhooks",
    kind: "crud",
    icon: "log",
    description: "Delivery history with response codes and retry state.",
    fields: [
      field("webhook", "Webhook", "text", { required: true }),
      field("event", "Event", "select", {
        options: [
          "customer.created",
          "deal.won",
          "invoice.paid",
          "ticket.created",
          "employee.created",
          "payroll.completed",
        ],
      }),
      field("status", "Status", "select", { options: ["Success", "Failed", "Retrying"] }),
      field("responseCode", "Response", "number"),
      field("date", "Delivered", "date"),
      field("duration", "Duration (ms)", "number", { inTable: false }),
    ],
    seed: {
      names: [
        "Slack notifications",
        "Data warehouse sync",
        "Billing automation",
        "Support escalation",
        "HR onboarding",
        "Payroll ledger",
      ],
    },
  },
];

export const documentModules: ModuleDef[] = [
  {
    id: "letter-templates",
    name: "Letter templates",
    group: "documents",
    kind: "crud",
    icon: "letter",
    description: "Reusable letter templates for HR, finance and legal correspondence.",
    fields: [
      field("name", "Template", "text", { required: true }),
      field("category", "Category", "select", {
        options: ["Employment", "Payroll", "Offer", "Warning", "Reference", "Finance"],
      }),
      field("language", "Language", "select", {
        options: ["English", "French", "Spanish", "Swahili"],
      }),
      field("status", "Status", "select", { options: ["Active", "Draft", "Archived"] }),
      field("updated", "Updated", "date"),
      field("body", "Body", "textarea", { inTable: false }),
    ],
    seed: {
      names: [
        "Employment verification",
        "Salary review letter",
        "Offer of employment",
        "Performance warning",
        "Reference letter",
        "Payment reminder",
      ],
    },
  },
  {
    id: "letter-generator",
    name: "Generate letter",
    group: "documents",
    kind: "special",
    icon: "letter",
    description: "Merge a template with employee data and print a finished letter.",
    fields: [],
    seed: { names: [] },
  },
];
