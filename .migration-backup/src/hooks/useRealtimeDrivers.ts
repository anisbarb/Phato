import { useEffect, useRef, useState } from "react";

export type RealtimeDriver = {
  id: string;
  lat: number;
  lng: number;
  headingDeg: number;
  seatsFree: number;
  seatsTotal: number;
  destinationId: string | null;
  updatedAt: number;
};

export function useRealtimeDrivers(): RealtimeDriver[] {
  const [drivers, setDrivers] = useState<RealtimeDriver[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${proto}//${window.location.host}/api/ws/location`;
    let closed = false;

    function connect() {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "subscribe_passengers" }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg.type === "driver_update") {
            setDrivers(msg.drivers as RealtimeDriver[]);
          }
        } catch {}
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!closed) setTimeout(connect, 3000);
      };

      ws.onerror = () => { ws.close(); };
    }

    connect();

    return () => {
      closed = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  return drivers;
}
