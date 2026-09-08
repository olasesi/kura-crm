# Deployment

## Local development

```bash
npm install
npm run dev          # Vite on :5173, proxies /api /graphql /health → localhost:5000
```

## Docker

The multi-stage `Dockerfile` builds with Node 20 and serves with unprivileged nginx on port **8080**.

```bash
docker build -t kura-crm-web --build-arg VITE_API_BASE_URL="" --build-arg VITE_SENTRY_DSN="https://...@sentry.io/..." .
docker run --rm -p 8080:8080 kura-crm-web
```

Build args: `VITE_API_BASE_URL`, `VITE_GRAPHQL_URL`, `VITE_SENTRY_DSN`, `VITE_LOG_LEVEL`.

The container expects the API reachable at the hostname `kura-crm-api` on port 5000 for proxying (`nginx.conf`). Override per-environment if needed.

## nginx notes

- SPA fallback: unknown paths serve `index.html`.
- `/assets/*` are immutable and cached for one year; the entry HTML is `no-cache`.
- Security headers (CSP, HSTS, X-Frame-Options, etc.) are applied globally.
- Health endpoint `/healthz` (k8s probes) does not proxy to the API.

## Kubernetes

Manifests live in `k8s/` and target the `kura-crm` namespace (created by `api/k8s/01-namespace.yaml`).

```bash
kubectl apply -k k8s              # or: kubectl apply -f k8s/0N-*.yaml
```

Rollout after a new image:

```bash
kubectl set image deployment/kura-crm-web -n kura-crm web=<registry>/kura-crm-web:<tag>
kubectl rollout status deployment/kura-crm-web -n kura-crm
```

Components: Deployment (2 replicas, rolling update), Service (ClusterIP :80), HPA (2–10 on CPU), Ingress (`app.kura-crm.com`, TLS via cert-manager), NetworkPolicy, PodDisruptionBudget.

The nginx container expects DNS resolution of `kura-crm-api` — if the API is deployed elsewhere, set `proxy_pass` accordingly.

## CI/CD

- **GitHub Actions** (`.github/workflows/ci.yml`): `quality` (lint, typecheck, format, build, unit tests + coverage) → `e2e` (Playwright on Chromium) → `release` (Docker build + push to GHCR on `main`).
- **Jenkins** (`Jenkinsfile`): install → typecheck → lint/format → unit tests (+ coverage HTML) → e2e (+ Playwright report) → Docker build/push → `kubectl apply -k k8s` + rolling restart on `main`.

Both pipelines run `npm ci` (deterministic installs). Add secrets in the CI provider: registry credentials, `SENTRY_ORG`, `SENTRY_PROJECT`, `VITE_SENTRY_AUTH_TOKEN`.

## Monitoring & alerts

- Client errors/traces/replays: Sentry project (DSN via `VITE_SENTRY_DSN`).
- Web Vitals counters: Sentry metrics (`web_vitals_<metric>_<rating>`).
- Infrastructure alerts: standard k8s liveness/readiness (`/healthz`) plus HPA-driven scale events.
