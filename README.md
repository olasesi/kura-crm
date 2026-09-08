# Kura CRM Web

Enterprise-grade React frontend for Kura CRM. TypeScript, Vite, Tailwind CSS, with testing, observability, security, and CI/CD baked in. The backend lives in [`api/`](./api).

## Quick start

```bash
npm install
npm run dev            # http://localhost:5173 (proxies /api, /graphql, /health to :5000)
```

Requires Node.js 20+ (see `.nvmrc`). The API runs on port 5000 — see `api/.env`.

## Scripts

| Script                            | Purpose                                      |
| --------------------------------- | -------------------------------------------- |
| `npm run dev`                     | Start the Vite dev server (port 5173)        |
| `npm run build`                   | Type-check + production build to `dist/`     |
| `npm run preview`                 | Preview the production build                 |
| `npm run typecheck`               | TypeScript checks                            |
| `npm run lint` / `lint:fix`       | ESLint (flat config) + auto-fix              |
| `npm run format` / `format:check` | Prettier write / check                       |
| `npm run test`                    | Vitest unit tests                            |
| `npm run test:coverage`           | Unit tests with coverage report + thresholds |
| `npm run test:e2e`                | Playwright end-to-end tests                  |
| `npm run test:e2e:install`        | Install Playwright browsers                  |

## Stack

- **Framework**: React 19 + TypeScript, Vite 6
- **Routing**: React Router 7 with route-level lazy loading
- **Data**: TanStack Query (server state), Zustand (client state)
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS 4
- **Testing**: Vitest + React Testing Library + Playwright
- **Observability**: Sentry (errors, tracing, replay), web-vitals
- **Deployment**: Docker + nginx, Kubernetes, GitHub Actions / Jenkins

## Project structure

```
├── e2e/                # Playwright end-to-end tests
├── k8s/                # Kubernetes manifests (deployment, service, HPA, ingress…)
├── src/
│   ├── app/            # Providers, routing
│   ├── components/     # UI primitives, layout components
│   ├── config/         # Typed environment configuration
│   ├── features/       # Feature modules (auth, dashboard)
│   ├── lib/            # api client, logger, monitoring, security helpers
│   ├── store/          # Zustand stores
│   ├── styles/         # Global styles / Tailwind entry
│   ├── test/           # Test setup + render helpers
│   └── types/          # Shared type definitions
├── docs/               # Architecture & deployment documentation
├── Dockerfile          # Multi-stage build (node → nginx)
└── nginx.conf          # Production web server + reverse proxy
```

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) — scaling, security, observability, code conventions
- [Deployment](./docs/DEPLOYMENT.md) — Docker, Kubernetes, CI/CD pipelines
