import { haversineMeters } from "./geolocation";
import type { LatLng, Place } from "./types";

export const PLACES: Place[] = [
  { id: "silchar",     name: "Silchar",     position: { lat: 24.8333, lng: 92.7789 } },
  { id: "hailakandi",  name: "Hailakandi",  position: { lat: 24.6833, lng: 92.5667 } },
  { id: "badarpur",    name: "Badarpur",    position: { lat: 24.8636, lng: 92.5969 } },
  { id: "sonai",       name: "Sonai",       position: { lat: 24.7250, lng: 92.8367 } },
  { id: "karimganj",   name: "Karimganj",   position: { lat: 24.8697, lng: 92.3542 } },
  { id: "lakhipur",    name: "Lakhipur",    position: { lat: 24.8000, lng: 93.0136 } },
  { id: "algapur",     name: "Algapur",     position: { lat: 24.7430, lng: 92.6480 } },
  { id: "dholai",      name: "Dholai",      position: { lat: 24.7600, lng: 92.6750 } },
  { id: "kalain",      name: "Kalain",      position: { lat: 24.8500, lng: 92.6000 } },
  { id: "udharbond",   name: "Udharbond",   position: { lat: 24.7950, lng: 92.7600 } },
];

export const DEFAULT_PLACE_ID = "silchar";

/** Key corridor towns (used for simulating corridor-biased traffic) */
export const CORRIDOR_TOWN_IDS = [
  "silchar",
  "hailakandi",
  "algapur",
  "dholai",
  "udharbond",
  "badarpur",
  "sonai",
];

export function getPlace(id: string | null | undefined): Place | null {
  if (!id) return null;
  return PLACES.find((p) => p.id === id) ?? null;
}

export function nearestPlace(point: LatLng): Place {
  let best = PLACES[0];
  let bestDist = haversineMeters(point, best.position);
  for (let i = 1; i < PLACES.length; i += 1) {
    const d = haversineMeters(point, PLACES[i].position);
    if (d < bestDist) {
      bestDist = d;
      best = PLACES[i];
    }
  }
  return best;
}
