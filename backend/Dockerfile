# syntax=docker/dockerfile:1.7
# Build context: repository root (pnpm workspace).  docker build -f backend/Dockerfile .
FROM node:20-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc tsconfig.base.json ./
COPY backend/package.json backend/
RUN pnpm install --frozen-lockfile --filter backend...
COPY backend backend
RUN pnpm --filter backend build \
 && pnpm --filter backend deploy --prod --legacy /out

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /out/package.json ./
COPY --from=build /repo/backend/dist ./dist
USER node
EXPOSE 4000
HEALTHCHECK CMD wget -qO- http://localhost:4000/api/v1/health >/dev/null || exit 1
CMD ["node", "dist/server.js"]
