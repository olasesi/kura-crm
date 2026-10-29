import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/i18n/I18nProvider";
import { getModuleById } from "@/modules/registry";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/theme/ThemeProvider";

type MenuId = "language" | "user" | null;

interface TopbarProps {
  onToggleSidebar: () => void;
  onOpenPalette: () => void;
  collapsed: boolean;
}

export const Topbar = ({ onToggleSidebar, onOpenPalette, collapsed }: TopbarProps) => {
  const { t, language, languages, setLanguage } = useI18n();
  const { colorMode, toggleColorMode } = useTheme();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const [menu, setMenu] = useState<MenuId>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const moduleId = location.pathname.replace(/^\/app\/?/, "").split("/")[0];
  const current = getModuleById(moduleId);
  const currentName =
    moduleId === "dashboard" || !moduleId
      ? t("nav.dashboard")
      : t(`modules.${moduleId}`, current?.name ?? moduleId);
  const groupKey = current ? `nav.${current.group}` : "nav.overview";

  useEffect(() => {
    setMenu(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!menu) {
      return;
    }
    const handlePointer = (event: MouseEvent) => {
      if (!actionsRef.current?.contains(event.target as Node)) {
        setMenu(null);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(null);
      }
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menu]);

  const initials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : "KU";
  const displayName = user ? `${user.firstName} ${user.lastName}` : t("roles.user");
  const activeLanguage = languages.find((item) => item.code === language);

  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar__icon-btn topbar__toggle"
        onClick={onToggleSidebar}
        aria-label={collapsed ? t("nav.expand") : t("nav.collapse")}
      >
        <Icon name="menu" />
      </button>

      <nav className="topbar__breadcrumbs" aria-label={t("nav.dashboard")}>
        <Link to="/app/dashboard" className="topbar__crumb">
          {t("app.name")}
        </Link>
        <Icon name="chevronRight" size={12} />
        <Link to="/app/dashboard" className="topbar__crumb">
          {t(groupKey)}
        </Link>
        <Icon name="chevronRight" size={12} />
        <span className="topbar__crumb topbar__crumb--current">{currentName}</span>
      </nav>

      <span className="topbar__spacer" />

      <button
        type="button"
        className="topbar__search-btn"
        onClick={onOpenPalette}
        aria-label={t("nav.globalSearch")}
      >
        <Icon name="search" size={15} />
        <span className="topbar__search-text">{t("nav.globalSearch")}</span>
        <kbd className="topbar__kbd">Ctrl K</kbd>
      </button>

      <div className="topbar__actions" ref={actionsRef}>
        <button
          type="button"
          className="topbar__icon-btn"
          onClick={toggleColorMode}
          aria-label={colorMode === "dark" ? t("nav.light") : t("nav.dark")}
          title={colorMode === "dark" ? t("nav.light") : t("nav.dark")}
        >
          <Icon name={colorMode === "dark" ? "sun" : "moon"} />
        </button>

        <div className="topbar__menu-wrap">
          <button
            type="button"
            className="topbar__icon-btn"
            onClick={() =>
              setMenu((currentMenu) => (currentMenu === "language" ? null : "language"))
            }
            aria-haspopup="menu"
            aria-expanded={menu === "language"}
            aria-label={t("nav.language")}
            title={t("nav.language")}
          >
            <Icon name="globe" />
            <span className="topbar__lang-code">{activeLanguage?.code.toUpperCase()}</span>
          </button>
          {menu === "language" ? (
            <div className="menu" role="menu" aria-label={t("nav.language")}>
              <p className="menu__label">{t("nav.language")}</p>
              {languages.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={item.code === language}
                  className={`menu__item ${item.code === language ? "menu__item--active" : ""}`}
                  onClick={() => {
                    setLanguage(item.code);
                    setMenu(null);
                  }}
                >
                  <span>{item.nativeLabel}</span>
                  <span className="menu__meta">{item.code.toUpperCase()}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="topbar__menu-wrap">
          <button
            type="button"
            className="topbar__user"
            onClick={() => setMenu((currentMenu) => (currentMenu === "user" ? null : "user"))}
            aria-haspopup="menu"
            aria-expanded={menu === "user"}
            aria-label={displayName}
          >
            <span className="avatar avatar--sm">{initials}</span>
            <span className="topbar__user-name">{displayName}</span>
            <Icon name="chevronDown" size={14} />
          </button>
          {menu === "user" ? (
            <div className="menu menu--wide" role="menu" aria-label={t("nav.signedInAs")}>
              <div className="menu__header">
                <span className="avatar">{initials}</span>
                <div>
                  <p className="menu__name">{displayName}</p>
                  <p className="menu__email">{user?.email ?? "demo@kura-crm.com"}</p>
                </div>
              </div>
              <div className="menu__divider" />
              <Link to="/app/settings" className="menu__item" role="menuitem">
                <Icon name="settings" size={15} />
                <span>{t("nav.settings")}</span>
              </Link>
              <button
                type="button"
                className="menu__item menu__item--danger"
                role="menuitem"
                onClick={() => {
                  setMenu(null);
                  void logout();
                }}
              >
                <Icon name="logout" size={15} />
                <span>{t("nav.signOut")}</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
