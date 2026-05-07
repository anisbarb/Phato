import { useState } from "react";
import { Check } from "lucide-react";
import SlidePanel from "@/components/common/SlidePanel";

const MAP_STYLE_KEY = "phato_map_style";
const POLYLINE_STYLE_KEY = "phato_polyline_style";

const MAP_STYLES = [
  { id: "standard",  label: "Standard",  preview: "🗺️" },
  { id: "satellite", label: "Satellite", preview: "🛰️" },
  { id: "dark",      label: "Dark",      preview: "🌙" },
  { id: "terrain",   label: "Terrain",   preview: "⛰️" },
];

const POLYLINE_STYLES = [
  { id: "apple",   label: "Apple",   desc: "Clean blue, 5px" },
  { id: "uber",    label: "Uber",    desc: "Dark bold, 6px" },
  { id: "glow",    label: "Glow",    desc: "Neon blue glow" },
  { id: "minimal", label: "Minimal", desc: "Thin 2px gray" },
];

function PolylineSwatch({ styleId }: { styleId: string }) {
  const props = { x1: 0, y1: 8, x2: 48, y2: 8 };
  if (styleId === "apple")   return <svg width={48} height={16}><line {...props} stroke="#2563eb" strokeWidth={4} strokeLinecap="round" /></svg>;
  if (styleId === "uber")    return <svg width={48} height={16}><line {...props} stroke="#0f172a" strokeWidth={6} strokeLinecap="round" /></svg>;
  if (styleId === "glow")    return <svg width={48} height={16}><line {...props} stroke="#60a5fa" strokeWidth={4} strokeLinecap="round" style={{ filter: "drop-shadow(0 0 3px #3b82f6)" }} /></svg>;
  if (styleId === "minimal") return <svg width={48} height={16}><line {...props} stroke="#94a3b8" strokeWidth={2} strokeLinecap="round" /></svg>;
  return null;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsSheet({ open, onClose }: Props) {
  const [mapStyle, setMapStyle] = useState(() => localStorage.getItem(MAP_STYLE_KEY) ?? "standard");
  const [polylineStyle, setPolylineStyle] = useState(() => localStorage.getItem(POLYLINE_STYLE_KEY) ?? "apple");

  function selectMapStyle(id: string) {
    setMapStyle(id);
    localStorage.setItem(MAP_STYLE_KEY, id);
    window.dispatchEvent(new CustomEvent("phato_map_style_changed", { detail: id }));
  }

  function selectPolylineStyle(id: string) {
    setPolylineStyle(id);
    localStorage.setItem(POLYLINE_STYLE_KEY, id);
    window.dispatchEvent(new CustomEvent("phato_polyline_style_changed", { detail: id }));
  }

  return (
    <SlidePanel open={open} onClose={onClose} title="Settings">
      <div className="px-5 py-5 flex flex-col gap-7 pb-12">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-3">Map Style</p>
          <div className="grid grid-cols-2 gap-2">
            {MAP_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => selectMapStyle(style.id)}
                className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all active:scale-[0.97] ${
                  mapStyle === style.id
                    ? "border-[#2563eb] bg-blue-50"
                    : "border-slate-100 bg-white active:bg-slate-50"
                }`}
              >
                <span className="text-[24px] leading-none">{style.preview}</span>
                <span className={`text-[13px] font-medium ${mapStyle === style.id ? "text-[#2563eb]" : "text-[#0f172a]"}`}>
                  {style.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-3">Route Style</p>
          <div className="flex flex-col gap-2">
            {POLYLINE_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => selectPolylineStyle(style.id)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                  polylineStyle === style.id ? "border-[#2563eb] bg-blue-50" : "border-slate-100 bg-white"
                }`}
              >
                <div className="w-12 h-4 flex items-center shrink-0">
                  <PolylineSwatch styleId={style.id} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className={`text-[14px] font-medium ${polylineStyle === style.id ? "text-[#2563eb]" : "text-[#0f172a]"}`}>
                    {style.label}
                  </p>
                  <p className="text-[11px] text-slate-400">{style.desc}</p>
                </div>
                {polylineStyle === style.id && (
                  <Check className="w-4 h-4 text-[#2563eb] shrink-0" strokeWidth={2.5} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SlidePanel>
  );
}
