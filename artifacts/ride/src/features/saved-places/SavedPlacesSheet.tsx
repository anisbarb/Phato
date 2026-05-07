import { useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Star, Trash2, Plus, X } from "lucide-react";
import SlidePanel from "@/components/common/SlidePanel";
import { EmptyState } from "@/components/common/EmptyState";

const SAVED_KEY = "phato_saved_places";

interface SavedPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  savedAt: string;
}

function loadPlaces(): SavedPlace[] {
  try {
    const v = localStorage.getItem(SAVED_KEY);
    return v ? JSON.parse(v) : [];
  } catch { return []; }
}

function savePlaces(places: SavedPlace[]) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(places));
}

const pinIconHtml = `<div style="width:24px;height:24px;border-radius:50%;background:#fff;border:2.5px solid #2563eb;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(37,99,235,0.25)">
  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="#2563eb" stroke="#2563eb" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
</div>`;
const pinIcon = L.divIcon({ html: pinIconHtml, className: "", iconSize: [24, 24], iconAnchor: [12, 12] });

function MapTapper({ onTap }: { onTap: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onTap(e.latlng.lat, e.latlng.lng) });
  return null;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SavedPlacesSheet({ open, onClose }: Props) {
  const [places, setPlaces] = useState<SavedPlace[]>(loadPlaces);
  const [adding, setAdding] = useState(false);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [name, setName] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const handleTap = useCallback((lat: number, lng: number) => {
    setPin({ lat, lng });
    setTimeout(() => nameRef.current?.focus(), 100);
  }, []);

  function handleAdd() {
    if (!pin || !name.trim()) return;
    const updated = [...places, {
      id: crypto.randomUUID(),
      name: name.trim(),
      lat: pin.lat,
      lng: pin.lng,
      savedAt: new Date().toISOString(),
    }];
    setPlaces(updated);
    savePlaces(updated);
    setAdding(false);
    setPin(null);
    setName("");
  }

  function handleDelete(id: string) {
    const updated = places.filter((p) => p.id !== id);
    setPlaces(updated);
    savePlaces(updated);
  }

  return (
    <SlidePanel open={open} onClose={onClose} title="Saved Places">
      {adding ? (
        <div className="flex flex-col gap-4 px-5 py-4 pb-10">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-slate-500">Tap the map to pin a location</p>
            <button
              type="button"
              onClick={() => { setAdding(false); setPin(null); setName(""); }}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100"
            >
              <X className="w-4 h-4 text-slate-400" strokeWidth={2} />
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-100" style={{ height: 220 }}>
            {open && (
              <MapContainer
                center={[24.8333, 92.7789]}
                zoom={13}
                zoomControl={false}
                attributionControl={false}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <MapTapper onTap={handleTap} />
                {pin && <Marker position={[pin.lat, pin.lng]} icon={pinIcon} interactive={false} />}
              </MapContainer>
            )}
          </div>
          <input
            ref={nameRef}
            className="h-12 rounded-xl border border-slate-200 px-4 text-[15px] text-[#0f172a] bg-white outline-none focus:border-[#2563eb] transition-colors placeholder:text-slate-400"
            placeholder="Place name (e.g. Home, Office)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!pin || !name.trim()}
            className="w-full h-12 rounded-2xl text-[15px] font-semibold text-white disabled:opacity-40 transition-opacity active:scale-[0.98]"
            style={{ background: "#2563eb", boxShadow: "0 4px 14px rgba(37,99,235,0.30)" }}
          >
            Save Place
          </button>
        </div>
      ) : (
        <div className="flex flex-col pb-10">
          {places.length === 0 ? (
            <EmptyState icon={Star} title="No saved places" subtitle="Save spots you visit often for quick access." />
          ) : (
            <div className="flex flex-col">
              {places.map((place) => (
                <div key={place.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(37,99,235,0.08)" }}>
                    <Star className="w-4 h-4 text-[#2563eb]" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-[#0f172a] truncate">{place.name}</p>
                    <p className="text-[12px] text-slate-400">{place.lat.toFixed(4)}, {place.lng.toFixed(4)}</p>
                  </div>
                  <button type="button" onClick={() => handleDelete(place.id)} className="p-1">
                    <Trash2 className="w-4 h-4 text-slate-300" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="px-5 pt-4">
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full h-12 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center gap-2 text-[14px] font-medium text-slate-500 active:bg-slate-50 transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              Add Place
            </button>
          </div>
        </div>
      )}
    </SlidePanel>
  );
}
