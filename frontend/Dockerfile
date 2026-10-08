# syntax=docker/dockerfile:1.7
# Build context: repository root (pnpm workspace).  docker build -f frontend/Dockerfile .
FROM node:20-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc tsconfig.base.json ./
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --filter frontend...
COPY frontend frontend
ARG VITE_API_URL=/api/v1
ARG VITE_SITE_URL
ARG SSG_API_URL
ENV VITE_API_URL=$VITE_API_URL VITE_SITE_URL=$VITE_SITE_URL SSG_API_URL=$SSG_API_URL
RUN pnpm --filter frontend build

FROM nginx:1.27-alpine AS runtime
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/frontend/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://localhost/ >/dev/null || exit 1
