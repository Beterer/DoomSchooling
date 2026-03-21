# CLAUDE.md — Project Intelligence File

This file is read automatically by Claude Code at the start of every session.
It contains architecture decisions, conventions, and context that must be respected
across all generated code. Do not deviate from these decisions without being explicitly
asked to revisit them.

---

## What this app is

An educational platform that presents any learning topic as a scrolling social media
feed — similar to Reddit or Twitter/X. The user enters a topic (anything: Roman history,
sourdough baking, JavaScript closures, Renaissance painting techniques) and receives a
generated "thread" of posts from AI personas who teach through conversation, debate,
analogies, and examples.

The key UX insight: it looks and feels like scrolling a social feed, not studying.

---

## Monorepo structure

```
/
├── apps/
│   ├── web/              # React 19 + Vite + TypeScript (frontend)
│   └── api/              # Fastify + TypeScript (backend)
├── packages/
│   └── shared/           # Shared types, Zod schemas, constants
├── docker-compose.yml    # Local development (PostgreSQL)
├── k8s/                  # Kubernetes manifests (for later deployment)
├── pnpm-workspace.yaml
└── CLAUDE.md             # This file
```

Package manager: **pnpm** with workspaces. Always use `pnpm`, never npm or yarn.

---

## Tech stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 19 + Vite + TypeScript | |
| Routing | React Router v7 | |
| Server state | TanStack Query v5 | All API calls go through TQ |
| Client state | Zustand | Only for UI state (expanded threads, active topic) |
| Styling | Tailwind CSS v4 | Utility-first, no component libraries |
| Code highlighting | Shiki | Only relevant when topic involves code |
| Backend | Fastify v5 + TypeScript | |
| ORM | Drizzle ORM | Schema-first, TypeScript-native |
| Database | PostgreSQL 16 | Runs in Docker Compose locally |
| Validation | Zod | Shared between frontend and backend via packages/shared |
| LLM | Abstracted via ILLMProvider | See Generation layer section |

---

## Local development setup

Everything runs locally. There are no external cloud dependencies during development.

```
docker-compose up -d    # starts PostgreSQL
pnpm install            # install all workspace deps
pnpm dev                # starts both web (port 5173) and api (port 3000) concurrently
```

Environment variables live in `.env` files at the repo root (gitignored).
A `.env.example` must always be kept up to date.

Required env vars:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/learnfeed
LLM_PROVIDER=gemini          # gemini | claude | openai | mock
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...        # only needed if LLM_PROVIDER=claude
OPENAI_API_KEY=...           # only needed if LLM_PROVIDER=openai
```

---

## The generation layer — most important architectural decision

The LLM provider is fully abstracted behind an interface. The rest of the application
has zero knowledge of which provider is active. Swapping providers = changing one env var.

### Interface (packages/shared/src/llm.ts)

```typescript
export interface ILLMProvider {
  generateFeed(request: FeedRequest): Promise<GeneratedFeed>;
  generateImage(prompt: string): Promise<Buffer | null>; // null if unsupported
  readonly supportsImageGeneration: boolean;
  readonly providerName: string;
}
```

### Providers (apps/api/src/providers/)

```
providers/
├── index.ts            # resolveProvider() factory — reads LLM_PROVIDER env var
├── base.ts             # shared prompt building utilities
├── mock.provider.ts    # returns hardcoded JSON — used for UI development
├── gemini.provider.ts  # Google Gemini — text + image generation
├── claude.provider.ts  # Anthropic Claude — text only (supportsImageGeneration: false)
└── openai.provider.ts  # OpenAI — text + DALL-E images
```

### Critical rules for providers

- **Prompt templates live in `apps/api/src/prompts/`**, not inside provider classes.
  Providers call `buildFeedPrompt(request)` from the prompt builder — they do not
  construct prompts themselves. This means prompts don't need to be rewritten when
  switching providers.
- **All providers must return data conforming to `GeneratedFeed`** (defined in shared).
  The provider is responsible for parsing/validating the LLM's raw response into this shape.
- **Image generation is optional per provider.** If `supportsImageGeneration` is false,
  image fields in posts will be null. The UI must handle null images gracefully.
- **The mock provider must be kept functional at all times.** It is the fallback for
  UI development and CI environments where API keys are not present.

---

## Core data types (packages/shared/src/types.ts)

These are the canonical types. All API responses and frontend state must conform to them.

```typescript
export type PostType = 'text' | 'code' | 'image' | 'divider';

export interface Persona {
  id: string;
  displayName: string;
  handle: string;            // @handle format
  role: PersonaRole;
  avatarColor: string;       // hex color for avatar placeholder
  avatarInitials: string;    // 1-2 chars
}

export type PersonaRole =
  | 'expert'        // authoritative, gives definitions and context
  | 'practitioner'  // shares real-world application and experience
  | 'learner'       // asks clarifying questions, voices confusion
  | 'skeptic'       // challenges assumptions, adds nuance
  | 'enthusiast';   // energy and accessibility, analogies and wonder

export interface Post {
  id: string;
  persona: Persona;
  content: string;           // markdown supported
  postType: PostType;
  language?: string;         // for code posts: 'python', 'js', etc.
  imageUrl?: string | null;
  imageAlt?: string | null;
  depth: number;             // 0 = top-level, 1+ = reply depth
  parentId?: string | null;
  votes: number;             // seeded random, purely cosmetic
  timestamp: string;         // relative label e.g. "3h ago", cosmetic
}

export interface FeedRequest {
  topic: string;
  depth?: 'surface' | 'intermediate' | 'deep'; // defaults to 'intermediate'
}

