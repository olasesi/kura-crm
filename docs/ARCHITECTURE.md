# Architecture

## Overview

Kura CRM Web is a single-page application served by nginx. At build time, Vite compiles the React tree into static, cacheable assets; at run time, the SPA talks to the `kura-crm-api` service (REST under `/api`, GraphQL under `/graphql`) over same-origin paths so cookies and CORS stay simple.

```
Browser ──► nginx (CDN cacheable static assets + reverse proxy)
              ├── /assets/*   → static files (immutable, 1 year)
              ├── /*          → index.html (SPA fallback)
              ├── /api/*      → kura-crm-api:5000
              ├── /graphql    → kura-crm-api:5000
              └── /health     → kura-crm-api:5000
```

## Scaling

- **Route-level code splitting** — every page is `React.lazy()`-loaded and Vite emits vendor chunks (`react`, `data`, `forms`, `utils`), so only the code the user needs is downloaded.
- **Static assets** are fingerprinted and served with immutable caching; nginx `gzip_static` serves precompressed `.gz`/`.br` variants.
- **Kubernetes** — HPA scales 2–10 replicas on CPU, requests/limits are explicitly bounded, and a PDB guarantees availability during node drains (see `k8s/`).

## Security

- **Supply chain**: pinned `package-lock.json` + `npm ci` in CI.
- **Dependencies**: ESLint runs `eslint-plugin-security` and `jsx-a11y`; helpers in `src/lib/security.ts` (HTML escaping, URL scheme validation, token masking) prevent XSS class bugs.
- **Runtime**:
  - HTTP `Authorization` bearer tokens are attached in the axios request interceptor; a single-flight refresh queue rotates tokens on 401 without racing requests.
  - Tokens are persisted to `localStorage` (via Zustand) — acceptable for this stack; swapping to `httpOnly` cookies + `withCredentials` is documented in the auth interceptor.
- **Transport** (see `nginx.conf` / `Dockerfile`):
  - Strict CSP, `X-Frame-Options: DENY`, nosniff, Referrer-Policy, Permissions-Policy, COOP, and HSTS headers.
  - Served over TLS behind the ingress; `frame-ancestors 'none'`.
- **Container**: unprivileged `nginx` user, read-only root filesystem, all capabilities dropped, seccomp `RuntimeDefault` (see `k8s/01-deployment.yaml`).

## Observability

- **Sentry** (`src/lib/monitoring.ts`) — errors, performance tracing, and session replay. Enabled automatically when `VITE_SENTRY_DSN` is set. Source maps are uploaded at build time when `SENTRY_ORG` / `SENTRY_PROJECT` / `VITE_SENTRY_AUTH_TOKEN` are present (CI only).
- **Web Vitals** (CLS, INP, LCP, TTFB) are logged and increment Sentry counters.
- **Structured logger** (`src/lib/logger.ts`) respects the `VITE_LOG_LEVEL`; route handlers and API errors log with context.
- **Backend health** is surfaced on the dashboard via `/health`.

## Testing strategy

- **Unit** (Vitest + React Testing Library): components, forms, security helpers. Coverage thresholds enforced in CI.
- **Integration**: `renderWithProviders` wires QueryClient + Router for component tests.
- **E2E** (Playwright): cross-browser smoke tests (Chromium, Firefox, WebKit) against the dev server; retries and tracing enabled in CI.

## Environment variables

All browser-exposed variables are prefixed `VITE_` (see `.env.example`). Values are validated and typed in `src/config/env.ts` — never read `import.meta.env` directly elsewhere.
