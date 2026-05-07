import type { LatLng } from "./types";

export const DEFAULT_CENTER: LatLng = { lat: 24.8333, lng: 92.7789 };

export type GeoErrorCode = "unsupported" | "denied" | "unavailable" | "timeout";

export type GeoError = {
  code: GeoErrorCode;
  message: string;
};

function mapPositionError(err: GeolocationPositionError): GeoError {
  if (err.code === err.PERMISSION_DENIED) {
    return { code: "denied", message: "Location permission denied." };
  }
  if (err.code === err.POSITION_UNAVAILABLE) {
    return { code: "unavailable", message: "Location unavailable." };
  }
  if (err.code === err.TIMEOUT) {
    return { code: "timeout", message: "Location request timed out." };
  }
  return { code: "unavailable", message: "Could not retrieve location." };
}

export function watchPosition(
  onPosition: (pos: LatLng) => void,
  onError: (err: GeoError) => void,
): () => void {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    onError({ code: "unsupported", message: "Geolocation is not supported." });
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    (pos) =>
      onPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    (err) => onError(mapPositionError(err)),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}

const EARTH_RADIUS_M = 6371000;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + sinDLng * sinDLng * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_M * c;
}

export function stepToward(from: LatLng, to: LatLng, meters: number): LatLng {
  const total = haversineMeters(from, to);
  if (total <= meters || total === 0) return to;
  const t = meters / total;
  return {
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  };
}
