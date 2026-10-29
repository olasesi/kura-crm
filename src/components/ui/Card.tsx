import { clsx } from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  flush?: boolean;
  children: ReactNode;
}

export const Card = ({
  title,
  subtitle,
  actions,
  flush = false,
  children,
  className,
  ...rest
}: CardProps) => (
  <section className={clsx("card", flush && "card--flush", className)} {...rest}>
    {title || actions ? (
      <header className="card__header">
        <div>
          {title ? <h2 className="card__title">{title}</h2> : null}
          {subtitle ? <p className="card__subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="u-inline">{actions}</div> : null}
      </header>
    ) : null}
    <div className="card__body">{children}</div>
  </section>
);

export default Card;
