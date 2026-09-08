const read = (key: string, fallback: string): string => {
  const value = import.meta.env[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
};

export const env = {
  appName: read("VITE_APP_NAME", "Kura CRM"),
  appVersion: read("VITE_APP_VERSION", "3.0.0"),
  apiBaseUrl: read("VITE_API_BASE_URL", "/"),
  graphqlUrl: read("VITE_GRAPHQL_URL", "/graphql"),
  sentryDsn: read("VITE_SENTRY_DSN", ""),
  logLevel: read("VITE_LOG_LEVEL", "debug"),
  isProduction: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
  isTest: import.meta.env.MODE === "test",
} as const;
