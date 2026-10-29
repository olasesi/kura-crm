import {
  DEFAULT_STATUSES,
  PRIORITIES,
  type FieldDef,
  type ModuleDef,
  type ModuleRecord,
} from "./types";

const FIRST_NAMES = [
  "Ada",
  "Grace",
  "Alan",
  "Katherine",
  "Linus",
  "Margaret",
  "Dennis",
  "Barbara",
  "Tim",
  "Radia",
  "Amina",
  "Kwame",
  "Sofia",
  "Luis",
  "Chloé",
  "Noah",
  "Zara",
  "Omar",
  "Elena",
  "Victor",
];

const LAST_NAMES = [
  "Lovelace",
  "Hopper",
  "Turing",
  "Johnson",
  "Torvalds",
  "Hamilton",
  "Ritchie",
  "Liskov",
  "Berners-Lee",
  "Perlman",
  "Mwangi",
  "Okafor",
  "García",
  "Rossi",
  "Dubois",
  "Schmidt",
  "Haddad",
  "Novak",
  "Silva",
  "Kim",
];

export const COMPANIES = [
  "Northwind",
  "Acme Corp",
  "Globex",
  "Initech",
  "Umbrella",
  "Stark Industries",
  "Wayne Enterprises",
  "Hooli",
  "Vandelay",
  "Soylent",
  "Aster Labs",
  "Bluewave",
  "Cedar & Co",
  "Delta Systems",
  "Evergreen",
  "Falcon Works",
  "Granite",
  "Harbor",
  "Ironwood",
  "Juniper",
];

const CATEGORIES = ["Enterprise", "SMB", "Startup", "Government", "Non-profit"];

/** FNV-1a — tiny deterministic hash so demo rows are stable per module. */
const hash = (value: string): number => {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
};

const pick = <T>(items: T[], seed: number): T => {
  const index = ((seed % items.length) + items.length) % items.length;
  return items[index] as T;
};

const slug = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

const formatDate = (offsetDays: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const isAmountField = (key: string): boolean =>
  /amount|value|price|cost|salary|budget|balance|revenue|spend/i.test(key);

const isDateField = (field: FieldDef): boolean =>
  field.type === "date" || /date|expiry|renewal|until|period/i.test(field.key);

const valueFor = (field: FieldDef, module: ModuleDef, rowIndex: number, seed: number): string => {
  const name = module.seed.names[rowIndex % module.seed.names.length] ?? module.name;
  const person = `${pick(FIRST_NAMES, seed)} ${pick(LAST_NAMES, seed >> 3)}`;
  const company = pick(COMPANIES, seed >> 2);

  if (field.options && field.options.length > 0) {
    return pick(field.options, seed);
  }

  switch (field.type) {
    case "email":
      return `${slug(person)}@${slug(company).replace(/\./g, "")}.com`;
    case "tel":
      return `+1 (555) ${String(100 + (seed % 800)).padStart(3, "0")}-${String(1000 + (seed % 9000))}`;
    case "url":
      return `https://example.com/${slug(name)}`;
    case "currency":
      return String((hash(`${module.id}-${field.key}-${rowIndex}`) % 24_000) + 450);
    case "number":
      return String((hash(`${module.id}-${field.key}-${rowIndex + 1}`) % 60) + 1);
    case "date":
      return formatDate((seed % 170) - 40);
    case "select":
      return pick(field.options ?? CATEGORIES, seed);
    case "textarea":
      return `${name}: follow up with the account owner, confirm the next milestone and document the outcome of the review.`;
    default:
      break;
  }

  if (field.key === "status") {
    return pick(module.seed.statuses ?? DEFAULT_STATUSES, seed);
  }
  if (field.key === "priority") {
    return pick(PRIORITIES, seed);
  }
  if (field.key === "progress") {
    return String((seed % 86) + 10);
  }
  if (field.key === "hours") {
    return String((seed % 38) + 2);
  }
  if (field.key === "rating") {
    return String((seed % 5) + 1);
  }
  if (field.key === "quantity" || field.key === "stock" || field.key === "reorderLevel") {
    return String((seed % 280) + 5);
  }
  if (field.key === "category") {
    return pick(module.seed.categories ?? CATEGORIES, seed >> 4);
  }
  if (field.key === "owner" || field.key === "assignee" || field.key === "author") {
    return person;
  }
  if (
    field.key === "company" ||
    field.key === "customer" ||
    field.key === "vendor" ||
    field.key === "contact"
  ) {
    return company;
  }
  if (field.key === "employee" || field.key === "candidate" || field.key === "manager") {
    return person;
  }
  if (isAmountField(field.key)) {
    return String((hash(`${module.id}-${field.key}-${rowIndex}`) % 24_000) + 450);
  }
  if (isDateField(field)) {
    return formatDate((seed % 170) - 40);
  }
  if (field.key === "email" || field.key.endsWith("Email")) {
    return `${slug(person)}@${slug(company).replace(/\./g, "")}.com`;
  }
  if (field.key === "phone" || field.key.endsWith("Phone")) {
    return `+1 (555) ${String(100 + (seed % 800)).padStart(3, "0")}-${String(1000 + (seed % 9000))}`;
  }
  if (
    field.key === "description" ||
    field.key === "notes" ||
    field.key === "reason" ||
    field.key === "message"
  ) {
    return `${name}: follow up with the account owner and confirm the next milestone.`;
  }
  if (field.key === "name" || field.key === "title" || field.key === "subject") {
    return name;
  }

  return `${field.label} ${(seed % 40) + 1}`;
};

/**
 * Generates deterministic demo records for a module. Values only depend on the
 * module id, field key and row index so reloading produces identical data.
 */
export const buildSeedRecords = (module: ModuleDef): ModuleRecord[] => {
  const count = module.demoCount ?? 6;
  const today = new Date().toISOString();

  return Array.from({ length: count }, (_, rowIndex) => {
    const seed = hash(`${module.id}-${rowIndex}`);
    const record: ModuleRecord = {
      id: `seed-${module.id}-${rowIndex + 1}`,
      createdAt: new Date(Date.now() - rowIndex * 86_400_000).toISOString(),
      updatedAt: today,
    };

    for (const fieldDef of module.fields) {
      record[fieldDef.key] = valueFor(fieldDef, module, rowIndex, seed);
    }

    return record;
  });
};
