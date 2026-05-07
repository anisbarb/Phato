import { useCallback, useEffect, useRef, useState } from "react";
import { PHATO_CHANNEL, DRIVERS_LS_KEY } from "./useDriverBroadcast";
import type { DriverLocation } from "./useDriverBroadcast";

export type PickupStatus = "idle" | "pending" | "accepted" | "declined" | "unreachable";

export type PickupRequestState = {
  status: PickupStatus;
  requestId: string | null;
  driverId: string | null;
};

type Opts = {
  passengerId: string;
  onDriverUpdate: (drivers: DriverLocation[]) => void;
  onChatMessage?: (msg: unknown) => void;
};

function readAllDrivers(): Record<string, DriverLocation> {
  try { return JSON.parse(localStorage.getItem(DRIVERS_LS_KEY) ?? "{}"); }
  catch { return {}; }
}

export function usePickupRequest({ passengerId, onDriverUpdate, onChatMessage }: Opts) {
  const [state, setState] = useState<PickupRequestState>({ status: "idle", requestId: null, driverId: null });
  const stateRef = useRef(state);
  stateRef.current = state;
  const chRef = useRef<BroadcastChannel | null>(null);
  const driversRef = useRef<Record<string, DriverLocation>>(readAllDrivers());
  const onDriverUpdateRef = useRef(onDriverUpdate);
  onDriverUpdateRef.current = onDriverUpdate;
  const onChatRef = useRef(onChatMessage);
  onChatRef.current = onChatMessage;

  useEffect(() => {
    // Seed from localStorage immediately
    driversRef.current = readAllDrivers();
    onDriverUpdateRef.current(Object.values(driversRef.current));

    const ch = new BroadcastChannel(PHATO_CHANNEL);
    chRef.current = ch;

    ch.onmessage = ({ data }: MessageEvent) => {
      if (!data || typeof data !== "object") return;
      const m = data as Record<string, unknown>;

      if (m["type"] === "driver_location") {
        const loc = m as unknown as DriverLocation;
        driversRef.current[loc.id] = loc;
        onDriverUpdateRef.current(Object.values(driversRef.current));
      }

      if (m["type"] === "driver_offline") {
        delete driversRef.current[m["id"] as string];
        onDriverUpdateRef.current(Object.values(driversRef.current));
      }

      if (m["type"] === "pickup_response" && (m["requestId"] as string) === stateRef.current.requestId) {
        setState({
          status: (m["accepted"] as boolean) ? "accepted" : "declined",
          requestId: m["requestId"] as string,
          driverId: m["driverId"] as string,
        });
      }

      if (m["type"] === "chat_message" && m["toId"] === passengerId) {
        onChatRef.current?.(data);
      }
    };

    // Poll localStorage every 4s so stale entries get cleaned up
    const poll = setInterval(() => {
      const fresh = readAllDrivers();
      const now = Date.now();
      // Drop drivers older than 10s
      for (const k of Object.keys(fresh)) {
        if (now - fresh[k].updatedAt > 10_000) delete fresh[k];
      }
      driversRef.current = fresh;
      onDriverUpdateRef.current(Object.values(driversRef.current));
    }, 4000);

    return () => { ch.close(); chRef.current = null; clearInterval(poll); };
  }, [passengerId]);

  const sendRequest = useCallback((opts: {
    driverId: string; passengerLat: number; passengerLng: number; passengerDestId: string | null;
  }) => {
    const ch = chRef.current;
    if (!ch) { setState({ status: "unreachable", requestId: null, driverId: opts.driverId }); return; }
    const requestId = "req-" + Math.random().toString(36).slice(2, 10);
    setState({ status: "pending", requestId, driverId: opts.driverId });
    ch.postMessage({
      type: "pickup_request", requestId, passengerId,
      driverId: opts.driverId, passengerLat: opts.passengerLat,
      passengerLng: opts.passengerLng, passengerDestId: opts.passengerDestId,
      sentAt: Date.now(),
    });
  }, [passengerId]);

  const reset = useCallback(() => setState({ status: "idle", requestId: null, driverId: null }), []);

  // expose send for chat (passenger sends chat via same channel)
  const sendChat = useCallback((toId: string, text: string) => {
    if (!text.trim()) return;
    chRef.current?.postMessage({
      type: "chat_message",
      chatId: "chat-" + Math.random().toString(36).slice(2, 10),
      fromId: passengerId, toId, role: "passenger",
      text: text.trim(), sentAt: Date.now(),
    });
  }, [passengerId]);

  return { state, sendRequest, reset, chRef, sendChat };
}
