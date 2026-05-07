import type { LatLng, RouteResult } from "./types";
import { isValidLatLng } from "./types";

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

export async function fetchRoute(
  from: LatLng,
  to: LatLng,
  signal?: AbortSignal,
): Promise<RouteResult | null> {
  if (!isValidLatLng(from) || !isValidLatLng(to)) return null;

  const url =
    `${OSRM_URL}/${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) {
      console.error("OSRM HTTP error:", res.status, res.statusText);
      return null;
    }
    const data = await res.json();
    if (data?.code !== "Ok") {
      console.error("OSRM error:", data?.code, data?.message);
      return null;
    }
    const r = data?.routes?.[0];
    const rawCoords = r?.geometry?.coordinates as [number, number][] | undefined;
    if (!rawCoords || rawCoords.length < 2) {
      console.error("OSRM returned empty geometry");
      return null;
    }
    const coordinates: LatLng[] = rawCoords
      .map(([lng, lat]) => ({ lat, lng }))
      .filter(isValidLatLng);
    if (coordinates.length < 2) return null;
    return {
      coordinates,
      distanceMeters: Number(r.distance ?? 0),
      durationSeconds: Number(r.duration ?? 0),
    };
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") return null;
    console.error("OSRM fetch failed:", err);
    return null;
  }
}

export async function fetchRouteVariants(
  from: LatLng,
  to: LatLng,
  signal?: AbortSignal,
): Promise<RouteResult[]> {
  if (!isValidLatLng(from) || !isValidLatLng(to)) return [];

  const midpoint = {
    lat: (from.lat + to.lat) / 2,
    lng: (from.lng + to.lng) / 2,
  };
  const spanLat = Math.max(0.01, Math.abs(to.lat - from.lat));
  const spanLng = Math.max(0.01, Math.abs(to.lng - from.lng));
  const variants = [
    { lat: midpoint.lat + spanLat * 0.11, lng: midpoint.lng + spanLng * 0.08 },
    { lat: midpoint.lat - spanLat * 0.12, lng: midpoint.lng - spanLng * 0.07 },
    { lat: midpoint.lat + spanLat * 0.03, lng: midpoint.lng - spanLng * 0.14 },
  ];

  const requests = [to, ...variants].map(async (target) => {
    const route = await fetchRoute(from, target, signal);
    return route;
  });

  const results = await Promise.all(requests);
  const seen = new Set<string>();
  const routes: RouteResult[] = [];

  for (const route of results) {
    if (!route) continue;
    const key = route.coordinates
      .slice(0, 5)
      .map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`)
      .join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    routes.push(route);
  }

  return routes;
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return "";
  if (meters < 950) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} m`;
}
