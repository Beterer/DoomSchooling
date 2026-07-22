# Production deployment

DoomSchooling runs on the same VPS as Notice, but in its own Docker Compose
project (`doomschooling-prod`). The two applications do not share containers,
networks, volumes, or release steps.

## Topology

Cloudflare terminates public HTTPS for `doomschooling.org`. The existing remotely
managed tunnel connects to `127.0.0.1:5173` on the VPS. Only the DoomSchooling web
container publishes that port, and it binds to loopback only. The web container
serves the React app and proxies `/api` and `/uploads` to the private API container.

Notice keeps exclusive use of the public ports 80 and 443. No firewall change is
needed for DoomSchooling.

## Release flow

1. A push to `main` runs type checking, the production build, and a production
   dependency audit.
2. GitHub Actions builds API and web images and pushes both `latest` and immutable
   commit-SHA tags to GHCR.
3. Deployment stays manual and gated. Run `bash scripts/deploy.sh` from a current
   checkout. It syncs the non-secret compose file, pulls images, starts the stack,
   and checks the local health endpoint.

The VPS does not build source code. To roll back, set `API_IMAGE` and `WEB_IMAGE`
in the VPS `.env` to known-good SHA tags and run the deploy script again.

## One-time VPS configuration

The secret file is `/home/deploy/doomschooling/.env`, mode 600. Start from
`infra/compose/.env.example`, but never copy real values back into the repository.
It needs:

- the existing OpenRouter key;
- Clerk production publishable and secret keys for `doomschooling.org`;
- the connector token for the existing remotely managed Cloudflare Tunnel.

The tunnel was originally configured for `http://localhost:5173` on a laptop. The
same origin URL is kept on the VPS, so the Cloudflare dashboard route does not need
to change. `cloudflared` uses host networking only to reach that loopback address;
the API remains on a private Docker network.

The deploy user is already logged in to GHCR for the private Notice images. The
same login can pull the DoomSchooling images after GitHub Actions publishes them.

## Operations

Run these commands from `/home/deploy/doomschooling` on the VPS:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs cloudflared --tail 50
curl http://127.0.0.1:5173/api/health
```

The generated-image volume is named `doomschooling-prod_uploads`. Do not remove it
during a normal deploy.
