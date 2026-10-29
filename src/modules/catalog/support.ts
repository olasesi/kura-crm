import { field, type ModuleDef } from "../types";

export const supportModules: ModuleDef[] = [
  {
    id: "tickets",
    name: "Tickets",
    group: "support",
    kind: "crud",
    icon: "ticket",
    description: "Customer support requests with priority, ownership and resolution status.",
    fields: [
      field("subject", "Subject", "text", { required: true }),
      field("customer", "Customer"),
      field("priority", "Priority", "select", { options: ["High", "Medium", "Low"] }),
      field("status", "Status", "select", {
        options: ["Open", "In progress", "Resolved", "Closed"],
      }),
      field("assignee", "Assignee"),
      field("updated", "Last updated", "date"),
      field("description", "Description", "textarea", { inTable: false }),
    ],
    seed: {
      names: [
        "Cannot export invoices",
        "SSO login loop",
        "Payroll totals mismatch",
        "Webhook delivery failures",
        "Add seats to subscription",
        "Biometric device offline",
        "Dashboard widget missing",
        "API rate limit question",
      ],
    },
  },
];

export const collaborationModules: ModuleDef[] = [
  {
    id: "events",
    name: "Events",
    group: "collaboration",
    kind: "crud",
    icon: "event",
    description: "Company events, webinars and customer sessions.",
    fields: [
      field("title", "Event", "text", { required: true }),
      field("type", "Type", "select", {
        options: ["Webinar", "Workshop", "Conference", "Internal"],
      }),
      field("location", "Location"),
      field("startDate", "Date", "date"),
      field("status", "Status", "select", {
        options: ["Scheduled", "Live", "Completed", "Cancelled"],
      }),
      field("owner", "Owner"),
      field("description", "Description", "textarea", { inTable: false }),
    ],
    seed: {
      names: [
        "Q3 customer webinar",
        "Finance leaders roundtable",
        "Biometric product workshop",
        "Annual partner summit",
        "Engineering offsite",
        "Recruitment open day",
      ],
    },
  },
  {
    id: "messages",
    name: "Messages",
    group: "collaboration",
    kind: "crud",
    icon: "message",
    description: "Internal messages and announcements with read state.",
    fields: [
      field("subject", "Subject", "text", { required: true }),
      field("from", "From"),
      field("to", "To"),
      field("priority", "Priority", "select", { options: ["High", "Medium", "Low"] }),
      field("status", "Status", "select", { options: ["Unread", "Read", "Archived"] }),
      field("date", "Date", "date"),
      field("body", "Message", "textarea", { inTable: false }),
    ],
    seed: {
      names: [
        "Payroll cut-off this Friday",
        "New onboarding checklist",
        "Office access update",
        "Monthly all-hands agenda",
        "Security reminder",
        "Wellness week schedule",
      ],
    },
  },
  {
    id: "notice-board",
    name: "Notice board",
    group: "collaboration",
    kind: "crud",
    icon: "notice",
    description: "Policy updates and company-wide notices.",
    fields: [
      field("title", "Notice", "text", { required: true }),
      field("category", "Category", "select", {
        options: ["Policy", "HR", "Operations", "Security", "Culture"],
      }),
      field("author", "Author"),
      field("status", "Status", "select", { options: ["Published", "Draft", "Archived"] }),
      field("date", "Published", "date"),
      field("body", "Notice", "textarea", { inTable: false }),
    ],
    seed: {
      names: [
        "Updated travel policy",
        "Holiday calendar 2026",
        "Remote work guidelines",
        "Password rotation reminder",
        "New starter welcome guide",
      ],
    },
  },
  {
    id: "assets",
    name: "Assets",
    group: "collaboration",
    kind: "crud",
    icon: "asset",
    description: "Company assets, assignments and lifecycle status.",
    fields: [
      field("name", "Asset", "text", { required: true }),
      field("category", "Category", "select", {
        options: ["Laptop", "Phone", "Monitor", "Vehicle", "Furniture", "Licence"],
      }),
      field("assignedTo", "Assigned to"),
      field("value", "Value", "currency"),
      field("status", "Status", "select", { options: ["In use", "Available", "Retired"] }),
      field("purchased", "Purchased", "date", { inTable: false }),
      field("serial", "Serial", "text", { inTable: false }),
    ],
    seed: {
      names: [
        "MacBook Pro 14",
        "Dell UltraSharp 27",
        "iPhone 15",
        "Standing desk",
        "Fleet van",
        "Adobe licence",
        "Conference room display",
      ],
    },
  },
  {
    id: "biolinks",
    name: "Biolinks",
    group: "collaboration",
    kind: "crud",
    icon: "link",
    description: "Shareable profile link hubs for teams and showrooms.",
    fields: [
      field("title", "Title", "text", { required: true }),
      field("url", "URL", "url"),
      field("status", "Status", "select", { options: ["Active", "Paused", "Archived"] }),
      field("clicks", "Clicks", "number"),
      field("owner", "Owner"),
      field("date", "Created", "date", { inTable: false }),
    ],
    seed: {
      names: [
        "Kura sales team",
        "Northwind showroom",
        "Recruitment hub",
        "Partner directory",
        "Support resources",
      ],
    },
  },
];
