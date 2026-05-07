import type { RadiusMeters } from "@/lib/types";
import { RADIUS_OPTIONS } from "@/lib/types";

type Props = {
  value: RadiusMeters;
  autoExpanded: boolean;
  onChange: (value: RadiusMeters) => void;
};

function label(m: RadiusMeters): string {
  return m < 1000 ? `${m}m` : `${m / 1000}km`;
}

export default function RadiusPills({ value, autoExpanded, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 overflow-x-auto no-scrollbar">
        <div className="flex gap-1.5 w-max">
          {RADIUS_OPTIONS.map((opt) => {
            const active = opt === value;
            return (
              <button
                key={opt}
                onClick={() => onChange(opt)}
                className={`h-7 px-3 rounded-full text-[11px] font-medium transition border ${
                  active
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-[var(--color-ink-soft)] border-[var(--color-line)] active:bg-[var(--color-surface-2)]"
                }`}
              >
                {label(opt)}
              </button>
            );
          })}
        </div>
      </div>
      {autoExpanded ? (
        <span className="text-[10px] text-brand whitespace-nowrap">expanded</span>
      ) : null}
    </div>
  );
}
