import { clsx } from "clsx";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Spinner = ({ size = "md", className }: SpinnerProps) => (
  <span
    role="status"
    aria-label="Loading"
    data-testid="spinner"
    className={clsx("spinner", `spinner--${size}`, className)}
  />
);

export default Spinner;
