import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";

import type { FieldDef, ModuleDef, ModuleRecord, RecordValues } from "./types";

interface ModuleFormProps {
  module: ModuleDef;
  record?: ModuleRecord | null;
  onSubmit: (values: RecordValues) => void;
  onCancel: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const initialValue = (fieldDef: FieldDef, record?: ModuleRecord | null): string => {
  if (record && record[fieldDef.key] !== undefined) {
    return String(record[fieldDef.key]);
  }
  if (fieldDef.type === "select" && fieldDef.options?.length) {
    return fieldDef.options[0];
  }
  return "";
};

export const ModuleForm = ({ module, record, onSubmit, onCancel }: ModuleFormProps) => {
  const { t } = useI18n();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const entries = module.fields.map(
      (fieldDef) => [fieldDef.key, initialValue(fieldDef, record)] as const,
    );
    return Object.fromEntries(entries);
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const title = record ? t("module.editRecord") : t("module.newRecord");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const setValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    for (const fieldDef of module.fields) {
      const value = values[fieldDef.key]?.trim() ?? "";
      if (fieldDef.required && !value) {
        nextErrors[fieldDef.key] = t("common.required");
        continue;
      }
      if (value && fieldDef.type === "email" && !EMAIL_PATTERN.test(value)) {
        nextErrors[fieldDef.key] = t("common.invalidEmail");
      }
      if (value && (fieldDef.type === "number" || fieldDef.type === "currency")) {
        const numeric = Number(value);
        if (Number.isNaN(numeric)) {
          nextErrors[fieldDef.key] = t("common.required");
        }
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload: RecordValues = {};
    for (const fieldDef of module.fields) {
      const raw = values[fieldDef.key] ?? "";
      if (fieldDef.type === "number" || fieldDef.type === "currency") {
        payload[fieldDef.key] = raw === "" ? 0 : Number(raw);
      } else {
        payload[fieldDef.key] = raw;
      }
    }
    onSubmit(payload);
  };

  const fields = useMemo(() => module.fields, [module.fields]);

  return (
    <div className="modal">
      <button
        type="button"
        className="modal__overlay"
        aria-label={t("common.close")}
        onClick={onCancel}
      />
      <div
        className="modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="module-form-title"
      >
        <header className="modal__header">
          <div>
            <h2 id="module-form-title" className="modal__title">
              {title}
            </h2>
            <p className="card__subtitle">{module.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel} aria-label={t("common.close")}>
            ✕
          </Button>
        </header>
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal__body">
            {Object.keys(errors).length > 0 ? (
              <p role="alert" className="alert alert--danger module__form-error">
                {t("module.fieldRequired")}
              </p>
            ) : null}

            <div className="form-grid">
              {fields.map((fieldDef) => {
                const id = `field-${module.id}-${fieldDef.key}`;
                const label = t(`fields.${fieldDef.key}`, fieldDef.label);
                const error = errors[fieldDef.key];
                const isFull = fieldDef.type === "textarea";
                return (
                  <div key={fieldDef.key} className={isFull ? "field form-grid__full" : "field"}>
                    <label htmlFor={id} className="field__label">
                      {label}
                      {fieldDef.required ? (
                        <span className="field__required" aria-hidden="true">
                          *
                        </span>
                      ) : null}
                    </label>
                    {fieldDef.type === "select" ? (
                      <select
                        id={id}
                        className={error ? "select select--invalid" : "select"}
                        value={values[fieldDef.key] ?? ""}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? `${id}-error` : undefined}
                        onChange={(event) => setValue(fieldDef.key, event.target.value)}
                      >
                        {fieldDef.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : fieldDef.type === "textarea" ? (
                      <textarea
                        id={id}
                        className={error ? "textarea textarea--invalid" : "textarea"}
                        value={values[fieldDef.key] ?? ""}
                        placeholder={fieldDef.placeholder}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? `${id}-error` : undefined}
                        onChange={(event) => setValue(fieldDef.key, event.target.value)}
                      />
                    ) : (
                      <input
                        id={id}
                        type={
                          fieldDef.type === "currency"
                            ? "number"
                            : fieldDef.type === "tel"
                              ? "tel"
                              : fieldDef.type
                        }
                        inputMode={
                          fieldDef.type === "currency" || fieldDef.type === "number"
                            ? "decimal"
                            : undefined
                        }
                        min={fieldDef.min}
                        max={fieldDef.max}
                        step={fieldDef.type === "currency" ? "0.01" : undefined}
                        className={error ? "input input--invalid" : "input"}
                        value={values[fieldDef.key] ?? ""}
                        placeholder={fieldDef.placeholder}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? `${id}-error` : undefined}
                        onChange={(event) => setValue(fieldDef.key, event.target.value)}
                      />
                    )}
                    {error ? (
                      <p id={`${id}-error`} role="alert" className="field__error">
                        {error}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
          <footer className="modal__footer">
            <Button variant="secondary" onClick={onCancel}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">{record ? t("common.save") : t("common.add")}</Button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default ModuleForm;
