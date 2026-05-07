import type { LatLng } from "./types";

/**
 * NH306 corridor waypoints: Hailakandi ↔ Silchar
 * Approximate road trace, densified for smooth rendering.
 */
export const NH306: LatLng[] = [
  { lat: 24.6833, lng: 92.5667 }, // Hailakandi
  { lat: 24.6905, lng: 92.5736 },
  { lat: 24.6980, lng: 92.5850 },
  { lat: 24.7050, lng: 92.5960 },
  { lat: 24.7130, lng: 92.6080 },
  { lat: 24.7200, lng: 92.6185 },
  { lat: 24.7280, lng: 92.6280 },
  { lat: 24.7360, lng: 92.6390 },
  { lat: 24.7430, lng: 92.6480 },
  { lat: 24.7510, lng: 92.6595 },
  { lat: 24.7590, lng: 92.6710 },
  { lat: 24.7660, lng: 92.6820 },
  { lat: 24.7740, lng: 92.6930 },
  { lat: 24.7810, lng: 92.7050 },
  { lat: 24.7880, lng: 92.7160 },
  { lat: 24.7945, lng: 92.7265 },
  { lat: 24.8000, lng: 92.7370 },
  { lat: 24.8070, lng: 92.7465 },
  { lat: 24.8150, lng: 92.7550 },
  { lat: 24.8240, lng: 92.7670 },
  { lat: 24.8333, lng: 92.7789 }, // Silchar
];

/** Badarpur spur branching off NH306 near Silchar */
export const BADARPUR_SPUR: LatLng[] = [
  { lat: 24.8333, lng: 92.7789 }, // Silchar
  { lat: 24.8380, lng: 92.7640 },
  { lat: 24.8430, lng: 92.7480 },
  { lat: 24.8470, lng: 92.7315 },
  { lat: 24.8520, lng: 92.7150 },
  { lat: 24.8555, lng: 92.6975 },
  { lat: 24.8580, lng: 92.6800 },
  { lat: 24.8605, lng: 92.6640 },
  { lat: 24.8630, lng: 92.6480 },
  { lat: 24.8636, lng: 92.5969 }, // Badarpur
];

/** Sonai spur east of Silchar */
export const SONAI_SPUR: LatLng[] = [
  { lat: 24.8333, lng: 92.7789 }, // Silchar
  { lat: 24.8250, lng: 92.7865 },
  { lat: 24.8165, lng: 92.7930 },
  { lat: 24.8080, lng: 92.8000 },
  { lat: 24.7960, lng: 92.8090 },
  { lat: 24.7850, lng: 92.8180 },
  { lat: 24.7725, lng: 92.8260 },
  { lat: 24.7600, lng: 92.8320 },
  { lat: 24.7420, lng: 92.8350 },
  { lat: 24.7250, lng: 92.8367 }, // Sonai
];

export const ALL_CORRIDORS = [NH306, BADARPUR_SPUR, SONAI_SPUR] as const;

/** Key waypoint labels shown on map */
export const CORRIDOR_LABELS: { name: string; pos: LatLng; anchor: "left" | "right" }[] = [
  { name: "Hailakandi", pos: { lat: 24.6833, lng: 92.5667 }, anchor: "left" },
  { name: "Algapur", pos: { lat: 24.7430, lng: 92.6480 }, anchor: "left" },
  { name: "Dholai", pos: { lat: 24.7600, lng: 92.6750 }, anchor: "right" },
  { name: "Udharbond", pos: { lat: 24.7950, lng: 92.7600 }, anchor: "left" },
  { name: "Silchar", pos: { lat: 24.8333, lng: 92.7789 }, anchor: "right" },
  { name: "Badarpur", pos: { lat: 24.8636, lng: 92.5969 }, anchor: "left" },
  { name: "Sonai", pos: { lat: 24.725, lng: 92.8367 }, anchor: "right" },
];

/** Returns time-of-day label for this hour */
export function timeOfDayActivity(hour: number): "peak" | "active" | "quiet" {
  if (hour >= 22 || hour <= 4) return "quiet";
  if ((hour >= 6 && hour <= 9) || (hour >= 15 && hour <= 19)) return "peak";
  return "active";
}
