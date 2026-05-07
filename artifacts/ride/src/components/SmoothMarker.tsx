import { useEffect, useRef } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";
import type { LatLng } from "@/lib/types";
import { isValidLatLng } from "@/lib/types";

type Props = {
  position: LatLng;
  icon: L.DivIcon | L.Icon;
  durationMs?: number;
  interactive?: boolean;
  onClick?: () => void;
};

export default function SmoothMarker({
  position,
  icon,
  durationMs = 600,
  interactive = false,
  onClick,
}: Props) {
  const markerRef = useRef<L.Marker | null>(null);
  const animRef = useRef<number | null>(null);
  const fromRef = useRef<LatLng | null>(null);

  useEffect(() => {
    if (!isValidLatLng(position)) return;
    const marker = markerRef.current;
    if (!marker) return;

    const start = fromRef.current ?? position;
    fromRef.current = position;

    if (start.lat === position.lat && start.lng === position.lng) {
      marker.setLatLng([position.lat, position.lng]);
      return;
    }

    const startTime = performance.now();
    const dLat = position.lat - start.lat;
    const dLng = position.lng - start.lng;

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const lat = start.lat + dLat * t;
      const lng = start.lng + dLng * t;
      marker.setLatLng([lat, lng]);
      if (t < 1) animRef.current = requestAnimationFrame(step);
    };

    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(step);

    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [position, durationMs]);

  if (!isValidLatLng(position)) return null;

  return (
    <Marker
      ref={(ref) => {
        markerRef.current = ref;
      }}
      position={[position.lat, position.lng]}
      icon={icon}
      interactive={interactive}
      keyboard={false}
      eventHandlers={onClick ? { click: () => onClick() } : undefined}
    />
  );
}
