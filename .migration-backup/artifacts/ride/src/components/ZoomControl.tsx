import { Plus, Minus } from "lucide-react";
import L from "leaflet";

type Props = {
  map: L.Map | null;
  onRecenter?: () => void;
  bottomOffset?: string;
};

export default function ZoomControl({ map, onRecenter, bottomOffset = "16px" }: Props) {
  return (
    <div className="absolute right-4 z-[9999] flex flex-col items-center gap-1 map-controls" style={{ bottom: bottomOffset }}>
      <button
        onClick={() => map?.zoomIn(1)}
        className="w-11 h-11 flex items-center justify-center rounded-2xl glass-pill active:bg-[var(--color-surface-2)] shadow-sm"
        aria-label="Zoom in"
      >
        <Plus className="w-4 h-4 text-[var(--color-ink)]" />
      </button>
      <button
        onClick={() => map?.zoomOut(1)}
        className="w-11 h-11 flex items-center justify-center rounded-2xl glass-pill active:bg-[var(--color-surface-2)] shadow-sm"
        aria-label="Zoom out"
      >
        <Minus className="w-4 h-4 text-[var(--color-ink)]" />
      </button>
      <button
        onClick={onRecenter}
        className="w-11 h-11 flex items-center justify-center rounded-2xl glass-pill active:bg-[var(--color-surface-2)] shadow-sm"
        aria-label="Recenter map"
      >
        <LocateFixedIcon />
      </button>
    </div>
  );
}

function LocateFixedIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 text-[var(--color-ink)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
    </svg>
  );
}
