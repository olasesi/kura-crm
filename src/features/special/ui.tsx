import { Link } from "react-router-dom";
import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/ui/Icon";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader = ({ eyebrow, title, description, actions }: PageHeaderProps) => (
  <header className="page__header">
    <div>
      <p className="page__eyebrow">{eyebrow}</p>
      <h1 className="page__title">{title}</h1>
      {description ? <p className="page__description">{description}</p> : null}
    </div>
    {actions ? <div className="page__actions">{actions}</div> : null}
  </header>
);

export interface SummaryItem {
  label: string;
  value: string;
  meta?: string;
}

export const SummaryGrid = ({ items }: { items: SummaryItem[] }) => (
  <section className="module__stats" aria-label="Summary">
    {items.map((item) => (
      <article key={item.label} className="module__stat">
        <p className="module__stat-label">{item.label}</p>
        <p className="module__stat-value">{item.value}</p>
        {item.meta ? <p className="module__stat-meta">{item.meta}</p> : null}
      </article>
    ))}
  </section>
);

export interface BarRow {
  label: string;
  value: number;
  meta?: string;
}

interface BarListProps {
  rows: BarRow[];
  format?: (value: number) => string;
}

export const BarList = ({ rows, format }: BarListProps) => {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <div className="report-bars">
      {rows.length === 0 ? (
        <p className="u-text-muted">No data for the selected period.</p>
      ) : (
        rows.map((row) => (
          <div key={row.label} className="report-bars__row">
            <span className="report-bars__label" title={row.label}>
              {row.label}
            </span>
            <span className="report-bars__track">
              <span
                className="report-bars__fill"
                style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }}
              />
            </span>
            <span className="report-bars__value">
              {format ? format(row.value) : row.value}
              {row.meta ? <span className="u-text-muted"> {row.meta}</span> : null}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

interface ToolCardProps {
  to: string;
  icon: IconName;
  title: string;
  text: string;
}

export const ToolCard = ({ to, icon, title, text }: ToolCardProps) => (
  <Link to={to} className="tool-card">
    <span className="tool-card__icon">
      <Icon name={icon} />
    </span>
    <span className="tool-card__title">{title}</span>
    <span className="tool-card__text">{text}</span>
    <span className="tool-card__link">
      Open <Icon name="arrowRight" size={13} />
    </span>
  </Link>
);

export const EmptyState = ({ title, text }: { title: string; text: string }) => (
  <div className="empty">
    <div className="empty__icon">
      <Icon name="search" />
    </div>
    <p className="empty__title">{title}</p>
    <p className="empty__text">{text}</p>
  </div>
);
