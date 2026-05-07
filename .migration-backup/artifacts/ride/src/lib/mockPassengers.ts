import { PLACES } from "./places";
import { bearingDeg } from "./geometry";
import type { LatLng, PassengerRequest } from "./types";

function pseudoRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function placeNear(center: LatLng, rand: () => number, radiusKm: number): LatLng {
  const r = (rand() * radiusKm) / 111;
  const a = rand() * Math.PI * 2;
  return { lat: center.lat + r * Math.cos(a), lng: center.lng + r * Math.sin(a) };
}

export function generatePassengers(
  center: LatLng,
  count = 10,
  seed = 41,
): PassengerRequest[] {
  const rand = pseudoRandom(seed);
  const requests: PassengerRequest[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i += 1) {
    const dest = PLACES[Math.floor(rand() * PLACES.length)];
    const position = placeNear(center, rand, 3);
    requests.push({
      id: `pax_${i}_${Math.floor(rand() * 1e6)}`,
      position,
      destinationId: dest.id,
      routeCoords: [position, dest.position],
      headingDeg: bearingDeg(position, dest.position),
      status: "waiting",
      waitMinutes: Math.max(1, Math.round(rand() * 9) + 1),
      lastUpdated: now,
    });
  }
  return requests;
}
