import { memo } from "react";
import { Polyline } from "react-leaflet";
import type { Vehicle } from "@/lib/types";
import { isValidLatLng } from "@/lib/types";

type Props = {
  vehicles: Pick<Vehicle, "id" | "position" | "trail" | "status">[];
};

/**
 * Ghost trail behind each moving vehicle.
 * One stable Polyline per vehicle — key never changes, only positions update.
 * This prevents React-Leaflet from unmounting/remounting on every tick.
 */
function TrailLayer({ vehicles }: Props) {
  return (
    <>
      {vehicles.map((v) => {
        if (v.status !== "moving") return null;
        const pts = [
          ...(v.trail ?? []).filter(isValidLatLng),
          v.position,
        ].filter(isValidLatLng);
        if (pts.length < 2) return null;
        return (
          <Polyline
            key={`trail-${v.id}`}
            positions={pts.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{
              color: "#2563eb",
              weight: 2.5,
              opacity: 0.28,
              lineCap: "round",
              lineJoin: "round",
              interactive: false,
            }}
          />
        );
      })}
    </>
  );
}

export default memo(TrailLayer);
