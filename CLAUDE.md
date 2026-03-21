# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is DoomSchooling

An educational platform that presents any learning topic as a scrolling social media feed (like Reddit/Twitter). Users enter a topic and receive AI-generated "threads" from five persona archetypes (expert, practitioner, learner, skeptic, enthusiast) who teach through conversation and debate.

## Commands

```bash
pnpm install              # install all workspace deps
pnpm dev                  # starts both web (port 5173) and api (port 3000)
pnpm build                # build shared → api → web (order matters)
pnpm lint                 # lint all packages
pnpm typecheck            # typecheck all packages

# Per-package
pnpm --filter web dev     # frontend only
pnpm --filter api dev     # backend only (uses tsx watch)
pnpm --filter shared build  # must rebuild after changing shared types
```

## Monorepo layout

- **apps/web** — React 19 + Vite + TypeScript frontend
- **apps/api** — Fastify v5 + TypeScript backend
- **packages/shared** — Zod schemas, TypeScript types, LLM provider interface (single source of truth for data shapes)

Package manager is **pnpm** with workspaces. Never use npm or yarn.

## Architecture

### LLM Provider abstraction (most important pattern)

`ILLMProvider` interface in `packages/shared/src/llm.ts` defines `generateFeed()`, `continueFeed()`, `generateImage()`. The active provider is selected by `LLM_PROVIDER` env var via `resolveProvider()` factory in `apps/api/src/providers/index.ts`.

Current providers: **GeminiProvider** (text + image, production), **MockProvider** (hardcoded, for UI dev). Claude and OpenAI providers are stubs.

Critical rules:
- Prompt templates live in `apps/api/src/prompts/`, never inside provider classes
- All providers must validate LLM output through Zod schemas before returning
- Mock provider must stay functional at all times (fallback for dev without API keys)

### API routes

```
POST /api/feeds/generate   — generate new feed for a topic
POST /api/feeds/continue   — infinite scroll continuation (max 10 per topic)
GET  /api/health           — health check
```

Response envelope: `{ data: T }` on success, `{ error: { code, message } }` on failure.

### Frontend data flow

1. HomePage: user enters topic → navigates to `/feed?topic=...`
2. FeedPage: TanStack Query mutation calls `/api/feeds/generate`
3. IntersectionObserver sentinel triggers `/api/feeds/continue` for infinite scroll (max 5 rounds client-side)
4. Zustand store manages UI-only state (collapsed threads, cosmetic votes/comments)

### Image generation

GeminiProvider generates images for `postType: 'image'` posts. Images are saved to `apps/api/src/uploads/` and served via `@fastify/static` at `/uploads/`. The Vite dev server proxies `/uploads` to the API.

## Coding conventions

- TypeScript strict mode everywhere. No `any`.
- Zod for all external data boundaries (API requests, LLM responses).
- No default exports except React page components and Fastify plugins.
- Tailwind classes only — no inline styles.
- Absolute imports via `@/` path alias in both apps.
- Co-locate tests: `foo.test.ts` next to `foo.ts`.
- Fastify route errors use `fastify-error` typed errors, not plain `Error`.

## Authentication

Clerk handles all authentication. No custom users table or JWT logic.

- **Frontend**: `@clerk/react` with prebuilt `<SignIn />` and `<SignUp />` components
- **Backend**: `@clerk/fastify` verifies Clerk session tokens on protected routes
- **Protected routes**: all `/api/feeds/*` routes require a valid Clerk session
- `/api/health` remains public

## Environment variables

Set in `.env` at repo root (gitignored):

```
LLM_PROVIDER=gemini          # gemini | mock (claude | openai are stubs)
GEMINI_API_KEY=...
CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/learnfeed
```

## Current state vs CLAUDE_old.md

`CLAUDE_old.md` was the original design doc. Key differences from current reality:
- **No database yet** — Drizzle ORM and PostgreSQL are planned but not implemented
- **No docker-compose.yml** — no Docker setup exists yet
- **Image generation works** — listed as "out of scope" in old doc but implemented via Gemini
- **`/api/feeds/continue` exists** — not in old doc's route list, added for infinite scroll
- **`GET /api/feeds/:id` does not exist** — listed in old doc but never implemented
