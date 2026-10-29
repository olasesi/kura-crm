import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/ui/Icon";
import { useI18n } from "@/i18n/I18nProvider";

interface SortableWidgetProps {
  id: string;
  title: string;
  icon: IconName;
  span: number;
  customizing: boolean;
  onHide: () => void;
  children: ReactNode;
}

export const SortableWidget = ({
  id,
  title,
  icon,
  span,
  customizing,
  onHide,
  children,
}: SortableWidgetProps) => {
  const { t } = useI18n();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <article
      ref={setNodeRef}
      className={`widget ${isDragging ? "widget--dragging" : ""}`}
      style={{
        gridColumn: `span ${Math.min(12, Math.max(1, span))}`,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <header className="widget__header">
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="widget__grip"
          aria-label={`${t("dashboard.dragHint")}: ${title}`}
          {...attributes}
          {...listeners}
        >
          <Icon name="grip" />
        </button>
        <div>
          <h2 className="widget__title">{title}</h2>
        </div>
        <div className="widget__header-actions">
          {customizing ? (
            <button
              type="button"
              className="widget__action"
              style={{ opacity: 1 }}
              aria-label={`${t("common.close")}: ${title}`}
              onClick={onHide}
            >
              <Icon name="close" />
            </button>
          ) : (
            <span className="widget__action" aria-hidden="true" title={title}>
              <Icon name={icon} />
            </span>
          )}
        </div>
      </header>
      <div className="widget__body">{children}</div>
    </article>
  );
};

export default SortableWidget;
