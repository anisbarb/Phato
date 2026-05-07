# Phato — Ride-Share

Mobile-first React + TypeScript + Vite ride-share UI built with Leaflet, OSRM routing, and Tailwind CSS. Two screens: Passenger and Driver.

```
    ┌─ ROUTE MAP ──────────────────────────────────┐
    │                                              │
    │  📍 Pickup        📍 Destination            │
    │   └─────────────────────────────┘            │
    │          ╔════════════╗                      │
    │          ║   ╔════╗  ║  ← Driver             │
    │   Route: ║   ║ 🚗 ║  ║  (en route)          │
    │   ───→   ║   ╚════╝  ║                      │
    │          ╚════════════╝                      │
    │                                              │
    └──────────────────────────────────────────────┘
```

## Local development

From the repository root:

```bash
pnpm install
pnpm --filter @workspace/ride run dev
```

The dev server reads `PORT` and `BASE_PATH` from the environment. With no env vars set, Vite serves the app at `http://localhost:5173/`.

## Production build

```bash
pnpm --filter @workspace/ride run build
```

The static bundle is emitted to `artifacts/ride/dist/public`.

## Deploying to Vercel

A `vercel.json` is included at the repository root that points Vercel at this artifact:

- **Build Command**: `pnpm --filter @workspace/ride run build`
- **Output Directory**: `artifacts/ride/dist/public`
- **Install Command**: `pnpm install --frozen-lockfile`

Push the repository to GitHub and import it in Vercel — no manual project settings or environment variables are required.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- `leaflet` + `react-leaflet` (CARTO light basemap)
- OSRM public routing API (`router.project-osrm.org`) with a haversine fallback
- `lucide-react` icons
- `wouter` router

## Connecting to a real backend

All data flows through small, typed helpers so they are easy to swap later:

- `src/lib/geolocation.ts` — geolocation watcher and helpers
- `src/lib/osrm.ts` — `fetchRoute(from, to)` returns a `RouteResult`
- `src/lib/mockVehicles.ts` — replace `nearbyVehicles(center)` with your own driver feed (Supabase, your API, websockets, etc.)
