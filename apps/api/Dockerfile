# Multi-stage: the runtime image carries no toolchain and no source.
FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
# Fetch pnpm once, in the base layer both images share, instead of at the first
# `pnpm install`: a slow or interrupted download then fails here, early and
# clearly, and a rebuild reuses the cached layer. Keep the version in step with
# `packageManager` in the root package.json.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/core/package.json        packages/core/
COPY packages/allocator/package.json   packages/allocator/
COPY packages/contracts/package.json   packages/contracts/
COPY packages/api-client/package.json  packages/api-client/
COPY packages/tokens/package.json      packages/tokens/
COPY apps/api/package.json             apps/api/
RUN pnpm install --frozen-lockfile --filter @katapatha/api...

FROM deps AS build
COPY packages/ packages/
COPY apps/api/ apps/api/
WORKDIR /repo/apps/api
RUN pnpm exec prisma generate && pnpm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/node_modules /repo/node_modules
COPY --from=build /repo/packages /repo/packages
COPY --from=build /repo/apps/api /repo/apps/api
WORKDIR /repo/apps/api
EXPOSE 3001
# Migrate and seed on boot: the demo database must be reproducible from empty.
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm run db:seed && pnpm run db:seed:products && pnpm run db:seed:districts && node dist/main.js"]
