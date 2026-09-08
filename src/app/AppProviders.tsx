import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { BrowserRouter } from "react-router-dom";

import { env } from "@/config/env";
import { logger } from "@/lib/logger";

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
  <main
    role="alert"
    className="grid min-h-screen place-items-center bg-slate-950 p-8 text-center text-white"
  >
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="break-words text-sm text-slate-400">{error.message}</p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="inline-flex h-11 items-center rounded-lg bg-sky-500 px-6 font-semibold text-white transition-colors hover:bg-sky-400"
      >
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
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
        {children}
      </ErrorBoundary>
    </BrowserRouter>
  </QueryClientProvider>
);
