# DoomSchooling

Learn anything by doom-scrolling through it.

DoomSchooling turns any topic into an AI-generated social media feed — like Reddit or Twitter, but every post is designed to teach you something. Five personas (expert, practitioner, learner, skeptic, enthusiast) debate and discuss the topic in threads you can scroll through endlessly.

## How it works

1. Enter any topic and choose how deep you want to go
2. Get a personalized discussion generated through OpenRouter
3. Scroll to load more posts, up to 5 rounds per feed
4. Jump to a related question without losing your learning depth

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, TanStack Query, Zustand, Tailwind CSS |
| Backend | Fastify v5, TypeScript |
| AI | OpenRouter with DeepSeek V4 Flash; Gemini remains optional |
| Auth | Clerk |
| Monorepo | pnpm workspaces |

## Project structure

```
apps/
  web/      # React frontend (port 5173)
  api/      # Fastify backend (port 3000)
packages/
  shared/   # Zod schemas and TypeScript types shared between apps
```

## Getting started

### Prerequisites

- Node.js 18+
- pnpm
- An [OpenRouter API key](https://openrouter.ai/keys)
- A [Clerk](https://clerk.com/) account

### Setup

```bash
# Install dependencies
pnpm install

# Create a .env file at the repo root
cp .env.example .env
```

Fill in your `.env`:

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=deepseek/deepseek-v4-flash

# Local development without Clerk
DEV_AUTH_BYPASS=true
VITE_DEV_AUTH_BYPASS=true

CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

The development auth bypass is ignored by production builds. Remove both bypass variables when using real Clerk keys.

```bash
# Start both frontend and backend
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

## Development

```bash
pnpm dev           # start everything
pnpm build         # build all packages (shared → api → web)
pnpm lint          # lint all packages
pnpm typecheck     # typecheck all packages

# Run a single package
pnpm --filter web dev
pnpm --filter api dev
```

To develop without an OpenRouter key, set `LLM_PROVIDER=mock` in `.env` to use hardcoded fixture data.

## Production

Production runs as an isolated Docker Compose stack behind the existing Cloudflare
Tunnel. See [docs/production.md](docs/production.md) for the topology, release flow,
VPS setup, rollback, and common operations.

## API

All feed routes require a valid Clerk session.

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/feeds/generate` | Generate a new feed for a topic |
| `POST` | `/api/feeds/continue` | Load more posts (infinite scroll) |
| `GET` | `/api/health` | Health check (public) |

The OpenRouter provider currently generates text only. When Gemini is selected, generated images are stored in `apps/api/src/uploads/` and served at `/uploads/`.
