import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Home } from "lucide-react";
import BottomSheet from "@/components/common/BottomSheet";

const HOME_KEY = "phato_home_location";

interface HomeLocation { lat: number; lng: number; }

const homeIconHtml = `<div style="width:28px;height:28px;border-radius:50%;background:#fff;border:2.5px solid #2563eb;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(37,99,235,0.25)">
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
</div>`;

const homeIcon = L.divIcon({ html: homeIconHtml, className: "", iconSize: [28, 28], iconAnchor: [14, 14] });

function MapTapper({ onTap }: { onTap: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onTap(e.latlng.lat, e.latlng.lng) });
  return null;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HomeLocationSheet({ open, onClose }: Props) {
  const [pin, setPin] = useState<HomeLocation | null>(() => {
    try {
      const v = localStorage.getItem(HOME_KEY);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  });

  const handleTap = useCallback((lat: number, lng: number) => {
    setPin({ lat, lng });
  }, []);

  function handleSave() {
    if (!pin) return;
    localStorage.setItem(HOME_KEY, JSON.stringify(pin));
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Set Home Location">
      <div className="flex flex-col gap-4 px-5 py-4 pb-10">
        <p className="text-[13px] text-slate-500">Tap on the map to drop your home pin. This is stored only on your device.</p>
        <div className="rounded-2xl overflow-hidden" style={{ height: 280 }}>
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
              {pin && <Marker position={[pin.lat, pin.lng]} icon={homeIcon} interactive={false} />}
            </MapContainer>
          )}
        </div>
        {pin ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50">
            <Home className="w-4 h-4 text-[#2563eb] shrink-0" strokeWidth={2} />
            <p className="text-[13px] text-[#2563eb] font-medium">
              {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
            </p>
          </div>
        ) : (
          <p className="text-[13px] text-slate-400 text-center">Tap the map to drop your pin</p>
        )}
        <button
          onClick={handleSave}
          disabled={!pin}
          className="w-full h-12 rounded-2xl text-[15px] font-semibold text-white transition-all disabled:opacity-40"
          style={{ background: "#2563eb", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}
        >
          Set as Home
        </button>
      </div>
    </BottomSheet>
  );
}
