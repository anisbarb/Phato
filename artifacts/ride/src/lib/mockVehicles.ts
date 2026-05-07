import { NH306, BADARPUR_SPUR, SONAI_SPUR } from "./corridor";
import { PLACES, CORRIDOR_TOWN_IDS } from "./places";
import { bearingDeg } from "./geometry";
import { haversineMeters } from "./geolocation";
import type { LatLng, Vehicle } from "./types";

const CORRIDOR_POINTS = [...NH306, ...BADARPUR_SPUR.slice(1), ...SONAI_SPUR.slice(1)];

const PREFIXES = ["AS-11", "AS-10", "AS-01", "AS-24", "AS-03", "AS-07"];

function pseudoRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function vehicleLabel(rand: () => number): string {
  const prefix = PREFIXES[Math.floor(rand() * PREFIXES.length)];
  const num = String(1000 + Math.floor(rand() * 8999));
  return `Auto ${prefix} ${num}`;
}

/** Place a vehicle near a corridor waypoint with small jitter */
function corridorStart(rand: () => number): LatLng {
  const pt = CORRIDOR_POINTS[Math.floor(rand() * CORRIDOR_POINTS.length)];
  return {
    lat: pt.lat + (rand() - 0.5) * 0.018,
    lng: pt.lng + (rand() - 0.5) * 0.018,
  };
}

export function generateVehicles(center: LatLng, count = 16, seed = 7): Vehicle[] {
  const rand = pseudoRandom(seed);
  const corridorPlaces = PLACES.filter((p) => CORRIDOR_TOWN_IDS.includes(p.id));
  const now = Date.now();

  return Array.from({ length: count }, (_, i) => {
    const dest = corridorPlaces[Math.floor(rand() * corridorPlaces.length)];
    const position = corridorStart(rand);
    const distToDest = haversineMeters(position, dest.position);
    const speedMps = distToDest > 300 ? 6 + rand() * 5 : 0.5 + rand() * 0.5;
    const seatsTotal = 6;
    const seatsFilled = Math.floor(rand() * 6);
    const heading = bearingDeg(position, dest.position);

    return {
      id: `veh_${i}_${(rand() * 1e6).toFixed(0)}`,
      label: vehicleLabel(rand),
      position,
      trail: [position],
      destinationId: dest.id,
      routeCoords: [position, dest.position],
      headingDeg: heading,
      speedMps,
      seatsTotal,
      seatsFilled,
      status: (speedMps > 1 ? "moving" : "waiting") as "moving" | "waiting",
      lastUpdated: now - Math.floor(rand() * 3000),
    };
  });
}
