import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Icon, type IconName } from "@/components/ui/Icon";
import { useI18n } from "@/i18n/I18nProvider";
import { getVisibleModules, searchModules } from "@/modules/registry";
import { useAuthStore } from "@/store/authStore";

interface PaletteItem {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  to: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export const CommandPalette = ({ open, onClose }: CommandPaletteProps) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.user?.role);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<PaletteItem[]>(() => {
    const dashboard: PaletteItem = {
      id: "dashboard",
      label: t("nav.dashboard"),
      hint: t("nav.overview"),
      icon: "dashboard",
      to: "/app/dashboard",
    };

    const modules = query.trim()
      ? searchModules(query, role)
      : getVisibleModules(role).filter((module) => module.group === "overview");

    return [
      dashboard,
      ...modules.map((module) => ({
        id: module.id,
        label: t(`modules.${module.id}`, module.name),
        hint: t(`nav.${module.group}`, module.group),
        icon: module.icon,
        to: `/app/${module.id}`,
      })),
    ];
  }, [query, role, t]);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open) {
    return null;
  }

  const go = (item: PaletteItem) => {
    navigate(item.to);
    onClose();
  };

  const handleKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % Math.max(items.length, 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current - 1 + items.length) % Math.max(items.length, 1));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const item = items[active];
      if (item) {
        go(item);
      }
    }
  };

  return (
    <div
      className="palette"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="palette__panel"
        role="dialog"
        aria-modal="true"
        aria-label={t("nav.globalSearch")}
      >
        <input
          ref={inputRef}
          type="search"
          className="palette__input"
          placeholder={t("nav.globalSearch")}
          aria-label={t("nav.globalSearch")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
        />

        <div className="palette__results">
          {items.length === 0 ? (
            <p className="palette__empty">{t("nav.noResults")}</p>
          ) : (
            items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`palette__item ${index === active ? "palette__item--active" : ""}`}
                onMouseEnter={() => setActive(index)}
                onClick={() => go(item)}
              >
                <Icon name={item.icon} size={16} />
                <span className="palette__item-label">{item.label}</span>
                <span className="palette__item-hint">{item.hint}</span>
              </button>
            ))
          )}
        </div>

        <div className="palette__footer">
          <span>
            <kbd className="topbar__kbd">↑</kbd>
            <kbd className="topbar__kbd">↓</kbd> {t("nav.commandHint")}
          </span>
          <span>
            <kbd className="topbar__kbd">Esc</kbd> {t("common.close")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
