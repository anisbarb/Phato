import { useCallback, useEffect, useRef, useState } from "react";

export type PickupStatus = "idle" | "pending" | "accepted" | "declined" | "unreachable";

export type PickupRequestState = {
  status: PickupStatus;
  requestId: string | null;
  driverId: string | null;
};

type Opts = {
  passengerId: string;
  onDriverUpdate: (drivers: unknown[]) => void;
};

export function usePickupRequest({ passengerId, onDriverUpdate }: Opts) {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<PickupRequestState>({
    status: "idle",
    requestId: null,
    driverId: null,
  });
  const stateRef = useRef(state);
  stateRef.current = state;
  const onDriverUpdateRef = useRef(onDriverUpdate);
  onDriverUpdateRef.current = onDriverUpdate;

  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${proto}//${window.location.host}/api/ws/location`;
    let closed = false;

    function connect() {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "subscribe_passengers", passengerId }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as Record<string, unknown>;
          if (msg["type"] === "driver_update") {
            onDriverUpdateRef.current(msg["drivers"] as unknown[]);
          } else if (msg["type"] === "pickup_response") {
            if (msg["requestId"] === stateRef.current.requestId) {
              setState({
                status: msg["accepted"] ? "accepted" : "declined",
                requestId: msg["requestId"] as string,
                driverId: msg["driverId"] as string,
              });
            }
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
  }, [passengerId]);

  const sendRequest = useCallback((opts: {
    driverId: string;
    passengerLat: number;
    passengerLng: number;
    passengerDestId: string | null;
  }) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1) {
      setState({ status: "unreachable", requestId: null, driverId: opts.driverId });
      return;
    }
    const requestId = "req-" + Math.random().toString(36).slice(2, 10);
    setState({ status: "pending", requestId, driverId: opts.driverId });
    ws.send(JSON.stringify({
      type: "pickup_request",
      requestId,
      passengerId,
      driverId: opts.driverId,
      passengerLat: opts.passengerLat,
      passengerLng: opts.passengerLng,
      passengerDestId: opts.passengerDestId,
      sentAt: Date.now(),
    }));
  }, [passengerId]);

  const reset = useCallback(() => {
    setState({ status: "idle", requestId: null, driverId: null });
  }, []);

  return { state, sendRequest, reset, wsRef };
}
