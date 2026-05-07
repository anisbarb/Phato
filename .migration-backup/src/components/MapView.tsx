import { memo, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { ReactNode } from "react";
import L from "leaflet";
import { isValidLatLng } from "@/lib/types";
import type { LatLng } from "@/lib/types";

type MapViewProps = {
  initialCenter: LatLng;
  initialZoom?: number;
  children?: ReactNode;
  recenterTrigger?: number;
  recenterTo?: LatLng | null;
  onUserPan?: () => void;
  onMapReady?: (map: L.Map) => void;
  onMapTap?: () => void;
};

function Recenter({
  recenterTrigger,
  recenterTo,
}: {
  recenterTrigger?: number;
  recenterTo?: LatLng | null;
}) {
  const map = useMap();
  const lastHandledTrigger = useRef(0);

  useEffect(() => {
    if (!recenterTrigger) return;
    if (recenterTrigger === lastHandledTrigger.current) return;
    if (!recenterTo || !isValidLatLng(recenterTo)) return;
    lastHandledTrigger.current = recenterTrigger;
    map.flyTo([recenterTo.lat, recenterTo.lng], Math.max(map.getZoom(), 15), {
      duration: 0.55,
      easeLinearity: 0.45,
    });
  }, [recenterTrigger, recenterTo, map]);

  return null;
}

function MapReady({ onMapReady }: { onMapReady?: (m: L.Map) => void }) {
  const map = useMap();
  const cbRef = useRef(onMapReady);
  cbRef.current = onMapReady;
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    cbRef.current?.(map);
  }, [map]);

  return null;
}

function PanWatcher({ onUserPan, onMapTap }: { onUserPan?: () => void; onMapTap?: () => void }) {
  const cbRef = useRef(onUserPan);
  cbRef.current = onUserPan;
  const tapRef = useRef(onMapTap);
  tapRef.current = onMapTap;
  useMapEvents({
    dragstart: () => cbRef.current?.(),
    click: () => tapRef.current?.(),
  });
  return null;
}

const MapViewInner = memo(function MapViewInner({
  children,
  recenterTrigger,
  recenterTo,
  onUserPan,
  onMapReady,
  onMapTap,
}: Omit<MapViewProps, "initialCenter" | "initialZoom">) {
  return (
    <>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        maxZoom={19}
        updateWhenIdle={false}
        updateWhenZooming={false}
        keepBuffer={4}
      />
      <Recenter recenterTrigger={recenterTrigger} recenterTo={recenterTo} />
      <PanWatcher onUserPan={onUserPan} onMapTap={onMapTap} />
      <MapReady onMapReady={onMapReady} />
      {children}
    </>
  );
});

export default function MapView({
  initialCenter,
  initialZoom = 14,
  children,
  recenterTrigger,
  recenterTo,
  onUserPan,
  onMapReady,
  onMapTap,
}: MapViewProps) {
  const safeCenter = isValidLatLng(initialCenter)
    ? initialCenter
    : { lat: 24.8333, lng: 92.7789 };

  return (
    <MapContainer
      center={[safeCenter.lat, safeCenter.lng]}
      zoom={initialZoom}
      zoomControl={false}
      attributionControl={true}
      preferCanvas={true}
      zoomSnap={1}
      zoomDelta={1}
      wheelPxPerZoomLevel={80}
      style={{ height: "100%", width: "100%" }}
    >
      <MapViewInner
        recenterTrigger={recenterTrigger}
        recenterTo={recenterTo}
        onUserPan={onUserPan}
        onMapReady={onMapReady}
        onMapTap={onMapTap}
      >
        {children}
      </MapViewInner>
    </MapContainer>
  );
}
