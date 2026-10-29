import { useCallback, useEffect, useMemo, useState } from "react";

import { logger } from "@/lib/logger";

import {
  type DashboardRole,
  type LayoutVariant,
  type StoredLayout,
  defaultLayout,
  resolveLayout,
  widgetsForRole,
} from "./widgets";

const STORAGE_PREFIX = "kura-crm.dashboard";

const storageKey = (userId: string, variant: LayoutVariant): string =>
  `${STORAGE_PREFIX}.${userId || "guest"}.${variant}`;

const readLayout = (key: string): StoredLayout | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredLayout;
    return {
      order: Array.isArray(parsed.order) ? parsed.order : [],
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
    };
  } catch (error) {
    logger.warn("Unable to read dashboard layout; using defaults.", error);
    return null;
  }
};

export interface DashboardLayoutState {
  order: string[];
  hidden: string[];
  visible: string[];
  hiddenIds: string[];
  available: string[];
  toggle: (id: string) => void;
  hide: (id: string) => void;
  show: (id: string) => void;
  move: (activeId: string, overId: string) => void;
  reset: () => void;
  showAll: () => void;
}

/**
 * Persists one layout per user and variant. Hidden widgets stay in the order so
 * re-enabling them restores their previous position instead of appending.
 */
export const useDashboardLayout = (
  userId: string,
  role: DashboardRole,
  variant: LayoutVariant,
): DashboardLayoutState => {
  const key = storageKey(userId, variant);
  const [state, setState] = useState<{ order: string[]; hidden: string[] }>(() =>
    resolveLayout(role, variant, readLayout(key)),
  );

  useEffect(() => {
    setState(resolveLayout(role, variant, readLayout(key)));
  }, [key, role, variant]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      logger.warn("Unable to persist dashboard layout.", error);
    }
  }, [key, state]);

  const toggle = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      hidden: current.hidden.includes(id)
        ? current.hidden.filter((item) => item !== id)
        : [...current.hidden, id],
    }));
  }, []);

  const hide = useCallback((id: string) => {
    setState((current) =>
      current.hidden.includes(id) ? current : { ...current, hidden: [...current.hidden, id] },
    );
  }, []);

  const show = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      order: current.order.includes(id) ? current.order : [...current.order, id],
      hidden: current.hidden.filter((item) => item !== id),
    }));
  }, []);

  const move = useCallback((activeId: string, overId: string) => {
    setState((current) => {
      const from = current.order.indexOf(activeId);
      const to = current.order.indexOf(overId);
      if (from < 0 || to < 0 || from === to) {
        return current;
      }
      const order = [...current.order];
      order.splice(to, 0, ...order.splice(from, 1));
      return { ...current, order };
    });
  }, []);

  const showAll = useCallback(() => {
    setState((current) => ({ ...current, hidden: [] }));
  }, []);

  const reset = useCallback(() => {
    setState({ order: defaultLayout(role, variant), hidden: [] });
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Storage can be unavailable in private browsing; the reset still applies.
    }
  }, [key, role, variant]);

  const available = useMemo(() => {
    const allowed = widgetsForRole(role).map((widget) => widget.id);
    return allowed.filter((id) => !state.order.includes(id));
  }, [role, state.order]);

  const hiddenIds = useMemo(
    () => state.order.filter((id) => state.hidden.includes(id)),
    [state.hidden, state.order],
  );

  const visible = useMemo(
    () => state.order.filter((id) => !state.hidden.includes(id)),
    [state.hidden, state.order],
  );

  return {
    order: state.order,
    hidden: state.hidden,
    visible,
    hiddenIds,
    available,
    toggle,
    hide,
    show,
    move,
    reset,
    showAll,
  };
};
