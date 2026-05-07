import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

function AutoIcon() {
  return (
    <svg viewBox="0 0 84 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[104px] drop-shadow-[0_16px_28px_rgba(15,23,42,0.14)] animate-[floaty_5s_ease-in-out_infinite]">
      <path d="M14 22 Q14 10 22 8 L52 8 Q60 8 62 14 L64 22 Z" fill="rgba(191,219,254,0.34)" stroke="rgba(37,99,235,0.42)" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M12 22 L12 36 L66 36 L66 22 Z" fill="rgba(255,255,255,0.78)" stroke="rgba(37,99,235,0.22)" strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="22" y1="22" x2="22" y2="36" stroke="rgba(37,99,235,0.14)" strokeWidth="1" />
      <line x1="32" y1="22" x2="32" y2="36" stroke="rgba(37,99,235,0.14)" strokeWidth="1" />
      <line x1="42" y1="22" x2="42" y2="36" stroke="rgba(37,99,235,0.14)" strokeWidth="1" />
      <line x1="52" y1="22" x2="52" y2="36" stroke="rgba(37,99,235,0.14)" strokeWidth="1" />
      <path d="M66 22 L66 36 L74 36 L76 28 Q76 22 70 22 Z" fill="rgba(59,130,246,0.20)" stroke="rgba(37,99,235,0.40)" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="74" cy="28" r="2.2" fill="rgba(191,219,254,0.95)" />
      <circle cx="22" cy="40" r="6" fill="rgba(15,23,42,0.78)" stroke="rgba(255,255,255,0.72)" strokeWidth="1.2" />
      <circle cx="56" cy="40" r="6" fill="rgba(15,23,42,0.78)" stroke="rgba(255,255,255,0.72)" strokeWidth="1.2" />
      <circle cx="72" cy="40" r="4.5" fill="rgba(15,23,42,0.78)" stroke="rgba(255,255,255,0.72)" strokeWidth="1.2" />
      <circle cx="68" cy="18" r="3" fill="rgba(255,255,255,0.62)" stroke="rgba(37,99,235,0.18)" strokeWidth="1" />
    </svg>
  );
}

function PassengerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SteeringIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9V3" />
      <path d="M6.35 15.35l-4.6 2.65" />
      <path d="M17.65 15.35l4.6 2.65" />
    </svg>
  );
}

export default function RoleSelect() {
  return (
    <div className="relative h-full w-full overflow-hidden select-none bg-[linear-gradient(180deg,#eff6ff_0%,#dbeafe_45%,#eff6ff_100%)]">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_18%,rgba(147,197,253,0.20)_0%,transparent_28%),radial-gradient(circle_at_82%_22%,rgba(37,99,235,0.14)_0%,transparent_24%),radial-gradient(circle_at_50%_72%,rgba(96,165,250,0.12)_0%,transparent_30%)]" />
      <div className="absolute inset-0 pointer-events-none opacity-70 bg-[linear-gradient(135deg,rgba(255,255,255,0.28)_0%,transparent_22%,transparent_78%,rgba(255,255,255,0.20)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-44 pointer-events-none bg-[linear-gradient(180deg,rgba(239,246,255,0.96)_0%,rgba(239,246,255,0.42)_100%)]" />

      <div className="absolute inset-x-0 flex justify-center z-10" style={{ top: "max(env(safe-area-inset-top, 0px) + 14px, 18px)" }}>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-white/78 border border-blue-200/60 backdrop-blur-md shadow-[0_1px_10px_rgba(16,33,63,0.06)] animate-[fade-in_500ms_ease_both]">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 live-blink" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1d4ed8]">Hailakandi · Silchar</span>
        </div>
      </div>

      <div className="absolute inset-x-0 top-[12%] flex justify-center animate-[fade-in_700ms_ease_both] map-zoom-feel">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-blue-300/22 blur-3xl" style={{ width: 140, height: 140, left: -18, top: -12 }} />
          <AutoIcon />
        </div>
      </div>

      <div className="absolute inset-x-0 top-[32%] flex flex-col items-center px-6 animate-[fade-in_760ms_ease_both] map-zoom-feel">
        <h1 className="font-bold leading-none tracking-[-0.08em] text-center text-[#10213f]" style={{ fontSize: "clamp(46px, 12vw, 72px)" }}>Phato.</h1>
        <p className="mt-3 text-center text-[14px] font-medium leading-relaxed text-[#1d4ed8] max-w-[300px]">Who is already going my way right now?</p>
        <p className="mt-1 text-center text-[12px] leading-relaxed text-[#3b82f6]/80 max-w-[250px]">See moving autos, join the right one, and make the invisible visible.</p>
      </div>

      <div className="absolute inset-x-0 top-[48%] flex justify-center pointer-events-none">
        <div className="h-20 w-[82%] max-w-[420px] rounded-[50%] bg-[radial-gradient(circle,rgba(59,130,246,0.18)_0%,rgba(59,130,246,0.06)_45%,transparent_72%)] animate-[pulse_5s_ease-in-out_infinite]" />
      </div>

      <div className="absolute inset-x-0 bottom-0 px-4 pb-[max(env(safe-area-inset-bottom,0px)+18px,24px)] pt-6 animate-[fade-in_900ms_ease_both] map-zoom-feel">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-blue-300/25" />
        <div className="space-y-2.5">
          <Link href="/passenger" className="group flex items-center gap-4 rounded-[24px] px-4 py-4 w-full bg-[linear-gradient(135deg,#f8fbff_0%,#dbeafe_100%)] border border-blue-200/70 shadow-[0_10px_30px_rgba(37,99,235,0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(37,99,235,0.16)]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-blue-100/80 text-blue-600">
              <PassengerIcon />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-[#10213f]">I need a ride</div>
              <div className="mt-0.5 text-[12px] text-[#1d4ed8]/75">See autos going your direction</div>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100/80 text-blue-500">
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          <Link href="/driver" className="group flex items-center gap-4 rounded-[24px] px-4 py-4 w-full bg-[linear-gradient(135deg,#f8fbff_0%,#eff6ff_100%)] border border-blue-200/60 shadow-[0_8px_22px_rgba(16,33,63,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-blue-100/80 text-blue-600">
              <SteeringIcon />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-[#10213f]">I'm driving</div>
              <div className="mt-0.5 text-[12px] text-slate-500">Show your route, pick up passengers</div>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100/80 text-blue-500">
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </div>

        <p className="mt-4 text-center text-[11px] text-[#1d4ed8]/35">Free · simple · built for Assam</p>
      </div>
    </div>
  );
}
