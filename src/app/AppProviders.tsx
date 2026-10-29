import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { BrowserRouter } from "react-router-dom";

import { env } from "@/config/env";
import { I18nProvider } from "@/i18n/I18nProvider";
import { logger } from "@/lib/logger";
import { ThemeProvider } from "@/theme/ThemeProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <main role="alert" className="app-error">
    <div className="app-error__panel">
      <h1 className="app-error__title">Something went wrong</h1>
      <p className="app-error__text">{error.message}</p>
      <button type="button" onClick={resetErrorBoundary} className="btn">
        Reload page
      </button>
    </div>
  </main>
);

const handleError = (error: Error): void => {
  logger.error("Unhandled application error.", error);
  if (env.sentryDsn) {
    Sentry.captureException(error);
  }
};

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => (
  <I18nProvider>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
            {children}
          </ErrorBoundary>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </I18nProvider>
);
