# SyncBeat Music Room

SyncBeat lets two people create a private listening room, search music across languages, and control shared playback together.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/syncbeat/` — React/Vite room experience and onboarding
- `artifacts/api-server/src/routes/music.ts` — room, presence, queue, playback, and music search routes
- `lib/api-spec/openapi.yaml` — source of truth for the typed API contract
- `lib/db/src/schema/music.ts` — PostgreSQL schema for rooms, listeners, queue, and playback state
- `artifacts/syncbeat/src/index.css` — SyncBeat visual tokens, typography, motion, and responsive styles

## Architecture decisions

- Music search uses the public iTunes Search API server-side, so the browser never needs a third-party key and searches work across languages.
- Room playback state is persisted in PostgreSQL and the client polls the state endpoint so two browsers converge without requiring a separate realtime service.
- Audio playback uses provider preview URLs where available; the room controls remain synchronized even when a track has no preview.
- Anonymous listener identity is kept client-side and presence is refreshed through the room join endpoint.

## Product

- Create or join a room with a short invite code.
- Search Hindi, English, Bengali, and other music with optional language filtering.
- Add tracks to a shared queue, start a song, and control synchronized play/pause/seek.
- See who is in the room and copy an invite link.

## User preferences

- The user requested a simple but advanced Bento-style interface with prominent buttons rather than default UI.

## Gotchas

- Preview playback depends on the music provider returning an audio preview URL; source links remain available for tracks without one.
- Keep the OpenAPI spec and generated client/Zod packages in sync after API changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
