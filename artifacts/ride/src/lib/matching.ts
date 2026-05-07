import type {
  Destination,
  LatLng,
  PassengerRequest,
  RouteConfidence,
  Vehicle,
} from "./types";
import { haversineMeters } from "./geolocation";
import { bearingDeg, bearingDiff, pointToPolylineDist } from "./geometry";
import { getPlace } from "./places";

const CORRIDOR_M = 150;
const HEADING_TOLERANCE_DEG = 45;
const MAX_MARKERS = 30;

export type MatchedVehicle = Vehicle & {
  distanceM: number;
  corridorDistM: number;
  etaMinutes: number;
  confidence: RouteConfidence;
};

export type MatchedPassenger = PassengerRequest & {
  distanceM: number;
  corridorDistM: number;
  etaMinutes: number;
  confidence: RouteConfidence;
};

function confidenceFor(corridorDistM: number): RouteConfidence {
  if (corridorDistM <= 50) return "on";
  if (corridorDistM <= CORRIDOR_M) return "near";
  return "off";
}

function etaFromSpeed(distanceM: number, speedMps: number): number {
  const effective = Math.max(speedMps, 4);
  const seconds = distanceM / effective;
  return Math.max(1, Math.round(seconds / 60));
}

export function matchVehicles({
  origin,
  destination,
  vehicles,
  radiusM,
}: {
  origin: LatLng | null;
  destination: Destination | null;
  vehicles: Vehicle[];
  radiusM: number;
}): MatchedVehicle[] {
  if (!origin || !destination) return [];
  const userHeading = bearingDeg(origin, destination.position);
  const matches: MatchedVehicle[] = [];

  for (const v of vehicles) {
    if (v.status === "offline") continue;
    const distanceM = haversineMeters(origin, v.position);
    if (distanceM > radiusM) continue;
    const corridorDistM = pointToPolylineDist(origin, v.routeCoords);
    if (corridorDistM > CORRIDOR_M) continue;
    if (bearingDiff(userHeading, v.headingDeg) > HEADING_TOLERANCE_DEG) continue;
    const etaMinutes = etaFromSpeed(distanceM, v.speedMps);
    matches.push({
      ...v,
      distanceM,
      corridorDistM,
      etaMinutes,
      confidence: confidenceFor(corridorDistM),
    });
  }

  matches.sort((a, b) => {
    if (a.confidence !== b.confidence) {
      const w: Record<RouteConfidence, number> = { on: 0, near: 1, off: 2 };
      return w[a.confidence] - w[b.confidence];
    }
    if (a.distanceM !== b.distanceM) return a.distanceM - b.distanceM;
    return a.etaMinutes - b.etaMinutes;
  });

  return matches.slice(0, MAX_MARKERS);
}

export function matchPassengers({
  origin,
  destination,
  passengers,
  radiusM,
}: {
  origin: LatLng | null;
  destination: Destination | null;
  passengers: PassengerRequest[];
  radiusM: number;
}): MatchedPassenger[] {
  if (!origin || !destination) return [];
  const driverHeading = bearingDeg(origin, destination.position);
  const matches: MatchedPassenger[] = [];

  for (const p of passengers) {
    if (p.status === "inactive" || p.status === "offline") continue;
    const distanceM = haversineMeters(origin, p.position);
    if (distanceM > radiusM) continue;
    const corridorDistM = pointToPolylineDist(p.position, [
      origin,
      destination.position,
    ]);
    if (corridorDistM > CORRIDOR_M) continue;
    if (bearingDiff(driverHeading, p.headingDeg) > HEADING_TOLERANCE_DEG) continue;
    const etaMinutes = etaFromSpeed(distanceM, 6);
    matches.push({
      ...p,
      distanceM,
      corridorDistM,
      etaMinutes,
      confidence: confidenceFor(corridorDistM),
    });
  }

  matches.sort((a, b) => {
    if (a.confidence !== b.confidence) {
      const w: Record<RouteConfidence, number> = { on: 0, near: 1, off: 2 };
      return w[a.confidence] - w[b.confidence];
    }
    if (a.distanceM !== b.distanceM) return a.distanceM - b.distanceM;
    return a.etaMinutes - b.etaMinutes;
  });

  return matches.slice(0, MAX_MARKERS);
}

export function destinationMatchPlace(d: Destination | null): string | null {
  if (!d) return null;
  if (d.placeId) return d.placeId;
  return null;
}

export const _internals = {
  CORRIDOR_M,
  HEADING_TOLERANCE_DEG,
  MAX_MARKERS,
  getPlace,
};
