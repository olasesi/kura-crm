import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useI18n } from "@/i18n/I18nProvider";
import { getApiErrorMessage } from "@/lib/api";
import { normalizeEmail } from "@/lib/security";
import { useAuthStore } from "@/store/authStore";

import { type LoginFormValues, loginSchema } from "./loginSchema";

const HIGHLIGHTS = [
  { icon: "dashboard" as const, text: "Role-aware dashboards with draggable widgets" },
  { icon: "bank" as const, text: "Live finance, sales and people reporting" },
  { icon: "shield" as const, text: "Granular access control across 98 modules" },
];

export const LoginPage = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const { t } = useI18n();
  const login = useAuthStore((state) => state.login);
  const loginDemo = useAuthStore((state) => state.loginDemo);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setServerError(null);
    try {
      await login(normalizeEmail(values.email), values.password);
      navigate("/app/dashboard", { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  };

  const handleDemo = () => {
    loginDemo();
    navigate("/app/dashboard", { replace: true });
  };

  return (
    <main className="auth">
      <section className="auth__aside">
        <Link to="/" className="auth__brand">
          <span className="auth__brand-mark">K</span>
          <span>{t("app.name")}</span>
        </Link>
        <div className="auth__pitch">
          <p className="auth__eyebrow">{t("app.tagline")}</p>
          <h1 className="auth__title">Sign in to your workspace.</h1>
          <p className="auth__text">
            Sales, finance, people and operations in one operating system — with the reporting and
            access control a commercial team expects.
          </p>
          <ul className="auth__highlights">
            {HIGHLIGHTS.map((highlight) => (
              <li key={highlight.text}>
                <span className="auth__highlight-icon">
                  <Icon name={highlight.icon} size={16} />
                </span>
                {highlight.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="auth__footnote">React · TypeScript · Vite · Vitest</p>
      </section>

      <section className="auth__panel">
        <div className="auth__card">
          <header className="auth__card-head">
            <h2 className="auth__card-title">Sign in to Kura CRM</h2>
            <p className="auth__card-text">Use your workspace credentials or explore the demo.</p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="auth__form">
            {serverError ? (
              <p role="alert" className="alert alert--danger">
                <span className="alert__icon">
                  <Icon name="shield" size={16} />
                </span>
                {serverError}
              </p>
            ) : null}

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register("password")}
            />

            <Button type="submit" block loading={isSubmitting}>
              Sign in
            </Button>
          </form>

          <div className="auth__divider">
            <span>or</span>
          </div>

          <button type="button" className="btn btn--secondary btn--block" onClick={handleDemo}>
            <span className="btn__icon">
              <Icon name="spark" />
            </span>
            Explore the demo workspace
          </button>

          <p className="auth__hint">
            Demo mode uses generated data stored in this browser. No backend is required.
          </p>

          <Link to="/" className="auth__back">
            <Icon name="arrowRight" size={13} style={{ transform: "rotate(180deg)" }} />
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
