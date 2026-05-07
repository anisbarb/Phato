export type LatLng = {
  lat: number;
  lng: number;
};

export type Place = {
  id: string;
  name: string;
  position: LatLng;
};

export type Destination = {
  name: string;
  position: LatLng;
  placeId?: string;
  isCustom?: boolean;
};

export type LiveStatus = "moving" | "waiting" | "offline" | "inactive";

export type Vehicle = {
  id: string;
  label: string;
  position: LatLng;
  /** Last few positions for trail rendering — oldest first */
  trail: LatLng[];
  destinationId: string;
  routeCoords: LatLng[];
  headingDeg: number;
  speedMps: number;
  seatsTotal: number;
  seatsFilled: number;
  status: LiveStatus;
  lastUpdated: number;
};

export type PassengerRequest = {
  id: string;
  position: LatLng;
  destinationId: string;
  routeCoords: LatLng[];
  headingDeg: number;
  status: LiveStatus;
  waitMinutes: number;
  lastUpdated: number;
};

export type RouteResult = {
  coordinates: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
};

export type RadiusMeters = 100 | 500 | 1000 | 2000 | 5000 | 10000;

export const RADIUS_OPTIONS: RadiusMeters[] = [100, 500, 1000, 2000, 5000, 10000];

export type PingPreset =
  | "Wait 1 min"
  | "Wait 2 min"
  | "Wait 3 min"
  | "Wait 5 min"
  | "Wait 10 min"
  | "I'm nearby"
  | "I'm full"
  | "Leaving now"
  | "Reach the road"
  | "At the junction"
  | "Come to the road";

export type Ping = {
  id: string;
  fromId: string;
  toId: string;
  message: PingPreset;
  timestamp: number;
};

export type RouteConfidence = "on" | "near" | "off";

export function isValidLatLng(value: unknown): value is LatLng {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<LatLng>;
  return (
    typeof v.lat === "number" &&
    typeof v.lng === "number" &&
    Number.isFinite(v.lat) &&
    Number.isFinite(v.lng) &&
    v.lat >= -90 &&
    v.lat <= 90 &&
    v.lng >= -180 &&
    v.lng <= 180
  );
}
