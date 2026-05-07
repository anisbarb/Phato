import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import type { ChatMessage } from "@/hooks/useChat";

const DRIVER_PRESETS = [
  "1 min", "2 min", "3 min", "5 min", "10 min",
  "On road", "At junction", "Almost there",
  "Reached pickup", "Running late", "Stuck in traffic",
  "Coming your way", "Please be ready",
];

const PASSENGER_PRESETS = [
  "1 min", "2 min", "3 min", "5 min", "10 min",
  "I'm outside", "At the gate", "Almost ready",
  "Please wait", "On my way down", "Which side?",
  "Can you come closer?", "Thank you",
];

type Props = {
  role: "driver" | "passenger";
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
};

export default function ChatTray({ role, messages, onSend, onClose }: Props) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const presets = role === "driver" ? DRIVER_PRESETS : PASSENGER_PRESETS;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (msg: string) => {
    if (!msg.trim()) return;
    onSend(msg.trim());
    setText("");
  };

  return (
    <div
      className="absolute inset-0 z-[1300] flex flex-col"
      style={{ background: "rgba(248,250,252,1)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-line)]"
        style={{
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(16px)",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
        }}
      >
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-2)]"
          aria-label="Close chat"
        >
          <ArrowLeft className="h-4 w-4 text-[var(--color-ink)]" />
        </button>
        <span className="text-[15px] font-bold text-[var(--color-ink)]">
          {role === "driver" ? "Message Passenger" : "Message Driver"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[13px] text-[var(--color-ink-mute)] text-center">
              No messages yet.<br />Use the quick replies below.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.chatId}
            className={`max-w-[78%] rounded-[16px] px-3.5 py-2.5 text-[13px] leading-relaxed ${
              m.fromSelf
                ? "self-end bg-brand text-white rounded-br-[4px]"
                : "self-start bg-white text-[var(--color-ink)] border border-[var(--color-line)] rounded-bl-[4px] shadow-sm"
            }`}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="px-3 pt-2 pb-1">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              className="shrink-0 rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--color-ink)] active:bg-[var(--color-surface-2)]"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Text input */}
      <div
        className="flex items-center gap-2 px-3 pb-3 pt-2 border-t border-[var(--color-line)] bg-white"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <input
          className="flex-1 h-11 rounded-[18px] bg-[var(--color-surface-2)] px-4 text-[14px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-mute)]"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(text); }}
        />
        <button
          onClick={() => handleSend(text)}
          disabled={!text.trim()}
          className="h-11 w-11 flex items-center justify-center rounded-full bg-brand disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}
