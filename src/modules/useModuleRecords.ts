import { useCallback, useSyncExternalStore } from "react";

import { getModuleRecords, subscribeModule } from "./repository";
import type { ModuleDef, ModuleRecord } from "./types";

/**
 * Subscribes a component to a module's local record store. Every mutation
 * notifies only the affected module, keeping unrelated pages cheap.
 */
export const useModuleRecords = (module: ModuleDef): ModuleRecord[] => {
  const subscribe = useCallback(
    (listener: () => void) => subscribeModule(module.id, listener),
    [module.id],
  );
  const getSnapshot = useCallback(() => getModuleRecords(module), [module]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
