import { useEffect, useState } from "react";
import { MapPin, X } from "lucide-react";
import type { IncomingPickup } from "@/hooks/useIncomingPickups";
import { nearestPlace } from "@/lib/places";

type Props = {
  pickup: IncomingPickup;
  onAccept: () => void;
  onDecline: () => void;
  timeoutMs?: number;
};

export default function PickupNotification({ pickup, onAccept, onDecline, timeoutMs = 15000 }: Props) {
  const [remaining, setRemaining] = useState(Math.ceil(timeoutMs / 1000));

  useEffect(() => {
    // Browser notification (fires even if tab is minimized)
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const nearPlace = nearestPlace({ lat: pickup.passengerLat, lng: pickup.passengerLng });
        const n = new Notification("🚗 Pickup Request — Phato", {
          body: `Passenger near ${nearPlace.name} wants a ride`,
          tag: `pickup-${pickup.requestId}`,
          icon: "/ride/favicon.ico",
          requireInteraction: true,
        });
        n.onclick = () => { window.focus(); n.close(); };
      } catch {}
    }

    // Vibrate
    try { navigator.vibrate?.([100, 50, 100, 50, 100]); } catch {}
  }, [pickup.requestId]);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const secs = Math.ceil((timeoutMs - (Date.now() - start)) / 1000);
      if (secs <= 0) { clearInterval(interval); onDecline(); return; }
      setRemaining(secs);
    }, 500);
    return () => clearInterval(interval);
  }, [timeoutMs, onDecline]);

  const nearPlace = nearestPlace({ lat: pickup.passengerLat, lng: pickup.passengerLng });

  return (
    <div className="absolute inset-x-0 top-0 z-[1400] px-3 pt-3 pointer-events-none">
      <div
        className="rounded-[22px] p-4 shadow-2xl pointer-events-auto"
        style={{
          background: "rgba(15,23,42,0.96)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.10)",
          animation: "slide-down 0.28s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(37,99,235,0.25)" }}>
              <MapPin className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-white leading-tight">Pickup Request</div>
              <div className="text-[11px] text-white/50">Near {nearPlace.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold tabular-nums" style={{ color: remaining <= 5 ? "rgb(248,113,113)" : "rgba(255,255,255,0.5)" }}>
              {remaining}s
            </span>
            <button onClick={onDecline} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.10)" }} aria-label="Dismiss">
              <X className="h-3.5 w-3.5 text-white/60" />
            </button>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={onDecline} className="flex-1 rounded-[14px] text-[14px] font-semibold text-white/70" style={{ height: "44px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            Decline
          </button>
          <button onClick={onAccept} className="flex-[2] rounded-[14px] text-[14px] font-bold text-white" style={{ height: "44px", background: "rgb(16,185,129)", boxShadow: "0 4px 18px rgba(16,185,129,0.45)" }}>
            Accept Pickup
          </button>
        </div>
      </div>
    </div>
  );
}
