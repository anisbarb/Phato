import { memo } from "react";
import { Circle } from "react-leaflet";
import type { PassengerRequest } from "@/lib/types";
import { isValidLatLng } from "@/lib/types";

type Props = {
  passengers: Pick<PassengerRequest, "id" | "position" | "status">[];
};

/**
 * Soft translucent circles where passengers are waiting.
 * Overlap naturally to show demand density.
 * Memoized — only re-renders when the passenger list changes.
 */
function DemandHalos({ passengers }: Props) {
  const waiting = passengers.filter(
    (p) => p.status === "waiting" && isValidLatLng(p.position),
  );
  if (waiting.length === 0) return null;
  return (
    <>
      {waiting.map((p) => (
        <Circle
          key={`halo-${p.id}`}
          center={[p.position.lat, p.position.lng]}
          radius={480}
          pathOptions={{
            fillColor: "#2563eb",
            fillOpacity: 0.042,
            color: "transparent",
            weight: 0,
            interactive: false,
          }}
        />
      ))}
    </>
  );
}

export default memo(DemandHalos);
