import { Button } from "./Button";
import { useI18n } from "@/i18n/I18nProvider";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const { t } = useI18n();
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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <header className="modal__header">
          <h2 id="confirm-title" className="modal__title">
            {title}
          </h2>
        </header>
        <div className="modal__body">
          <p className="u-text-muted">{message}</p>
        </div>
        <footer className="modal__footer">
          <Button variant="secondary" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel ?? t("common.delete")}
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmDialog;
