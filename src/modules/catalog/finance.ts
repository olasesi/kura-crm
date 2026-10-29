import { field, type ModuleDef } from "../types";

export const financeModules: ModuleDef[] = [
  {
    id: "expenses",
    name: "Expenses",
    group: "finance",
    kind: "crud",
    icon: "expense",
    description: "Capture employee and company spend with categories, receipts and approvals.",
    fields: [
      field("title", "Expense", "text", { required: true }),
      field("category", "Category", "select", {
        options: ["Travel", "Software", "Office", "Marketing", "Training", "Equipment"],
      }),
      field("status", "Status", "select", {
        options: ["Pending", "Approved", "Reimbursed", "Rejected"],
      }),
      field("amount", "Amount", "currency"),
      field("date", "Date", "date"),
      field("employee", "Submitted by"),
      field("notes", "Notes", "textarea", { inTable: false }),
    ],
    seed: {
      names: [
        "Client visit — Nairobi",
        "Annual design tool licence",
        "Team offsite catering",
        "LinkedIn campaign",
        "Leadership coaching",
        "Laptop refresh",
        "Conference tickets",
        "Office supplies",
      ],
    },
  },
  {
    id: "bank-accounts",
    name: "Bank accounts",
    group: "finance",
    kind: "crud",
    icon: "bank",
    description: "Company bank accounts, balances and reconciliation status.",
    fields: [
      field("name", "Account name", "text", { required: true }),
      field("bank", "Bank"),
      field("type", "Type", "select", { options: ["Current", "Savings", "Credit", "Petty cash"] }),
      field("balance", "Balance", "currency"),
      field("status", "Status", "select", { options: ["Active", "Dormant", "Closed"] }),
      field("currency", "Currency", "select", { options: ["USD", "EUR", "GBP", "KES"] }),
      field("iban", "IBAN", "text", { inTable: false }),
    ],
    seed: {
      names: [
        "Operating account",
        "Payroll account",
        "Tax reserve",
        "EUR collections",
        "Petty cash",
      ],
    },
  },
];
