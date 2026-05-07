import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

type Props = {
  message: string | null;
  onDone: () => void;
  durationMs?: number;
};

export default function Toast({ message, onDone, durationMs = 2600 }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) { setVisible(false); return; }
    setVisible(true);
    const hide = setTimeout(() => setVisible(false), durationMs - 300);
    const done = setTimeout(onDone, durationMs);
    return () => { clearTimeout(hide); clearTimeout(done); };
  }, [message, onDone, durationMs]);

  if (!message) return null;

  return (
    <div
      className="absolute z-[1100] inset-x-4 flex items-center gap-2.5 rounded-[16px] px-4 py-3"
      style={{
        top: "max(env(safe-area-inset-top, 0px) + 12px, 16px)",
        background: "rgba(15,23,42,0.90)",
        backdropFilter: "blur(14px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.20)",
        transition: "opacity 280ms ease, transform 280ms ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-6px)",
      }}
    >
      <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
      <span className="text-[13px] font-medium text-white">{message}</span>
    </div>
  );
}
