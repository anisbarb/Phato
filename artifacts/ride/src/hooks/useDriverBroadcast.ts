import { useEffect, useRef, useCallback } from "react";
import type { LatLng } from "@/lib/types";

export const PHATO_CHANNEL = "phato_v1";
export const DRIVERS_LS_KEY = "phato_online_drivers";

export type DriverLocation = {
  id: string;
  lat: number;
  lng: number;
  headingDeg: number;
  seatsFree: number;
  seatsTotal: number;
  destinationId: string | null;
  updatedAt: number;
};

type Opts = {
  active: boolean;
  driverId: string;
  position: LatLng | null;
  headingDeg: number;
  seatsFree: number;
  seatsTotal: number;
  destinationId: string | null;
  onMessage?: (msg: unknown) => void;
};

function readDriversMap(): Record<string, DriverLocation> {
  try { return JSON.parse(localStorage.getItem(DRIVERS_LS_KEY) ?? "{}"); }
  catch { return {}; }
}
function writeDriversMap(m: Record<string, DriverLocation>) {
  try { localStorage.setItem(DRIVERS_LS_KEY, JSON.stringify(m)); } catch {}
}

export function useDriverBroadcast({
  active, driverId, position, headingDeg, seatsFree, seatsTotal, destinationId, onMessage,
}: Opts) {
  const chRef = useRef<BroadcastChannel | null>(null);
  const posRef = useRef({ position, headingDeg, seatsFree, seatsTotal, destinationId });
  posRef.current = { position, headingDeg, seatsFree, seatsTotal, destinationId };
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  // Open channel once
  useEffect(() => {
    const ch = new BroadcastChannel(PHATO_CHANNEL);
    chRef.current = ch;
    ch.onmessage = ({ data }: MessageEvent) => {
      if (!data || typeof data !== "object") return;
      const m = data as Record<string, unknown>;
      // Only care about messages directed at this driver
      if (
        m["type"] === "pickup_request" && m["driverId"] === driverId ||
        m["type"] === "chat_message"   && m["toId"]    === driverId
      ) {
        onMessageRef.current?.(data);
      }
    };
    return () => { ch.close(); chRef.current = null; };
  }, [driverId]);

  // Broadcast position when active
  useEffect(() => {
    if (!active) {
      const map = readDriversMap();
      delete map[driverId];
      writeDriversMap(map);
      chRef.current?.postMessage({ type: "driver_offline", id: driverId });
      return;
    }

    const tick = () => {
      const { position: pos, headingDeg: hd, seatsFree: sf, seatsTotal: st, destinationId: did } = posRef.current;
      if (!pos) return;
      const loc: DriverLocation = {
        id: driverId, lat: pos.lat, lng: pos.lng,
        headingDeg: hd, seatsFree: sf, seatsTotal: st,
        destinationId: did, updatedAt: Date.now(),
      };
      const map = readDriversMap();
      map[driverId] = loc;
      writeDriversMap(map);
      chRef.current?.postMessage({ type: "driver_location", ...loc });
    };

    tick(); // immediate first tick
    const id = setInterval(tick, 2000);
    return () => {
      clearInterval(id);
      const map = readDriversMap();
      delete map[driverId];
      writeDriversMap(map);
      chRef.current?.postMessage({ type: "driver_offline", id: driverId });
    };
  }, [active, driverId]);

  // Expose send so driver can post pickup_response / chat_message
  const send = useCallback((msg: object) => {
    chRef.current?.postMessage(msg);
  }, []);

  return { send };
}
