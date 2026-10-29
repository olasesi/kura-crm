import { logger } from "@/lib/logger";

import { buildSeedRecords } from "./seed";
import type { ModuleDef, ModuleRecord, RecordValues } from "./types";

const STORAGE_PREFIX = "kura-crm.records.v1.";
const cache = new Map<string, ModuleRecord[]>();
const listeners = new Map<string, Set<() => void>>();
let storageBound = false;

const storageKey = (moduleId: string): string => `${STORAGE_PREFIX}${moduleId}`;

const notify = (moduleId: string): void => {
  listeners.get(moduleId)?.forEach((listener) => listener());
};

const persist = (moduleId: string, records: ModuleRecord[]): void => {
  try {
    window.localStorage.setItem(storageKey(moduleId), JSON.stringify(records));
  } catch (error) {
    logger.warn(`Unable to persist module "${moduleId}" locally.`, error);
  }
};

const bindStorageEvents = (): void => {
  if (storageBound || typeof window === "undefined") {
    return;
  }
  storageBound = true;
  window.addEventListener("storage", (event) => {
    if (!event.key?.startsWith(STORAGE_PREFIX)) {
      return;
    }
    const moduleId = event.key.slice(STORAGE_PREFIX.length);
    cache.delete(moduleId);
    notify(moduleId);
  });
};

const readStored = (moduleId: string): ModuleRecord[] | null => {
  try {
    const raw = window.localStorage.getItem(storageKey(moduleId));
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed as ModuleRecord[];
  } catch (error) {
    logger.warn(`Unable to read stored records for "${moduleId}".`, error);
    return null;
  }
};

/**
 * Returns the module's records, seeding deterministic demo data the first time
 * the module is opened. The returned array identity is stable between renders
 * so it is safe for useSyncExternalStore.
 */
export const getModuleRecords = (module: ModuleDef): ModuleRecord[] => {
  bindStorageEvents();
  const cached = cache.get(module.id);
  if (cached) {
    return cached;
  }

  const stored = readStored(module.id);
  if (stored) {
    cache.set(module.id, stored);
    return stored;
  }

  const seeded = buildSeedRecords(module);
  cache.set(module.id, seeded);
  persist(module.id, seeded);
  logger.info(`Seeded ${seeded.length} demo records for module "${module.id}".`);
  return seeded;
};

export const subscribeModule = (moduleId: string, listener: () => void): (() => void) => {
  const existing = listeners.get(moduleId) ?? new Set<() => void>();
  existing.add(listener);
  listeners.set(moduleId, existing);
  return () => {
    existing.delete(listener);
    if (existing.size === 0) {
      listeners.delete(moduleId);
    }
  };
};

const commit = (module: ModuleDef, records: ModuleRecord[]): void => {
  cache.set(module.id, records);
  persist(module.id, records);
  notify(module.id);
};

const makeId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `rec-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
};

export const createRecord = (module: ModuleDef, values: RecordValues): ModuleRecord => {
  const now = new Date().toISOString();
  const record: ModuleRecord = { ...values, id: makeId(), createdAt: now, updatedAt: now };
  commit(module, [record, ...getModuleRecords(module)]);
  logger.info(`Created record in "${module.id}".`, { id: record.id });
  return record;
};

export const updateRecord = (
  module: ModuleDef,
  id: string,
  values: RecordValues,
): ModuleRecord | null => {
  let updated: ModuleRecord | null = null;
  const records = getModuleRecords(module).map((record) => {
    if (record.id !== id) {
      return record;
    }
    updated = { ...record, ...values, updatedAt: new Date().toISOString() };
    return updated;
  });
  if (updated) {
    commit(module, records);
    logger.info(`Updated record in "${module.id}".`, { id });
  }
  return updated;
};

export const deleteRecords = (module: ModuleDef, ids: string[]): number => {
  const target = new Set(ids);
  const current = getModuleRecords(module);
  const next = current.filter((record) => !target.has(record.id));
  const removed = current.length - next.length;
  if (removed > 0) {
    commit(module, next);
    logger.info(`Deleted ${removed} record(s) from "${module.id}".`);
  }
  return removed;
};

export const resetModule = (module: ModuleDef): void => {
  cache.delete(module.id);
  try {
    window.localStorage.removeItem(storageKey(module.id));
  } catch {
    // Ignore storage failures.
  }
  notify(module.id);
  logger.info(`Reset demo data for "${module.id}".`);
};

export const clearModuleCache = (): void => {
  cache.clear();
};
