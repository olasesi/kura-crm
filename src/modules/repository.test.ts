import { beforeEach, describe, expect, it } from "vitest";

import { getModuleById } from "./registry";
import {
  clearModuleCache,
  createRecord,
  deleteRecords,
  getModuleRecords,
  resetModule,
  subscribeModule,
  updateRecord,
} from "./repository";

const module = getModuleById("leads");

if (!module) {
  throw new Error("leads module is required for repository tests");
}

describe("module repository", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearModuleCache();
  });

  it("seeds deterministic demo data and persists it", () => {
    const first = getModuleRecords(module);
    expect(first.length).toBeGreaterThan(0);
    expect(window.localStorage.getItem(`kura-crm.records.v1.${module.id}`)).not.toBeNull();

    clearModuleCache();
    const second = getModuleRecords(module);
    expect(second).toHaveLength(first.length);
    expect(second[0]).toEqual(first[0]);
  });

  it("creates records at the top of the list", () => {
    const seeded = getModuleRecords(module);
    const created = createRecord(module, { name: "New lead", status: "New" });

    const records = getModuleRecords(module);
    expect(records).toHaveLength(seeded.length + 1);
    expect(records[0]?.id).toBe(created.id);
    expect(records[0]?.name).toBe("New lead");
  });

  it("updates an existing record and ignores unknown ids", () => {
    const [first] = getModuleRecords(module);
    const updated = updateRecord(module, first!.id, { status: "Qualified" });

    expect(updated?.status).toBe("Qualified");
    expect(getModuleRecords(module).find((record) => record.id === first!.id)?.status).toBe(
      "Qualified",
    );
    expect(updateRecord(module, "missing", { status: "Lost" })).toBeNull();
  });

  it("deletes records and reports the removed count", () => {
    const seeded = getModuleRecords(module);
    const [first, second] = seeded;
    const removed = deleteRecords(module, [first!.id, second!.id]);

    expect(removed).toBe(2);
    expect(deleteRecords(module, ["missing"])).toBe(0);
    expect(getModuleRecords(module)).toHaveLength(seeded.length - 2);
  });

  it("notifies subscribers about changes", () => {
    let calls = 0;
    const unsubscribe = subscribeModule(module.id, () => {
      calls += 1;
    });

    createRecord(module, { name: "Subscription lead" });
    expect(calls).toBe(1);

    unsubscribe();
    createRecord(module, { name: "Another lead" });
    expect(calls).toBe(1);
  });

  it("resets stored data and reseeds on the next read", () => {
    const seeded = getModuleRecords(module);
    createRecord(module, { name: "Temporary" });
    expect(getModuleRecords(module)).toHaveLength(seeded.length + 1);

    resetModule(module);
    clearModuleCache();
    const restored = getModuleRecords(module);

    expect(restored).toHaveLength(seeded.length);
    expect(restored.some((record) => record.name === "Temporary")).toBe(false);
  });
});
