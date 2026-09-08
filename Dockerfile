# ─── Build stage ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY index.html vite.config.ts ./
COPY public ./public
COPY src ./src

ARG VITE_API_BASE_URL=""
ARG VITE_GRAPHQL_URL="/graphql"
ARG VITE_SENTRY_DSN=""
ARG VITE_LOG_LEVEL="info"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_LOG_LEVEL=$VITE_LOG_LEVEL

RUN npm run build

# ─── Production stage ─────────────────────────────────────
FROM nginx:1.27-alpine AS production

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    mkdir -p /tmp/nginx /var/cache/nginx /var/log/nginx && \
    chown -R nginx:nginx /tmp/nginx /var/cache/nginx /var/log/nginx

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]