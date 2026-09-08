import { clsx } from "clsx";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-4",
} as const;

export const Spinner = ({ size = "md", className }: SpinnerProps) => (
  <span
    role="status"
    aria-label="Loading"
    data-testid="spinner"
    className={clsx(
      "inline-block animate-spin rounded-full border-slate-300 border-t-slate-900",
      sizes[size],
      className,
    )}
  />
);
