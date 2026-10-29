import { Link, useParams } from "react-router-dom";

import { Icon } from "@/components/ui/Icon";
import { SpecialPage } from "@/features/special/SpecialPage";
import { useI18n } from "@/i18n/I18nProvider";
import { canAccessModule, getModuleById } from "@/modules/registry";
import { ModulePage } from "@/modules/ModulePage";
import { useAuthStore } from "@/store/authStore";

export const ModuleRoute = () => {
  const { moduleId } = useParams();
  const { t } = useI18n();
  const role = useAuthStore((state) => state.user?.role);
  const module = getModuleById(moduleId);

  if (!module) {
    return (
      <main className="page page--wide">
        <div className="empty">
          <div className="empty__icon">
            <Icon name="search" />
          </div>
          <p className="empty__title">{t("module.emptyTitle")}</p>
          <p className="empty__text">The module “{moduleId}” does not exist or has been moved.</p>
          <Link to="/app/dashboard" className="btn btn--secondary btn--sm">
            <span className="btn__icon">
              <Icon name="home" />
            </span>
            {t("special.backToDashboard")}
          </Link>
        </div>
      </main>
    );
  }

  if (!canAccessModule(module, role)) {
    return (
      <main className="page page--wide">
        <div className="empty">
          <div className="empty__icon">
            <Icon name="lock" />
          </div>
          <p className="empty__title">Access restricted</p>
          <p className="empty__text">
            Your role does not include access to {t(`modules.${module.id}`, module.name)}. Ask a
            workspace administrator if you need it.
          </p>
          <Link to="/app/dashboard" className="btn btn--secondary btn--sm">
            <span className="btn__icon">
              <Icon name="home" />
            </span>
            {t("special.backToDashboard")}
          </Link>
        </div>
      </main>
    );
  }

  if (module.kind === "crud") {
    return <ModulePage module={module} />;
  }

  return <SpecialPage module={module} />;
};

export default ModuleRoute;
