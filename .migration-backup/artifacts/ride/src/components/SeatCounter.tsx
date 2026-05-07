import { Minus, Plus, Users } from "lucide-react";

type Props = {
  total: number;
  filled: number;
  onChange: (filled: number) => void;
};

export default function SeatCounter({ total, filled, onChange }: Props) {
  const free = Math.max(0, total - filled);
  const isFull = free === 0;
  return (
    <div className={`glass-pill rounded-full px-2 py-1 flex items-center gap-1.5 ${isFull ? "ring-1 ring-rose-400" : ""}`}>
      <button onClick={() => onChange(Math.max(0, filled - 1))} className="w-6 h-6 rounded-full bg-[var(--color-surface-2)] active:bg-[var(--color-surface-3)] flex items-center justify-center" aria-label="One passenger left">
        <Minus className="w-3 h-3 text-[var(--color-ink)]" />
      </button>
      <div className="flex items-center gap-1 px-1 min-w-[44px] justify-center">
        <Users className="w-3 h-3 text-[var(--color-ink-soft)]" />
        <span className="text-[11px] font-semibold text-[var(--color-ink)] tabular-nums">{filled}/{total}</span>
      </div>
      <button onClick={() => onChange(Math.min(total, filled + 1))} className="w-6 h-6 rounded-full bg-brand active:bg-brand/85 flex items-center justify-center" aria-label="One passenger got in">
        <Plus className="w-3 h-3 text-white" />
      </button>
    </div>
  );
}
