import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import viteCompression from "vite-plugin-compression";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const viteEnv = loadEnv(mode, process.cwd(), "");

  const plugins = [
    react(),
    tailwindcss(),
    viteCompression({ algorithm: "gzip", ext: ".gz", threshold: 10_240 }),
    viteCompression({ algorithm: "brotliCompress", ext: ".br", threshold: 10_240 }),
  ];

  // Only upload source maps to Sentry when credentials are present (CI / production).
  if (viteEnv.VITE_SENTRY_AUTH_TOKEN && viteEnv.SENTRY_ORG && viteEnv.SENTRY_PROJECT) {
    plugins.push(
      sentryVitePlugin({
        org: viteEnv.SENTRY_ORG,
        project: viteEnv.SENTRY_PROJECT,
        authToken: viteEnv.VITE_SENTRY_AUTH_TOKEN,
        telemetry: false,
        sourcemaps: { filesToDeleteAfterUpload: ".map" },
      }),
    );
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        // Dev-time proxying so the browser only ever talks to the same origin.
        "/api": { target: "http://localhost:5000", changeOrigin: true },
        "/graphql": { target: "http://localhost:5000", changeOrigin: true, ws: true },
        "/health": { target: "http://localhost:5000", changeOrigin: true },
      },
    },
    preview: {
      port: 4173,
      strictPort: true,
    },
    build: {
      target: "es2020",
      sourcemap: true,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            data: ["@tanstack/react-query"],
            forms: ["react-hook-form", "zod", "@hookform/resolvers"],
            utils: ["axios", "zustand", "clsx"],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      setupFiles: ["./src/test/setup.ts"],
      css: false,
      clearMocks: true,
      restoreMocks: true,
      coverage: {
        provider: "v8",
        reporter: ["text", "html", "json-summary", "lcov"],
        include: ["src/**/*.{ts,tsx}"],
        exclude: [
          "src/main.tsx",
          "src/App.tsx",
          "src/app/**",
          "src/test/**",
          "src/types/**",
          "src/**/*.d.ts",
          "src/**/*.test.*",
          "src/**/*.spec.*",
          "src/**/index.ts",
          "src/config/**",
        ],
        thresholds: {
          lines: 55,
          functions: 55,
          branches: 45,
          statements: 55,
        },
      },
    },
  };
});
