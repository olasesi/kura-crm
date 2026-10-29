import { clsx } from "clsx";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leading?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leading, className, containerClassName, id, required, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className={clsx("field", containerClassName)}>
      {label ? (
        <label htmlFor={inputId} className="field__label">
          {label}
          {required ? (
            <span className="field__required" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      <div className={clsx(leading && "input-group")}>
        {leading ? <span className="field__leading">{leading}</span> : null}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={clsx("input", error && "input--invalid", className)}
          {...rest}
        />
      </div>
      {hint && !error ? (
        <p id={`${inputId}-hint`} className="field__hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="field__error">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
