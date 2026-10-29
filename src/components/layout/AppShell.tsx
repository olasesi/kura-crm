import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { CommandPalette } from "./CommandPalette";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const COLLAPSE_KEY = "kura-crm.sidebar.collapsed";

const readCollapsed = (): boolean => {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
};

export const AppShell = () => {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // Storage may be unavailable; the in-memory state still works.
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((current) => !current);
        return;
      }
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const classes = ["app", collapsed ? "app--collapsed" : "", mobileOpen ? "app--mobile-open" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <Sidebar collapsed={collapsed} onNavigate={closeMobile} />

      {mobileOpen ? (
        <button
          type="button"
          className="app__scrim"
          aria-label="Close navigation"
          onClick={closeMobile}
        />
      ) : null}

      <div className="app__main">
        <Topbar
          collapsed={collapsed}
          onToggleSidebar={() => {
            if (window.matchMedia?.("(max-width: 1024px)").matches) {
              setMobileOpen((current) => !current);
            } else {
              setCollapsed((current) => !current);
            }
          }}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <div className="app__content">
          <Outlet />
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};

export default AppShell;
