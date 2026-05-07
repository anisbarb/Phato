import type { LatLng } from "./types";
import { haversineMeters } from "./geolocation";

export function bearingDeg(a: LatLng, b: LatLng): number {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const toDeg = (n: number) => (n * 180) / Math.PI;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

export function bearingDiff(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 540) % 360 - 180);
  return d;
}

const DEG_PER_M_LAT = 1 / 111320;
function degPerMLng(lat: number): number {
  return 1 / (111320 * Math.cos((lat * Math.PI) / 180));
}

function projectToLocalMeters(p: LatLng, origin: LatLng): { x: number; y: number } {
  return {
    x: (p.lng - origin.lng) / degPerMLng(origin.lat),
    y: (p.lat - origin.lat) / DEG_PER_M_LAT,
  };
}

function pointToSegmentMeters(p: LatLng, a: LatLng, b: LatLng): number {
  const origin = a;
  const P = projectToLocalMeters(p, origin);
  const A = { x: 0, y: 0 };
  const B = projectToLocalMeters(b, origin);
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(P.x, P.y);
  let t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = A.x + t * dx;
  const cy = A.y + t * dy;
  return Math.hypot(P.x - cx, P.y - cy);
}

export function pointToPolylineDist(p: LatLng, line: LatLng[]): number {
  if (!line || line.length === 0) return Infinity;
  if (line.length === 1) return haversineMeters(p, line[0]);
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i += 1) {
    const d = pointToSegmentMeters(p, line[i], line[i + 1]);
    if (d < best) best = d;
  }
  return best;
}
