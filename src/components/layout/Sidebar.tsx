import { useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/i18n/I18nProvider";
import { getVisibleModules, groupModules, normalizeRole } from "@/modules/registry";
import { useAuthStore } from "@/store/authStore";

interface SidebarProps {
  collapsed: boolean;
  onNavigate: () => void;
}

export const Sidebar = ({ collapsed, onNavigate }: SidebarProps) => {
  const { t } = useI18n();
  const user = useAuthStore((state) => state.user);
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const visible = getVisibleModules(user?.role);
    const term = query.trim().toLowerCase();
    const filtered = term
      ? visible.filter(
          (module) =>
            t(`modules.${module.id}`, module.name).toLowerCase().includes(term) ||
            module.name.toLowerCase().includes(term),
        )
      : visible;
    return groupModules(filtered);
  }, [query, t, user?.role]);

  return (
    <aside
      className="app__sidebar"
      aria-label={t("nav.dashboard")}
      data-collapsed={collapsed ? "true" : "false"}
    >
      <Link to="/app/dashboard" className="sidebar__brand" onClick={onNavigate}>
        <span className="sidebar__logo">K</span>
        <span className="sidebar__brand-text">
          <span className="sidebar__brand-name">{t("app.name")}</span>
          <span className="sidebar__brand-meta">{t("nav.demo")}</span>
        </span>
      </Link>

      <div className="sidebar__scroll">
        <div className="sidebar__search">
          <input
            type="search"
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("nav.searchPlaceholder")}
            aria-label={t("nav.searchPlaceholder")}
          />
        </div>

        <nav aria-label={t("nav.dashboard")}>
          <div className="sidebar__group">
            <NavLink
              to="/app/dashboard"
              className={({ isActive }) =>
                `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
              }
              onClick={onNavigate}
              title={t("nav.dashboard")}
            >
              <span className="sidebar__icon">
                <Icon name="dashboard" />
              </span>
              <span className="sidebar__label">{t("nav.dashboard")}</span>
            </NavLink>
          </div>

          {groups.map((group) => (
            <div key={group.id} className="sidebar__group">
              <p className="sidebar__group-label">{t(group.labelKey, group.id)}</p>
              {group.modules.map((module) => (
                <NavLink
                  key={module.id}
                  to={`/app/${module.id}`}
                  className={({ isActive }) =>
                    `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
                  }
                  onClick={onNavigate}
                  title={t(`modules.${module.id}`, module.name)}
                >
                  <span className="sidebar__icon">
                    <Icon name={module.icon} />
                  </span>
                  <span className="sidebar__label">{t(`modules.${module.id}`, module.name)}</span>
                </NavLink>
              ))}
            </div>
          ))}

          {groups.length === 0 ? (
            <p className="sidebar__group-label">{t("nav.noResults")}</p>
          ) : null}
        </nav>
      </div>

      <div className="sidebar__footer">
        <Link to="/app/settings" className="sidebar__user" onClick={onNavigate}>
          <span className="avatar avatar--sm">
            {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : "KU"}
          </span>
          <span className="sidebar__user-info">
            <span className="sidebar__user-name">
              {user ? `${user.firstName} ${user.lastName}` : t("roles.user")}
            </span>
            <span className="sidebar__user-role">
              {t(`roles.${normalizeRole(user?.role)}`, user?.role ?? "user")}
            </span>
          </span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
