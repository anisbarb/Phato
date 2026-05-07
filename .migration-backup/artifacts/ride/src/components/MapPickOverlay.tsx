import { Check, X, MapPin } from "lucide-react";

type Props = {
  hint?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function MapPickOverlay({ hint, onCancel, onConfirm }: Props) {
  return (
    <>
      <div className="crosshair">
        <svg viewBox="0 0 24 36" width="36" height="36">
          <path d="M12 0c6.6 0 12 5.2 12 11.6 0 8.7-12 22.4-12 22.4S0 20.3 0 11.6C0 5.2 5.4 0 12 0z" fill="#2563eb" />
          <circle cx="12" cy="11.6" r="4.2" fill="#ffffff" />
        </svg>
      </div>

      <div className="absolute top-0 inset-x-0 z-[600] pt-[max(env(safe-area-inset-top),0.5rem)] px-3">
        <div className="glass-pill rounded-full px-4 py-2 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand" />
          <span className="text-xs text-[var(--color-ink)]">{hint ?? "Move map to pick a point"}</span>
        </div>
      </div>

      <div className="absolute z-[600] inset-x-3 bottom-[max(env(safe-area-inset-bottom),0.75rem)] flex gap-2">
        <button onClick={onCancel} className="h-11 px-4 rounded-full glass-pill text-sm font-medium text-[var(--color-ink)] active:bg-[var(--color-surface-2)] flex items-center gap-2">
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button onClick={onConfirm} className="flex-1 h-11 rounded-full text-sm font-semibold bg-brand text-white shadow-sm active:scale-[0.99] flex items-center justify-center gap-2">
          <Check className="w-4 h-4" />
          Use this point
        </button>
      </div>
    </>
  );
}
