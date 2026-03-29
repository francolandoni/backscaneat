FROM node:24-slim AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json tsconfig.base.json ./

COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/db/package.json ./lib/db/
COPY artifacts/api-server/package.json ./artifacts/api-server/

RUN pnpm install --frozen-lockfile

COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

RUN pnpm --filter @workspace/api-server run build


FROM node:24-slim AS runner

WORKDIR /app

COPY --from=builder /app/artifacts/api-server/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080
# DB_CONNECTION must be provided at runtime, e.g.:
# docker run -e DB_CONNECTION="mysql://user:pass@host:3306/db" ...

EXPOSE 8080

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
