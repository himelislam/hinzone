# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /workspace

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY apps/client/package.json apps/client/package.json
COPY packages packages
RUN pnpm install --frozen-lockfile --filter client...

FROM deps AS build
COPY apps/client apps/client
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm --filter client build

FROM nginx:alpine AS runner
COPY --from=build /workspace/apps/client/dist /usr/share/nginx/html
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
