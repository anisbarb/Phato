# Phato & Relations — Two Vite + React apps in one workspace

Two apps: **Phato Ride-Share** (live map ride-hailing for Assam corridors) and **Relationship Tracker** (CRM-style contact/pipeline manager), backed by a shared Express API + PostgreSQL.

## Run & Operate

- Workflows manage all services — do NOT run `pnpm dev` at workspace root
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm run typecheck` — full typecheck across all packages
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.x
- Frontend: React 19 + Vite 7, Tailwind CSS v4, wouter (routing)
- API: Express 5 + WebSocket (ws) for real-time ride tracking
- DB: PostgreSQL + Drizzle ORM (`lib/db/`)
- Validation: Zod, `drizzle-zod`
- API codegen: Orval (from `lib/api-spec/openapi.yaml`)
- Maps: Leaflet + react-leaflet (Phato)

## Where things live

- `artifacts/ride/` — Phato Ride-Share frontend (`@workspace/ride`, previewPath `/ride/`)
- `artifacts/relationships/` — Relationship Tracker frontend (`@workspace/relationships`, previewPath `/`)
- `artifacts/api-server/` — Shared Express backend (`@workspace/api-server`, previewPath `/api`)
- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/api-client-react/src/generated/` — Generated React Query hooks
- `lib/api-zod/src/generated/` — Generated Zod schemas
- `lib/db/src/schema/` — Drizzle DB schema

## Architecture decisions

- Two separate frontend artifacts share one api-server and one database
- Phato uses WebSocket (`/api/ws/location`) for real-time driver location broadcasting — no DB required
- Relationship Tracker uses full OpenAPI-first CRUD (Orval codegen → React Query hooks)
- `BASE_PATH` env var controls Vite base URL per artifact (set by workflow)
- Ride app uses simulated passengers/vehicles client-side (no persistent ride data in DB)

## Product

- **Phato Ride-Share**: White splash screen, DM Sans font, white theme-color. Passengers see live autos on a corridor map (Hailakandi–Silchar), request pickups, chat with drivers. Drivers broadcast location, accept/reject pickups. Hamburger ☰ opens a role-based slide-in **MenuSheet** (right-side drawer) with: Home Location pin setter, Trip History, Saved Places (starred map pins), Notifications, Become a Driver registration form (name + phone + vehicle + photos → Supabase), and Settings (map style switcher + polyline style picker). Route protection: `/driver` only accessible if `phato_user_role === "driver"`. Tile switching: Standard / Satellite / Dark / Terrain. Route styles: Apple / Uber / Glow / Minimal.
- **Relationship Tracker**: CRM tool — manage contacts through a configurable pipeline with stages, tags, interaction history, and dashboard summaries.

## User preferences

_Populate as you learn them._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` before starting `relationships` frontend if API spec changes
- Ride app uses Vite 6 (pinned in its package.json); relationships uses Vite 7 from catalog
- WebSocket endpoint is at `/api/ws/location` — handled in `artifacts/api-server/src/index.ts` via `http.createServer`
- Port conflicts: `.migration-backup/artifacts/*` workflows share ports with `artifacts/*` — if port 21738/8080 conflict, kill stale PID via `/proc/[pid]/fd` socket inode lookup (`kill -9 PID`)
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are optional — `supabase.ts` exports `supabaseConfigured` (boolean); DriverRegisterSheet shows error if unconfigured
- All user prefs stored in localStorage: `phato_map_style`, `phato_polyline_style`, `phato_home_location`, `phato_saved_places`, `phato_user_role`, `phato_profile_img`

## Pointers

- See `pnpm-workspace` skill for workspace structure and TypeScript setup
- Drizzle schema: `lib/db/src/schema/`
- OpenAPI spec: `lib/api-spec/openapi.yaml`