export interface GeneratedFeed {
  id: string;
  topic: string;
  posts: Post[];
  suggestedNextTopics: string[]; // 4-6 follow-up topic suggestions
  generatedAt: string;
}
```

---

## Persona system

Personas are **domain-agnostic archetypes**, not technology-specific characters.
The prompt builder assigns flavored names and communication styles based on the topic.

For a topic like "French Revolution":
- Expert → `HistorianPro @historian_pro` (formal, cites sources, adds context)
- Practitioner → `TeacherInField @the_teacher` (explains how they teach this)
- Learner → `CuriousStudent @curious_one` (asks the questions the user is thinking)
- Skeptic → `SourceChecker @source_checker` (questions popular narratives)
- Enthusiast → `HistoryBuff @history_buff` (analogies, passion, "here's the wild part")

For a topic like "sourdough starter":
- Expert → `FermentationExpert @ferment_pro`
- Practitioner → `Homebaker @homebaker`
- Learner → `BakingNewbie @baking_newbie`
... and so on.

The LLM generates appropriate persona names as part of the feed generation.
The persona archetypes (roles) are always the same five — only names/handles change.

---

## API routes

```
POST /api/feeds/generate      — generate a new feed for a topic
GET  /api/feeds/:id           — retrieve a previously generated feed
GET  /api/health              — health check
```

All routes are versioned under `/api`. Responses always conform to:
```typescript
// Success
{ data: T }
// Error
{ error: { code: string; message: string } }
```

---

## Frontend structure

```
apps/web/src/
├── components/
│   ├── feed/
│   │   ├── Feed.tsx              # main scrollable container
│   │   ├── Post.tsx              # individual post card
│   │   ├── PostHeader.tsx        # avatar + name + handle
│   │   ├── PostBody.tsx          # markdown + code blocks
│   │   ├── PostActions.tsx       # vote/comment/share UI (cosmetic)
│   │   ├── ThreadLine.tsx        # vertical indent line for replies
│   │   └── NextTopics.tsx        # "what to learn next" pills
│   └── ui/
│       ├── TopicInput.tsx        # home screen search/input
│       └── LoadingFeed.tsx       # skeleton loader while generating
├── pages/
│   ├── HomePage.tsx
│   └── FeedPage.tsx
├── stores/
│   └── feedStore.ts              # Zustand: expanded/collapsed thread state
├── hooks/
│   └── useGenerateFeed.ts        # TanStack Query mutation wrapper
└── lib/
    └── api.ts                    # typed API client
```

---

## Coding conventions

- **TypeScript strict mode** everywhere. No `any`. Use `unknown` and narrow it.
- **Zod for all external data** — API request bodies, LLM responses, env vars.
  Never trust raw LLM output — always parse through a Zod schema.
- **No default exports** except for React page components and Fastify plugins.
- **Co-locate tests** — `foo.test.ts` next to `foo.ts`.
- **Error handling** — Fastify uses `fastify-error` typed errors. Never throw plain
  `Error` objects in route handlers. Frontend errors surface via TanStack Query's
  error state, never try/catch in components.
- **No inline styles** in React — Tailwind classes only.
- **Absolute imports** in both apps using TypeScript path aliases:
  `@/components/...`, `@/hooks/...`, etc.

---

## MVP scope

### In scope
- Topic input → on-demand feed generation
- Full post/reply threading with expand/collapse
- All five persona archetypes rendered distinctly
- Code blocks with syntax highlighting (Shiki) when topic involves code
- "What to learn next" topic suggestions at end of feed
- Vote/comment/share UI elements (cosmetic only — no real interaction)
- Loading state while generation is in progress
- Error state if generation fails

### Explicitly out of scope for MVP
- User authentication
- Quizzes / "Answer This" interactive challenges
- Bookmarking / saved feeds
- Feed caching (Redis) — every generation hits the LLM fresh
- Image generation — `imageUrl` will always be null in MVP; UI must handle gracefully
- Discover / Profile / Create navigation tabs (render as disabled stubs)
- Feed history / revisiting past feeds

---

## Build order

Follow this sequence. Do not skip phases.

1. **Shared types** — define all types and Zod schemas in `packages/shared` first
2. **Mock provider** — implement `MockProvider` returning a realistic hardcoded feed
3. **API skeleton** — Fastify app with `/generate` route using `MockProvider`
4. **Frontend skeleton** — feed UI rendering the mock response (no real API calls yet)
5. **Wire frontend ↔ API** — replace mock data with real TanStack Query calls
6. **Implement GeminiProvider** — swap mock for real generation
7. **Prompt engineering** — iterate on `apps/api/src/prompts/feed.prompt.ts` until
   feed quality is consistently good across diverse topics
8. **Polish** — loading states, error states, empty states, responsive layout

---

## Things that commonly go wrong — read before generating code

- **LLM output is unpredictable.** Always parse Gemini/Claude responses through Zod.
  If the parse fails, retry once then return a descriptive error — never silently
  swallow a parse failure.
- **Thread depth.** The `depth` field on posts must be respected by the UI for
  indentation. A reply to a reply is `depth: 2`. Cap visual indentation at depth 3
  regardless of actual depth value.
- **Persona variety.** The prompt must explicitly instruct the LLM to use all five
  persona roles and to interleave them — not cluster all expert posts at the top.
- **Topic sensitivity.** Some topics (medical, legal, political) need a disclaimer
  injected into the feed. Add a check in the prompt builder for sensitive topic
  categories and prepend an appropriate system note.
- **The mock provider must always produce valid `GeneratedFeed` data** that exercises
  all UI states: multiple depths, a code block post, a long text post, all five persona
  roles present.
