import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "danger" | "danger-ghost" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
  iconOnly?: boolean;
  children: ReactNode;
}

export const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  block = false,
  iconOnly = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) => (
  <button
    type="button"
    className={clsx(
      "btn",
      `btn--${variant}`,
      size !== "md" && `btn--${size}`,
      block && "btn--block",
      iconOnly && "btn--icon",
      loading && "btn--loading",
      className,
    )}
    disabled={disabled || loading}
    aria-busy={loading}
    {...rest}
  >
    {loading ? <Spinner size="sm" /> : children}
  </button>
);

export default Button;
