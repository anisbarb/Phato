import { useEffect, useMemo, useRef, useState } from "react";
import { generatePassengers } from "@/lib/mockPassengers";
import type { LatLng, PassengerRequest } from "@/lib/types";

const TICK_MS = 4000;

export function useSimulatedPassengers(
  center: LatLng | null,
  active: boolean,
  count = 10,
): PassengerRequest[] {
  const [requests, setRequests] = useState<PassengerRequest[]>([]);
  const seededRef = useRef<string | null>(null);

  useEffect(() => {
    if (!active || !center) {
      setRequests([]);
      seededRef.current = null;
      return;
    }
    const key = `${center.lat.toFixed(2)}_${center.lng.toFixed(2)}`;
    if (seededRef.current === key) return;
    seededRef.current = key;
    setRequests(generatePassengers(center, count));
  }, [active, center, count]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      const now = Date.now();
      setRequests((prev) =>
        prev.map((p) => ({ ...p, waitMinutes: p.waitMinutes + 1, lastUpdated: now })),
      );
    }, TICK_MS);
    return () => clearInterval(id);
  }, [active]);

  return useMemo(() => requests, [requests]);
}
