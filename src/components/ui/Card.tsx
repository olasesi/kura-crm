import { clsx } from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: ReactNode;
}

export const Card = ({ title, children, className, ...rest }: CardProps) => (
  <section
    className={clsx("rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg", className)}
    {...rest}
  >
    {title ? <h2 className="mb-4 text-lg font-semibold text-slate-100">{title}</h2> : null}
    {children}
  </section>
);
