import { useMemo, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { useRecords } from "@/features/dashboard/data";
import { useI18n } from "@/i18n/I18nProvider";
import type { ModuleDef, ModuleRecord } from "@/modules/types";

import { PageHeader } from "./ui";

interface LetterPageProps {
  module: ModuleDef;
}

const fill = (value: string, fields: Record<string, string>): string =>
  Object.entries(fields).reduce(
    (text, [key, replacement]) => text.split(`{{${key}}}`).join(replacement),
    value,
  );

export const LetterGeneratorPage = ({ module }: LetterPageProps) => {
  const { t } = useI18n();
  const templates = useRecords("letter-templates");
  const employees = useRecords("employees");
  const [templateId, setTemplateId] = useState("");
  const [recipientId, setRecipientId] = useState("");

  const template = useMemo(
    () => templates.find((record) => record.id === templateId) ?? templates[0],
    [templateId, templates],
  );
  const recipient = useMemo(
    () => employees.find((record) => record.id === recipientId) ?? employees[0],
    [employees, recipientId],
  );

  const fields = useMemo<Record<string, string>>(
    () => ({
      name: String(recipient?.name ?? ""),
      email: String(recipient?.email ?? ""),
      department: String(recipient?.department ?? ""),
      designation: String(recipient?.designation ?? ""),
      company: "Kura CRM",
      date: new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date()),
    }),
    [recipient],
  );

  const body = fill(String(template?.body ?? ""), fields);
  const subject = fill(String(template?.name ?? t("special.letterTitle")), fields);

  if (!template || !recipient) {
    return (
      <main className="page page--wide">
        <PageHeader
          eyebrow={t("nav.documents")}
          title={t(`modules.${module.id}`, module.name)}
          description={t("special.letterText")}
        />
        <p className="empty__text">{t("module.emptyText")}</p>
      </main>
    );
  }

  return (
    <main className="page page--wide">
      <PageHeader
        eyebrow={t("nav.documents")}
        title={t(`modules.${module.id}`, module.name)}
        description={t("special.letterText")}
        actions={
          <button type="button" className="btn btn--sm" onClick={() => window.print()}>
            <span className="btn__icon">
              <Icon name="document" />
            </span>
            {t("special.letterPrint")}
          </button>
        }
      />

      <div className="letter-layout">
        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">{t("special.letterTemplate")}</h2>
              <p className="card__subtitle">{t("special.letterText")}</p>
            </div>
          </div>
          <div className="card__body">
            <div className="field">
              <label className="field__label" htmlFor="letter-template">
                {t("special.letterTemplate")}
              </label>
              <select
                id="letter-template"
                className="select"
                value={template.id}
                onChange={(event) => setTemplateId(event.target.value)}
              >
                {templates.map((record: ModuleRecord) => (
                  <option key={record.id} value={record.id}>
                    {String(record.name)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="letter-recipient">
                {t("special.letterRecipient")}
              </label>
              <select
                id="letter-recipient"
                className="select"
                value={recipient.id}
                onChange={(event) => setRecipientId(event.target.value)}
              >
                {employees.map((record: ModuleRecord) => (
                  <option key={record.id} value={record.id}>
                    {String(record.name)} · {String(record.department ?? "")}
                  </option>
                ))}
              </select>
            </div>

            <dl className="letter-meta">
              <div>
                <dt>{t("fields.department")}</dt>
                <dd>{String(recipient.department ?? "—")}</dd>
              </div>
              <div>
                <dt>{t("fields.designation")}</dt>
                <dd>{String(recipient.designation ?? "—")}</dd>
              </div>
              <div>
                <dt>{t("fields.email")}</dt>
                <dd>{String(recipient.email ?? "—")}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="card letter-preview-card">
          <div className="card__header">
            <div>
              <h2 className="card__title">{t("special.letterPreview")}</h2>
              <p className="card__subtitle">{t("special.generatedFor")} Kura CRM</p>
            </div>
          </div>
          <article className="letter-preview">
            <header className="letter-preview__head">
              <p className="letter-preview__brand">Kura CRM</p>
              <p className="letter-preview__date">{fields.date}</p>
            </header>
            <p className="letter-preview__to">
              {fields.name}
              <br />
              {fields.designation}
              <br />
              {fields.department}
            </p>
            <h3 className="letter-preview__subject">{subject}</h3>
            <p>Dear {fields.name},</p>
            <p className="letter-preview__body">{body}</p>
            <p className="letter-preview__sign">
              Kind regards,
              <br />
              People operations
              <br />
              Kura CRM
            </p>
          </article>
        </section>
      </div>
    </main>
  );
};

export default LetterGeneratorPage;
