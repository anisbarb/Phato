import { useMemo, useState } from "react";
import { MapPin, X, Crosshair, Search } from "lucide-react";
import { PLACES } from "@/lib/places";
import { haversineMeters } from "@/lib/geolocation";
import { formatDistance } from "@/lib/osrm";
import type { LatLng } from "@/lib/types";
import { isValidLatLng } from "@/lib/types";

type Props = {
  open: boolean;
  origin: LatLng | null;
  selectedPlaceId?: string | null;
  title?: string;
  onClose: () => void;
  onSelectPlace: (placeId: string) => void;
  onPickOnMap: () => void;
};

export default function DestinationPicker({
  open,
  origin,
  selectedPlaceId,
  title = "Choose destination",
  onClose,
  onSelectPlace,
  onPickOnMap,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? PLACES.filter((p) => p.name.toLowerCase().includes(q)) : PLACES;
    if (!origin || !isValidLatLng(origin)) return list;
    return [...list].sort((a, b) => haversineMeters(origin, a.position) - haversineMeters(origin, b.position));
  }, [origin, query]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[1000] bg-black/35 backdrop-blur-[2px]" onClick={onClose}>
      <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] border-t border-[var(--color-line)] bg-white shadow-xl pb-[max(env(safe-area-inset-bottom),1rem)]" onClick={(e) => e.stopPropagation()}>
        <div className="pt-2 pb-1">
          <div className="mx-auto h-1 w-10 rounded-full bg-[var(--color-line)]" />
        </div>

        <div className="flex items-center justify-between px-4 pb-2">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">{title}</h2>
            <p className="text-[11px] text-[var(--color-ink-mute)]">Search first, or drop a pin.</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-surface-2)]" aria-label="Close">
            <X className="h-4 w-4 text-[var(--color-ink-soft)]" />
          </button>
        </div>

        <div className="px-4 pb-2">
          <div className="flex h-11 items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3">
            <Search className="h-4 w-4 text-[var(--color-ink-mute)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search villages or towns"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-ink-mute)]"
            />
          </div>
        </div>

        <div className="px-4 pb-2">
          <button onClick={onPickOnMap} className="flex w-full items-center gap-3 rounded-[18px] border border-blue-500/15 bg-brand px-3 py-3 text-white shadow-[var(--shadow-brand)] active:bg-brand/90">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <Crosshair className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="text-sm font-semibold">Pick exact spot on map</div>
              <div className="text-[11px] text-white/75">Village, junction, roadside pickup</div>
            </div>
          </button>
        </div>

        <ul className="max-h-[44vh] space-y-0.5 overflow-y-auto px-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
          {filtered.length === 0 ? (
            <li className="px-3 py-4 text-center text-xs text-[var(--color-ink-mute)]">No matches. Try map pickup.</li>
          ) : null}
          {filtered.map((p) => {
            const dist = origin && isValidLatLng(origin) ? haversineMeters(origin, p.position) : null;
            const active = selectedPlaceId === p.id;
            return (
              <li key={p.id}>
                <button onClick={() => onSelectPlace(p.id)} className={`flex w-full items-center gap-3 rounded-[16px] px-3 py-2.5 text-left ${active ? "bg-[var(--color-surface-2)]" : "active:bg-[var(--color-surface-2)]"}`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${active ? "bg-brand text-white" : "bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]"}`}>
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-[var(--color-ink)]">{p.name}</div>
                    <div className="text-[11px] text-[var(--color-ink-mute)]">{dist !== null ? formatDistance(dist) : "Set location"}</div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
