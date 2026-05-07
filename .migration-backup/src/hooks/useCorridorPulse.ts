import { useMemo } from "react";
import { getPlace } from "@/lib/places";
import { timeOfDayActivity } from "@/lib/corridor";
import type { Vehicle } from "@/lib/types";

export type ActivityLevel = "peak" | "active" | "quiet";

export type CorridorStats = {
  activity: ActivityLevel;
  activityLabel: string;
  movingCount: number;
  waitingCount: number;
  silcharBound: number;
  hailakandiBound: number;
  totalActive: number;
  freshMs: number;
};

export function useCorridorPulse(vehicles: Vehicle[]): CorridorStats {
  return useMemo(() => {
    const hour = new Date().getHours();
    const activity = timeOfDayActivity(hour);
    const activityLabel =
      activity === "quiet" ? "Quiet hours" : activity === "peak" ? "Peak hours" : "Active";

    const active = vehicles.filter(
      (v) => v.status !== "offline" && v.status !== "inactive",
    );
    const movingCount = active.filter((v) => v.status === "moving").length;
    const waitingCount = active.filter((v) => v.status === "waiting").length;

    // "Silchar-bound" = heading to a place east of lng 92.68 (roughly east side of corridor)
    const silcharBound = active.filter((v) => {
      const dest = getPlace(v.destinationId);
      return dest && dest.position.lng >= 92.68;
    }).length;
    const hailakandiBound = active.length - silcharBound;

    const freshMs =
      vehicles.length > 0
        ? Date.now() - Math.max(...vehicles.map((v) => v.lastUpdated))
        : 0;

    return {
      activity,
      activityLabel,
      movingCount,
      waitingCount,
      silcharBound,
      hailakandiBound,
      totalActive: active.length,
      freshMs,
    };
  }, [vehicles]);
}
