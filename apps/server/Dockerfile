# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /workspace

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY apps/server/package.json apps/server/package.json
COPY packages packages
RUN pnpm install --frozen-lockfile --filter server...

FROM deps AS build
COPY apps/server apps/server
RUN pnpm --filter server build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/apps/server/node_modules ./apps/server/node_modules
COPY --from=deps /workspace/packages ./packages
COPY --from=build /workspace/apps/server/dist ./apps/server/dist
COPY apps/server/package.json ./apps/server/package.json

WORKDIR /workspace/apps/server
EXPOSE 5000
CMD ["node", "dist/server.js"]
