import { useEffect, useRef, useState } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";
import { MessageCircle, X } from "lucide-react";
import MapView from "@/components/MapView";
import ZoomControl from "@/components/ZoomControl";
import { userIcon, vehicleIcon } from "@/lib/icons";
import { isValidLatLng } from "@/lib/types";
import type { LatLng } from "@/lib/types";

function haversineM(a: LatLng, b: LatLng) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

type Driver = {
  id: string;
  lat: number;
  lng: number;
  headingDeg: number;
  seatsTotal: number;
  seatsFree: number;
};

type Props = {
  driverId: string;
  driverLabel: string;
  passengerPosition: LatLng | null;
  realtimeDrivers: Driver[];
  unreadCount: number;
  onOpenChat: () => void;
  onCancel: () => void;
};

export default function TripView({
  driverId,
  driverLabel,
  passengerPosition,
  realtimeDrivers,
  unreadCount,
  onOpenChat,
  onCancel,
}: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const driver = realtimeDrivers.find((d) => d.id === driverId);
  const driverPos: LatLng | null = driver ? { lat: driver.lat, lng: driver.lng } : null;

  const distanceM = passengerPosition && driverPos
    ? haversineM(passengerPosition, driverPos)
    : null;

  const etaMin = distanceM != null ? Math.max(1, Math.ceil((distanceM / 8) / 60)) : null;

  // Auto-fit bounds when both positions available
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !passengerPosition || !driverPos) return;
    if (!isValidLatLng(passengerPosition) || !isValidLatLng(driverPos)) return;
    const bounds = L.latLngBounds(
      [passengerPosition.lat, passengerPosition.lng],
      [driverPos.lat, driverPos.lng]
    );
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
  }, [driverPos?.lat, driverPos?.lng]);

  const center = passengerPosition ?? { lat: 24.83, lng: 92.78 };

  return (
    <div className="absolute inset-0 z-[1100] flex flex-col">
      {/* Top status bar */}
      <div
        className="absolute inset-x-0 top-0 z-[1200] px-3 pt-3 pointer-events-none"
        style={{ paddingTop: "env(safe-area-inset-top, 12px)" }}
      >
        <div
          className="rounded-[20px] px-4 py-3 flex items-center gap-3 pointer-events-auto shadow-2xl"
          style={{
            background: "rgba(15,23,42,0.94)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(37,99,235,0.3)" }}
          >
            <span className="text-blue-300 text-[16px]">🚗</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-white truncate">{driverLabel}</div>
            {distanceM != null ? (
              <div className="text-[11px] text-white/50">
                {distanceM < 1000
                  ? `${Math.round(distanceM)} m away`
                  : `${(distanceM / 1000).toFixed(1)} km away`}
                {etaMin != null ? ` · ~${etaMin} min` : ""}
              </div>
            ) : (
              <div className="text-[11px] text-white/50 animate-pulse">Locating driver…</div>
            )}
          </div>
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-full shrink-0"
            style={{ background: "rgba(255,255,255,0.10)" }}
            aria-label="Cancel pickup"
          >
            <X className="h-4 w-4 text-white/70" />
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView
          initialCenter={center}
          initialZoom={14}
          recenterTrigger={recenterTrigger}
          recenterTo={passengerPosition}
          onMapReady={(m) => { mapRef.current = m; }}
        >
          {passengerPosition && isValidLatLng(passengerPosition) ? (
            <Marker position={[passengerPosition.lat, passengerPosition.lng]} icon={userIcon} interactive={false} keyboard={false} />
          ) : null}
          {driverPos && isValidLatLng(driverPos) ? (
            <Marker
              position={[driverPos.lat, driverPos.lng]}
              icon={vehicleIcon({
                label: "Driver",
                status: "moving",
                seatsFree: driver?.seatsFree ?? 1,
                seatsTotal: driver?.seatsTotal ?? 6,
                headingDeg: driver?.headingDeg ?? 0,
                faded: false,
              })}
              interactive={false}
              keyboard={false}
            />
          ) : null}
        </MapView>

        <ZoomControl
          map={mapRef.current}
          onRecenter={() => { setRecenterTrigger((n) => n + 1); }}
          bottomOffset="80px"
        />
      </div>

      {/* Bottom bar */}
      <div
        className="absolute inset-x-0 bottom-0 z-[1200] px-3 pb-5"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 20px)" }}
      >
        <button
          onClick={onOpenChat}
          className="w-full rounded-[18px] flex items-center justify-center gap-2.5 text-[15px] font-semibold text-white relative shadow-2xl"
          style={{
            height: "52px",
            background: "rgba(15,23,42,0.92)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <MessageCircle className="h-5 w-5" />
          Chat with driver
          {unreadCount > 0 && (
            <span
              className="absolute top-2 right-4 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: "rgb(239,68,68)" }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
