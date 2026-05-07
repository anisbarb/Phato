import { useEffect, useMemo, useRef, useState } from "react";
import { generateVehicles } from "@/lib/mockVehicles";
import { getPlace } from "@/lib/places";
import { stepToward, haversineMeters } from "@/lib/geolocation";
import { bearingDeg } from "@/lib/geometry";
import type { LatLng, Vehicle } from "@/lib/types";

const TICK_MS = 2500;
const STEP_METERS = 80;
const TRAIL_MAX = 5;

export function useSimulatedVehicles(center: LatLng | null, count = 16): Vehicle[] {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const seededRef = useRef<string | null>(null);

  useEffect(() => {
    if (!center) return;
    const key = `${center.lat.toFixed(2)}_${center.lng.toFixed(2)}`;
    if (seededRef.current === key) return;
    seededRef.current = key;
    setVehicles(generateVehicles(center, count));
  }, [center, count]);

  useEffect(() => {
    if (vehicles.length === 0) return;
    const id = setInterval(() => {
      const now = Date.now();
      setVehicles((prev) =>
        prev.map((v) => {
          const dest = getPlace(v.destinationId);
          if (!dest) return v;
          const next = stepToward(v.position, dest.position, STEP_METERS);
          const moved = haversineMeters(v.position, next);
          const speedMps = moved / (TICK_MS / 1000);
          const trail = [...v.trail, v.position].slice(-TRAIL_MAX);
          return {
            ...v,
            position: next,
            trail,
            routeCoords: [next, dest.position],
            headingDeg: bearingDeg(next, dest.position),
            speedMps,
            status: speedMps > 1 ? "moving" : "waiting",
            lastUpdated: now,
          };
        }),
      );
    }, TICK_MS);
    return () => clearInterval(id);
  }, [vehicles.length]);

  return useMemo(() => vehicles, [vehicles]);
}
