FROM node:22-alpine AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.12.0 --activate

WORKDIR /src
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

COPY apps/web apps/web
COPY packages/shared packages/shared
RUN pnpm --filter shared build && pnpm --filter web build

FROM caddy:2-alpine AS runtime

COPY infra/caddy/Caddyfile /etc/caddy/Caddyfile
COPY infra/caddy/start-web.sh /usr/local/bin/start-web
COPY --from=build /src/apps/web/dist /srv

RUN chmod 755 /usr/local/bin/start-web

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/start-web"]
