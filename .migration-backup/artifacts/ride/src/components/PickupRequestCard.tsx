import { X, MapPin, Users, Navigation } from "lucide-react";
import type { PickupStatus } from "@/hooks/usePickupRequest";

type Props = {
  driverLabel: string;
  seatsFree: number;
  seatsTotal: number;
  etaMinutes: number;
  destinationName: string;
  status: PickupStatus;
  onRequest: () => void;
  onClose: () => void;
};

export default function PickupRequestCard({
  driverLabel,
  seatsFree,
  seatsTotal,
  etaMinutes,
  destinationName,
  status,
  onRequest,
  onClose,
}: Props) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-[1200] px-3 pb-5">
      <div
        className="rounded-[24px] p-4 shadow-2xl"
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[13px] font-bold text-[var(--color-ink)] leading-tight">{driverLabel}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <Navigation className="h-3 w-3 text-[var(--color-ink-mute)]" />
              <span className="text-[11px] text-[var(--color-ink-soft)]">→ {destinationName}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface-3)]"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5 text-[var(--color-ink-soft)]" />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="flex flex-1 flex-col items-center justify-center rounded-[14px] bg-[var(--color-surface-2)] py-2.5">
            <span className="text-[18px] font-bold text-[var(--color-ink)]">~{etaMinutes}</span>
            <span className="text-[10px] text-[var(--color-ink-mute)] mt-0.5">min away</span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center rounded-[14px] bg-[var(--color-surface-2)] py-2.5">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-[var(--color-ink)]" />
              <span className="text-[18px] font-bold text-[var(--color-ink)]">{seatsFree}</span>
            </div>
            <span className="text-[10px] text-[var(--color-ink-mute)] mt-0.5">seats free / {seatsTotal}</span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center rounded-[14px] bg-[var(--color-surface-2)] py-2.5">
            <MapPin className="h-4 w-4 text-brand" />
            <span className="text-[10px] text-[var(--color-ink-mute)] mt-0.5">On route</span>
          </div>
        </div>

        {status === "idle" || status === "unreachable" ? (
          <>
            {status === "unreachable" && (
              <p className="text-[11px] text-red-500 text-center mb-2">Driver couldn't be reached. Try again.</p>
            )}
            <button
              onClick={onRequest}
              className="w-full rounded-[18px] text-[15px] font-semibold text-white bg-brand shadow-[var(--shadow-brand)]"
              style={{ height: "52px" }}
            >
              Request Pickup
            </button>
          </>
        ) : status === "pending" ? (
          <div
            className="w-full rounded-[18px] flex items-center justify-center gap-2 text-[14px] font-medium text-[var(--color-ink-soft)]"
            style={{ height: "52px", background: "var(--color-surface-2)" }}
          >
            <span className="animate-pulse">Waiting for driver to respond…</span>
          </div>
        ) : status === "accepted" ? (
          <div
            className="w-full rounded-[18px] flex items-center justify-center gap-2 text-[15px] font-semibold text-white"
            style={{ height: "52px", background: "rgb(16,185,129)" }}
          >
            ✓ Driver accepted — on the way!
          </div>
        ) : status === "declined" ? (
          <>
            <p className="text-[11px] text-red-500 text-center mb-2">Driver declined. Try another.</p>
            <button
              onClick={onClose}
              className="w-full rounded-[18px] text-[15px] font-semibold border border-[var(--color-line)] text-[var(--color-ink)] bg-white"
              style={{ height: "52px" }}
            >
              Dismiss
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
