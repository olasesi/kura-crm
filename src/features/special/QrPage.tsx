import { toDataURL, toString } from "qrcode";
import { useEffect, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/i18n/I18nProvider";
import type { ModuleDef } from "@/modules/types";

import { PageHeader } from "./ui";

interface QrPageProps {
  module: ModuleDef;
}

const origin = (): string =>
  typeof window === "undefined" ? "https://kura-crm.example.com" : window.location.origin;

const downloadSvg = (svg: string, filename: string) => {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const QrPage = ({ module }: QrPageProps) => {
  const { t } = useI18n();
  const isFeedback = module.id === "feedback-qr";
  const [payload, setPayload] = useState(
    isFeedback ? `${origin()}/feedback` : "https://kura-crm.example.com/showroom",
  );
  const [size, setSize] = useState(320);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);
    toDataURL(payload || " ", { width: size, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => {
        if (active) {
          setPreview(url);
        }
      })
      .catch(() => {
        if (active) {
          setError(t("common.error"));
        }
      });
    return () => {
      active = false;
    };
  }, [payload, size, t]);

  const handleDownload = async () => {
    try {
      const svg = await toString(payload || " ", {
        type: "svg",
        width: size,
        margin: 1,
      });
      downloadSvg(svg, `${module.id}.svg`);
    } catch {
      setError(t("common.error"));
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      setError(t("common.error"));
    }
  };

  return (
    <main className="page page--wide">
      <PageHeader
        eyebrow={t("nav.overview")}
        title={t(`modules.${module.id}`, module.name)}
        description={isFeedback ? t("special.feedbackText") : t("special.qrText")}
        actions={
          <button type="button" className="btn btn--sm" onClick={() => void handleDownload()}>
            <span className="btn__icon">
              <Icon name="download" />
            </span>
            {t("special.qrDownload")}
          </button>
        }
      />

      <div className="qr-layout">
        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">{t("special.qrPayload")}</h2>
              <p className="card__subtitle">{t("special.qrText")}</p>
            </div>
          </div>
          <div className="card__body">
            <div className="field">
              <label className="field__label" htmlFor="qr-payload">
                {t("special.qrPayload")}
              </label>
              <textarea
                id="qr-payload"
                className="textarea"
                rows={4}
                value={payload}
                onChange={(event) => setPayload(event.target.value)}
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="qr-size">
                {t("special.qrSize")}
              </label>
              <input
                id="qr-size"
                type="range"
                min={160}
                max={640}
                step={40}
                value={size}
                onChange={(event) => setSize(Number(event.target.value))}
              />
              <span className="field__hint">
                {size} × {size} px
              </span>
            </div>

            {error ? (
              <p className="alert alert--danger" role="alert">
                {error}
              </p>
            ) : null}

            <div className="u-inline" style={{ gap: "var(--space-2)" }}>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => void handleCopy()}
              >
                <span className="btn__icon">
                  <Icon name="link" />
                </span>
                {t("special.copyLink")}
              </button>
              {isFeedback ? (
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => window.print()}
                >
                  <span className="btn__icon">
                    <Icon name="document" />
                  </span>
                  {t("special.letterPrint")}
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="card qr-preview-card">
          <div className="card__header">
            <div>
              <h2 className="card__title">
                {isFeedback ? t("special.feedbackTitle") : t("special.qrTitle")}
              </h2>
              <p className="card__subtitle">{t("special.generatedFor")} Kura CRM</p>
            </div>
          </div>
          <div className="card__body qr-preview">
            {preview ? (
              <img src={preview} alt={t("special.qrTitle")} className="qr-preview__image" />
            ) : (
              <p className="u-text-muted">{t("common.loading")}</p>
            )}
            <p className="qr-preview__payload">{payload}</p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default QrPage;
