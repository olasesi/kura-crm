import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: "bg-sky-500 text-white hover:bg-sky-400 focus-visible:ring-sky-300",
  secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300 focus-visible:ring-slate-300",
  danger: "bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-300",
  ghost: "bg-transparent text-slate-100 hover:bg-slate-800 focus-visible:ring-slate-400",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50";

export const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) => (
  <button
    type="button"
    className={clsx(base, variants[variant], sizes[size], className)}
    disabled={disabled || loading}
    aria-busy={loading}
    {...rest}
  >
    {loading ? <Spinner size="sm" /> : children}
  </button>
);
