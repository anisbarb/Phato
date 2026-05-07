import { MessageCircle, X } from "lucide-react";
import type { PingPreset } from "@/lib/types";

const PASSENGER_PRESETS: { label: string; value: PingPreset }[] = [
  { label: "Leaving now", value: "Leaving now" },
  { label: "I'm nearby", value: "I'm nearby" },
  { label: "At the junction", value: "At the junction" },
  { label: "Come to the road", value: "Come to the road" },
  { label: "Wait 2 min", value: "Wait 2 min" },
  { label: "Wait 5 min", value: "Wait 5 min" },
  { label: "Reach the road", value: "Reach the road" },
];

const DRIVER_PRESETS: { label: string; value: PingPreset }[] = [
  { label: "I'm nearby", value: "I'm nearby" },
  { label: "Wait 1 min", value: "Wait 1 min" },
  { label: "Wait 2 min", value: "Wait 2 min" },
  { label: "Wait 3 min", value: "Wait 3 min" },
  { label: "Reach the road", value: "Reach the road" },
  { label: "At the junction", value: "At the junction" },
  { label: "I'm full", value: "I'm full" },
  { label: "Leaving now", value: "Leaving now" },
];

type Props = {
  open: boolean;
  targetLabel: string;
  asDriver?: boolean;
  onClose: () => void;
  onSend: (preset: PingPreset) => void;
};

export default function PingSheet({ open, targetLabel, asDriver, onClose, onSend }: Props) {
  if (!open) return null;
  const presets = asDriver ? DRIVER_PRESETS : PASSENGER_PRESETS;

  return (
    <div className="absolute inset-0 z-[1000] bg-black/35 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white"
        style={{
          borderTop: "1px solid var(--color-line)",
          boxShadow: "0 -8px 32px rgba(15,23,42,0.10)",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px) + 12px, 20px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="pt-2.5 pb-0">
          <div className="mx-auto h-1 w-10 rounded-full bg-[var(--color-line)]" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10">
            <MessageCircle className="h-4 w-4 text-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wider text-[var(--color-ink-mute)]">Quick message to</div>
            <div className="mt-0.5 truncate text-sm font-semibold text-[var(--color-ink)]">{targetLabel}</div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-2)]"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-[var(--color-ink-soft)]" />
          </button>
        </div>

        <p className="px-4 pb-2 text-[12px] text-[var(--color-ink-mute)]">
          One tap sends this message instantly.
        </p>

        {/* Presets grid */}
        <div className="grid grid-cols-2 gap-2 px-3 pb-2">
          {presets.map((p) => (
            <button
              key={p.value}
              onClick={() => onSend(p.value)}
              className="h-12 rounded-[14px] border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 text-sm font-medium text-[var(--color-ink)] active:bg-[var(--color-surface-3)]"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
