import { useEffect, useRef } from "react";
import type { LatLng } from "@/lib/types";

type BroadcastOptions = {
  active: boolean;
  driverId: string;
  position: LatLng | null;
  headingDeg: number;
  seatsFree: number;
  seatsTotal: number;
  destinationId: string | null;
  onMessage?: (msg: unknown) => void;
};

export function useLocationBroadcast({
  active,
  driverId,
  position,
  headingDeg,
  seatsFree,
  seatsTotal,
  destinationId,
  onMessage,
}: BroadcastOptions): React.MutableRefObject<WebSocket | null> {
  const wsRef = useRef<WebSocket | null>(null);
  const posRef = useRef({ headingDeg, seatsFree, seatsTotal, destinationId, position });
  posRef.current = { headingDeg, seatsFree, seatsTotal, destinationId, position };
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!active) {
      if (wsRef.current) {
        try { wsRef.current.send(JSON.stringify({ type: "driver_offline", id: driverId })); } catch {}
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${proto}//${window.location.host}/api/ws/location`;
    let ws: WebSocket;
    let closed = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    function connect() {
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "identify_driver", id: driverId }));
        interval = setInterval(() => {
          if (ws.readyState !== 1) return;
          const { position: pos, headingDeg: hd, seatsFree: sf, seatsTotal: st, destinationId: did } = posRef.current;
          if (!pos) return;
          ws.send(JSON.stringify({
            type: "driver_location",
            id: driverId,
            lat: pos.lat,
            lng: pos.lng,
            headingDeg: hd,
            seatsFree: sf,
            seatsTotal: st,
            destinationId: did,
            updatedAt: Date.now(),
          }));
        }, 2000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          onMessageRef.current?.(msg);
        } catch {}
      };

      ws.onclose = () => {
        if (interval) { clearInterval(interval); interval = null; }
        if (!closed) setTimeout(connect, 3000);
      };

      ws.onerror = () => { ws.close(); };
    }

    connect();

    return () => {
      closed = true;
      if (interval) clearInterval(interval);
      if (wsRef.current) {
        try { wsRef.current.send(JSON.stringify({ type: "driver_offline", id: driverId })); } catch {}
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [active, driverId]);

  return wsRef;
}
