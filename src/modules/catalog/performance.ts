import { field, type ModuleDef } from "../types";

export const performanceModules: ModuleDef[] = [
  {
    id: "performance-dashboard",
    name: "Performance dashboard",
    group: "performance",
    kind: "special",
    icon: "performance",
    description: "Goal attainment, OKR health and review cadence across the organisation.",
    fields: [],
    seed: { names: [] },
  },
  {
    id: "objectives",
    name: "Objectives",
    group: "performance",
    kind: "crud",
    icon: "objective",
    description: "Company, team and individual objectives with measurable progress.",
    fields: [
      field("title", "Objective", "text", { required: true }),
      field("owner", "Owner"),
      field("progress", "Progress %", "number", { min: 0, max: 100 }),
      field("status", "Status", "select", {
        options: ["On track", "At risk", "Off track", "Done"],
      }),
      field("quarter", "Quarter", "select", { options: ["Q1", "Q2", "Q3", "Q4"] }),
      field("dueDate", "Due date", "date"),
      field("description", "Description", "textarea", { inTable: false }),
    ],
    seed: {
      names: [
        "Grow ARR by 30%",
        "Reduce onboarding time",
        "Launch payroll in three markets",
        "Improve CSAT to 95%",
        "Hire twelve engineers",
        "Ship analytics workspace",
      ],
    },
  },
  {
    id: "okr-scores",
    name: "OKR scores",
    group: "performance",
    kind: "crud",
    icon: "okr",
    description: "Key results and weighted scores for every objective.",
    fields: [
      field("objective", "Objective", "text", { required: true }),
      field("keyResult", "Key result"),
      field("score", "Score", "number", { min: 0, max: 100 }),
      field("quarter", "Quarter", "select", { options: ["Q1", "Q2", "Q3", "Q4"] }),
      field("status", "Status", "select", { options: ["On track", "At risk", "Done"] }),
      field("notes", "Notes", "textarea", { inTable: false }),
    ],
    seed: {
      names: [
        "Grow ARR by 30%",
        "Reduce onboarding time",
        "Improve CSAT to 95%",
        "Hire twelve engineers",
        "Ship analytics workspace",
        "Expand into two regions",
      ],
    },
  },
  {
    id: "one-on-ones",
    name: "1:1 meetings",
    group: "performance",
    kind: "crud",
    icon: "meeting",
    description: "Structured one-to-one agendas, notes and follow-ups.",
    fields: [
      field("employee", "Employee", "text", { required: true }),
      field("manager", "Manager"),
      field("date", "Date", "date"),
      field("status", "Status", "select", { options: ["Scheduled", "Completed", "Cancelled"] }),
      field("notes", "Notes", "textarea"),
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
];
