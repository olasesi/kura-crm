import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuthStore } from "@/store/authStore";
import { DESIGNS, useTheme } from "@/theme/ThemeProvider";

import { getWidgetContent } from "./WidgetContent";
import { SortableWidget } from "./SortableWidget";
import { useDashboardLayout } from "./useDashboardLayout";
import { LAYOUT_VARIANTS, type LayoutVariant, getWidget, normalizeDashboardRole } from "./widgets";

export const DashboardPage = () => {
  const { t } = useI18n();
  const { design, setDesign } = useTheme();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [variant, setVariant] = useState<LayoutVariant>("role");
  const [customizing, setCustomizing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const role = normalizeDashboardRole(user?.role);
  const layout = useDashboardLayout(user?.id ?? "guest", role, variant);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      layout.move(String(active.id), String(over.id));
    }
  };

  const handleReset = () => {
    layout.reset();
    setToast(t("dashboard.resetDone"));
  };

  const firstName = user?.firstName ?? t("roles.user");
  const hiddenCount = layout.hiddenIds.length;

  const renderWidget = (id: string) => {
    const widget = getWidget(id);
    const Content = getWidgetContent(id);
    if (!widget || !Content) {
      return null;
    }
    return (
      <SortableWidget
        key={id}
        id={id}
        title={t(widget.titleKey, widget.id)}
        icon={widget.icon}
        span={widget.span}
        customizing={customizing}
        onHide={() => layout.hide(id)}
      >
        <Content />
      </SortableWidget>
    );
  };

  return (
    <main className="page page--wide">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">{t("nav.dashboard")}</p>
          <h1 className="page__title">
            {t("dashboard.greeting")}, {firstName}
          </h1>
          <p className="page__description">{t("dashboard.subtitle")}</p>
        </div>
        <div className="page__actions">
          <span className="badge badge--accent">{t(`roles.${role}`, role)}</span>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => setCustomizing((current) => !current)}
            aria-pressed={customizing}
          >
            <span className="btn__icon">
              <Icon name={customizing ? "check" : "settings"} />
            </span>
            {customizing ? t("dashboard.done") : t("dashboard.customize")}
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => void logout()}
          >
            <span className="btn__icon">
              <Icon name="logout" />
            </span>
            {t("nav.signOut")}
          </button>
        </div>
      </header>

      <section className="dashboard__toolbar" aria-label={t("dashboard.layout")}>
        <div className="dashboard__toolbar-group">
          <span className="dashboard__toolbar-label">{t("dashboard.layout")}</span>
          <div className="segmented" role="group" aria-label={t("dashboard.layout")}>
            {LAYOUT_VARIANTS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`segmented__item ${
                  variant === item.id ? "segmented__item--active" : ""
                }`}
                aria-pressed={variant === item.id}
                onClick={() => setVariant(item.id)}
              >
                {t(item.labelKey, item.id)}
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard__toolbar-divider" aria-hidden="true" />

        <div className="dashboard__toolbar-group">
          <span className="dashboard__toolbar-label">{t("dashboard.design")}</span>
          <select
            className="select select--sm"
            style={{ maxWidth: 160 }}
            aria-label={t("dashboard.design")}
            value={design}
            onChange={(event) => setDesign(event.target.value as typeof design)}
          >
            {DESIGNS.map((item) => (
              <option key={item.id} value={item.id}>
                {t(item.labelKey, item.id)}
              </option>
            ))}
          </select>
        </div>

        <span className="toolbar__spacer" />

        {hiddenCount > 0 ? (
          <span className="dashboard__hint">
            {hiddenCount} {t("dashboard.widgetsHidden")}
          </span>
        ) : null}

        <button type="button" className="btn btn--ghost btn--sm" onClick={handleReset}>
          <span className="btn__icon">
            <Icon name="repeat" />
          </span>
          {t("dashboard.reset")}
        </button>
      </section>

      {customizing ? (
        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">{t("dashboard.addWidget")}</h2>
              <p className="card__subtitle">{t("dashboard.dragHint")}</p>
            </div>
            {hiddenCount > 0 ? (
              <button type="button" className="btn btn--secondary btn--sm" onClick={layout.showAll}>
                {t("dashboard.reset")}
              </button>
            ) : null}
          </div>
          <div className="card__body">
            {layout.available.length === 0 && layout.hiddenIds.length === 0 ? (
              <p className="u-text-muted">{t("dashboard.noWidgets")}</p>
            ) : (
              <div className="widget-picker">
                {layout.hiddenIds.map((id) => {
                  const widget = getWidget(id);
                  return widget ? (
                    <button
                      key={id}
                      type="button"
                      className="widget-chip"
                      onClick={() => layout.show(id)}
                    >
                      <Icon name={widget.icon} /> {t(widget.titleKey, id)}
                      <Icon name="plus" />
                    </button>
                  ) : null;
                })}
                {layout.available.map((id) => {
                  const widget = getWidget(id);
                  return widget ? (
                    <button
                      key={id}
                      type="button"
                      className="widget-chip"
                      onClick={() => layout.show(id)}
                    >
                      <Icon name={widget.icon} /> {t(widget.titleKey, id)}
                      <Icon name="plus" />
                    </button>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {layout.visible.length === 0 ? (
        <section className="dashboard__empty-widgets">
          <p className="empty__title">{t("dashboard.noWidgets")}</p>
          <button type="button" className="btn btn--secondary btn--sm" onClick={layout.showAll}>
            {t("dashboard.reset")}
          </button>
        </section>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={layout.visible} strategy={rectSortingStrategy}>
            <section className="dashboard__grid" aria-label={t("dashboard.title")}>
              {layout.visible.map(renderWidget)}
            </section>
          </SortableContext>
        </DndContext>
      )}

      {toast ? (
        <div className="toast-stack">
          <div className="toast toast--success" role="status">
            <span className="alert__icon">✓</span>
            <span>{toast}</span>
            <button
              type="button"
              className="toast__close"
              aria-label={t("common.close")}
              onClick={() => setToast(null)}
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default DashboardPage;
