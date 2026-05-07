import { formatDistance, formatDuration } from "@/lib/osrm";
import type { RouteResult } from "@/lib/types";

type RouteChoice = RouteResult & {
  id: string;
  label: string;
  accent?: string;
};

type Props = {
  routes: RouteChoice[];
  activeRouteId: string;
  onSelect: (routeId: string) => void;
};

export default function RouteChoices({ routes, activeRouteId, onSelect }: Props) {
  if (routes.length < 2) return null;

  return (
    <div className="glass-pill p-1.5 shadow-[var(--shadow-soft)] flex gap-1 overflow-x-auto no-scrollbar">
      {routes.map((route) => {
        const active = route.id === activeRouteId;
        return (
          <button
            key={route.id}
            onClick={() => onSelect(route.id)}
            className={`min-w-[124px] px-3 py-2 rounded-full text-left transition-colors ${
              active ? "bg-brand text-white" : "bg-transparent text-[var(--color-ink)]"
            }`}
          >
            <div className="text-[11px] font-semibold leading-none">{route.label}</div>
            <div className={`mt-1 text-[10px] ${active ? "text-white/75" : "text-[var(--color-ink-mute)]"}`}>
              {formatDuration(route.durationSeconds)} · {formatDistance(route.distanceMeters)}
            </div>
          </button>
        );
      })}
    </div>
  );
}
