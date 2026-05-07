import type { CorridorStats } from "@/hooks/useCorridorPulse";
import type { Destination, RouteResult } from "@/lib/types";
import { formatDistance, formatDuration } from "@/lib/osrm";
import { Zap } from "lucide-react";

type Props = {
  stats: CorridorStats;
  destination?: Destination | null;
  matchCount?: number;
  route?: RouteResult | null;
  asDriver?: boolean;
};

export default function CorridorPulse({ stats, destination, matchCount = 0, route, asDriver }: Props) {
  const isLive = stats.freshMs < 8000;
  const activityDot =
    stats.activity === "peak"
      ? "bg-amber-400"
      : stats.activity === "quiet"
        ? "bg-slate-400"
        : "bg-emerald-400";

  const activityText =
    stats.activity === "peak"
      ? "Busy right now"
      : stats.activity === "quiet"
        ? "Quiet — few vehicles"
        : "Active";

  const headline = stats.movingCount > 0
    ? `${stats.movingCount} vehicle${stats.movingCount !== 1 ? "s" : ""} moving on the corridor`
    : `${stats.totalActive} vehicle${stats.totalActive !== 1 ? "s" : ""} active nearby`;

  return (
    <div className="soft-card overflow-hidden">
      <div className="flex items-center gap-3 px-3.5 py-3">
        <span className={`h-2 w-2 shrink-0 rounded-full ${activityDot} ${isLive ? "live-blink" : ""}`} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-[var(--color-ink)] leading-tight">{headline}</div>
          <div className="mt-0.5 text-[11px] text-[var(--color-ink-mute)]">{activityText}</div>
        </div>
        {isLive ? (
          <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 shrink-0">
            <Zap className="h-2.5 w-2.5" />
            LIVE
          </div>
        ) : (
          <div className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] text-[var(--color-ink-mute)] shrink-0">
            syncing
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 border-t border-[var(--color-line)]">
        <div className="flex flex-col items-center justify-center py-2.5 text-center">
          <span className="text-[18px] font-bold text-[var(--color-ink)] leading-none tabular-nums">{stats.silcharBound}</span>
          <span className="mt-1 text-[10px] text-[var(--color-ink-mute)]">→ Silchar</span>
        </div>
        <div className="border-l border-[var(--color-line)] flex flex-col items-center justify-center py-2.5 text-center">
          <span className="text-[18px] font-bold text-[var(--color-ink)] leading-none tabular-nums">{stats.hailakandiBound}</span>
          <span className="mt-1 text-[10px] text-[var(--color-ink-mute)]">→ Hailakandi</span>
        </div>
        <div className="border-l border-[var(--color-line)] flex flex-col items-center justify-center py-2.5 text-center">
          <span className="text-[18px] font-bold text-[var(--color-ink)] leading-none tabular-nums">{stats.waitingCount}</span>
          <span className="mt-1 text-[10px] text-[var(--color-ink-mute)]">waiting</span>
        </div>
      </div>

      {destination ? (
        <div className="flex items-center gap-3 border-t border-[var(--color-line)] px-3.5 py-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
              matchCount > 0
                ? "bg-brand text-white shadow-[0_2px_8px_rgba(37,99,235,0.30)]"
                : "bg-[var(--color-surface-2)] text-[var(--color-ink-mute)]"
            }`}
          >
            {matchCount}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-[var(--color-ink)]">
              {asDriver
                ? matchCount > 0
                  ? `${matchCount} passenger${matchCount !== 1 ? "s" : ""} going your way`
                  : "No passengers on this route yet"
                : matchCount > 0
                  ? `${matchCount} auto${matchCount !== 1 ? "s" : ""} going to ${destination.name}`
                  : `No autos going to ${destination.name} right now`}
            </div>
          </div>
          {route ? (
            <div className="shrink-0 text-right">
              <div className="text-[16px] font-bold text-[var(--color-ink)] leading-none">
                {formatDuration(route.durationSeconds)}
              </div>
              <div className="mt-0.5 text-[10px] text-[var(--color-ink-mute)]">
                {formatDistance(route.distanceMeters)}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
