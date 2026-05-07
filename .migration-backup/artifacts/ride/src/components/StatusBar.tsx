type Props = {
  text: string;
  tone?: "default" | "muted" | "brand";
};

export default function StatusBar({ text, tone = "default" }: Props) {
  const cls =
    tone === "brand"
      ? "text-brand"
      : tone === "muted"
        ? "text-[var(--color-ink-mute)]"
        : "text-[var(--color-ink)]";
  return (
    <div className="glass-pill rounded-full px-3 py-1.5 inline-flex items-center max-w-full">
      <span
        className={`text-[11px] font-medium leading-none truncate ${cls}`}
        title={text}
      >
        {text}
      </span>
    </div>
  );
}
