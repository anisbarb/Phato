import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import { ArrowLeft, Eye, MapPin, MessageCircle, X } from "lucide-react";
import MapView from "@/components/MapView";
import SmoothMarker from "@/components/SmoothMarker";
import DestinationPicker from "@/components/DestinationPicker";
import MapPickOverlay from "@/components/MapPickOverlay";
import ZoomControl from "@/components/ZoomControl";
import CorridorLayer from "@/components/CorridorLayer";
import DemandHalos from "@/components/DemandHalos";
import CorridorPulse from "@/components/CorridorPulse";
import PingSheet from "@/components/PingSheet";
import SeatCounter from "@/components/SeatCounter";
import PickupNotification from "@/components/PickupNotification";
import ChatTray from "@/components/ChatTray";
import Toast from "@/components/Toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useSimulatedPassengers } from "@/hooks/useSimulatedPassengers";
import { useSimulatedVehicles } from "@/hooks/useSimulatedVehicles";
import { useDriverIdentity } from "@/hooks/useDriverIdentity";
import { useLocationBroadcast } from "@/hooks/useLocationBroadcast";
import { useIncomingPickups } from "@/hooks/useIncomingPickups";
import { useDriverNotifications } from "@/hooks/useDriverNotifications";
import { useChat } from "@/hooks/useChat";
import { useCorridorPulse } from "@/hooks/useCorridorPulse";
import { carIcon, destinationIcon, passengerIcon, pingPulseIcon } from "@/lib/icons";
import { DEFAULT_CENTER } from "@/lib/geolocation";
import { fetchRouteVariants, formatDistance, formatDuration } from "@/lib/osrm";
import { getPlace, nearestPlace } from "@/lib/places";
import { matchPassengers, type MatchedPassenger } from "@/lib/matching";
import { isValidLatLng } from "@/lib/types";
import type { Destination, PingPreset, RouteResult } from "@/lib/types";

const SEATS_TOTAL = 6;
const SEATS_KEY = "phato.seats.filled";

type RouteChoice = RouteResult & { id: string; label: string };

function loadSeats(): number {
  try {
    const v = window.localStorage.getItem(SEATS_KEY);
    if (!v) return 0;
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 && n <= SEATS_TOTAL ? n : 0;
  } catch { return 0; }
}

export default function DriverHome() {
  const driverId = useDriverIdentity();
  const { position, error } = useGeolocation(true);
  const [headingDeg] = useState(0);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [fullscreenMap, setFullscreenMap] = useState(false);
  const [online, setOnline] = useState(false);
  const [route, setRoute] = useState<RouteChoice | null>(null);
  const [routeChoices, setRouteChoices] = useState<RouteChoice[]>([]);
  const [activeRouteId, setActiveRouteId] = useState<string>("primary");
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [seatsFilled, setSeatsFilled] = useState<number>(loadSeats);
  const [pingTarget, setPingTarget] = useState<MatchedPassenger | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pulseAt, setPulseAt] = useState<{ id: string; until: number } | null>(null);
  const [activePassengerId, setActivePassengerId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const mapRef = useRef<L.Map | null>(null);
  const initialCenterRef = useRef(position ?? DEFAULT_CENTER);

  const center = position ?? DEFAULT_CENTER;
  const seatsFree = Math.max(0, SEATS_TOTAL - seatsFilled);
  const isFull = seatsFree === 0;
  useEffect(() => { try { window.localStorage.setItem(SEATS_KEY, String(seatsFilled)); } catch { return; } }, [seatsFilled]);

  const { requestPermission, notify } = useDriverNotifications();
  const { incoming, handleMessage: handlePickupMessage, dismiss: dismissPickup } = useIncomingPickups(driverId);
  const { messages: chatMessages, handleMessage: handleChatMessage, sendMessage, clearMessages } = useChat(driverId, "driver");

  // Combined message handler: pickup requests + chat
  const handleWsMessage = useCallback((msg: unknown) => {
    handlePickupMessage(msg);
    const m = msg as Record<string, unknown>;
    if (m["type"] === "chat_message") {
      handleChatMessage(msg);
      if (!chatOpen) setUnreadChat((n) => n + 1);
    }
  }, [handlePickupMessage, handleChatMessage, chatOpen]);

  const wsRef = useLocationBroadcast({
    active: online,
    driverId,
    position,
    headingDeg,
    seatsFree,
    seatsTotal: SEATS_TOTAL,
    destinationId: destination?.placeId ?? null,
    onMessage: handleWsMessage,
  });

  // Notify browser when pickup request arrives
  useEffect(() => {
    if (incoming) {
      const nearPlace = nearestPlace({ lat: incoming.passengerLat, lng: incoming.passengerLng });
      notify("🚗 Pickup Request — Phato", `Passenger near ${nearPlace.name} wants a ride`);
    }
  }, [incoming?.requestId]);

  const handlePickupAccept = useCallback(() => {
    if (!incoming) return;
    const ws = wsRef.current;
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: "pickup_response", requestId: incoming.requestId, driverId, passengerId: incoming.passengerId, accepted: true }));
    }
    setActivePassengerId(incoming.passengerId);
    setToast("Pickup accepted! Head to the passenger.");
    dismissPickup();
  }, [incoming, wsRef, driverId, dismissPickup]);

  const handlePickupDecline = useCallback(() => {
    if (!incoming) return;
    const ws = wsRef.current;
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: "pickup_response", requestId: incoming.requestId, driverId, passengerId: incoming.passengerId, accepted: false }));
    }
    dismissPickup();
  }, [incoming, wsRef, driverId, dismissPickup]);

  const handleSendChat = useCallback((text: string) => {
    if (!activePassengerId) return;
    sendMessage(wsRef.current, activePassengerId, text);
  }, [activePassengerId, sendMessage, wsRef]);

  const corridorVehicles = useSimulatedVehicles(center, 16);
  const corridorStats = useCorridorPulse(corridorVehicles);
  const allRequests = useSimulatedPassengers(center, online && !isFull, 12);
  const matches = useMemo(() => matchPassengers({ origin: position, destination, passengers: allRequests, radiusM: 500 }), [position, destination, allRequests]);

  const handleMapReady = useCallback((m: L.Map) => { mapRef.current = m; }, []);
  const handleUserPan = useCallback(() => {}, []);
  const handleMapTap = useCallback(() => { if (pickMode) return; setFullscreenMap((v) => !v); }, [pickMode]);

  useEffect(() => {
    if (!position || !destination) { setRoute(null); setRouteChoices([]); return; }
    const ctl = new AbortController();
    fetchRouteVariants(position, destination.position, ctl.signal).then((routes) => {
      if (ctl.signal.aborted) return;
      const choices = routes.slice(0, 3).map((r, i) => ({ ...r, id: i === 0 ? "primary" : i === 1 ? "smooth" : "short", label: i === 0 ? "Fastest" : i === 1 ? "Smooth" : "Shortest" }));
      setRouteChoices(choices);
      setRoute(choices[0] ?? null);
      if (choices[0]) setActiveRouteId(choices[0].id);
      if (!choices.length) setToast("Route unavailable");
    });
    return () => ctl.abort();
  }, [position, destination]);

  const polylinePoints = useMemo(() => { if (!route) return null; return route.coordinates.filter(isValidLatLng).map((p) => [p.lat, p.lng] as [number, number]); }, [route]);

  // Exactly matching passenger: controlsBottom accounts for fullscreenMap
  const controlsBottom = fullscreenMap || pickMode ? "16px" : `calc(${destination ? "10rem" : "6.5rem"} + 16px)`;

  const handleRecenter = useCallback(() => { if (!position) return; setRecenterTrigger((n) => n + 1); }, [position]);
  const handleMapPickConfirm = useCallback(() => {
    const map = mapRef.current; if (!map) return;
    const c = map.getCenter();
    const np = nearestPlace({ lat: c.lat, lng: c.lng });
    setDestination({ name: `Near ${np.name}`, position: { lat: c.lat, lng: c.lng }, placeId: np.id, isCustom: true });
    setPickMode(false);
  }, []);
  const handleSendPing = useCallback((_preset: PingPreset) => {
    if (!pingTarget) return;
    setToast("Message sent to passenger");
    setPulseAt({ id: pingTarget.id, until: Date.now() + 1200 });
    setPingTarget(null);
  }, [pingTarget]);
  const clearRoute = useCallback(() => { setDestination(null); setOnline(false); setRoute(null); setRouteChoices([]); }, []);
  const handleGoOnline = useCallback(() => {
    setOnline((v) => {
      if (!v) {
        setToast("You're visible to passengers now");
        requestPermission(); // Ask for browser notification permission
      }
      return !v;
    });
  }, [requestPermission]);
  const activeRoute = routeChoices.find((r) => r.id === activeRouteId) ?? route;

  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#eef5ff] ${fullscreenMap ? "map-fullscreen" : ""}`}>
      <div className="absolute inset-0 map-zoom-feel">
        <MapView initialCenter={initialCenterRef.current} initialZoom={13} recenterTrigger={recenterTrigger} recenterTo={position} onUserPan={handleUserPan} onMapReady={handleMapReady} onMapTap={handleMapTap}>
          <CorridorLayer />
          {online && !isFull ? <DemandHalos passengers={matches} /> : null}
          {!pickMode && destination ? <Marker position={[destination.position.lat, destination.position.lng]} icon={destinationIcon} interactive={false} keyboard={false} /> : null}
          {position && isValidLatLng(position) ? <SmoothMarker position={position} icon={carIcon} /> : null}
          {!pickMode && online && !isFull ? matches.map((p) => <Marker key={p.id} position={[p.position.lat, p.position.lng]} icon={passengerIcon(p.status)} eventHandlers={{ click: () => setPingTarget(p) }} keyboard={false} />) : null}
          {!pickMode && pulseAt && Date.now() < pulseAt.until ? (() => { const p = matches.find((m) => m.id === pulseAt.id); return p ? <Marker position={[p.position.lat, p.position.lng]} icon={pingPulseIcon} interactive={false} keyboard={false} /> : null; })() : null}
          {route && polylinePoints && polylinePoints.length > 1 ? (<><Polyline positions={polylinePoints} pathOptions={{ color: "#0f172a", weight: 9, opacity: 0.10, lineCap: "round", lineJoin: "round" }} /><Polyline positions={polylinePoints} pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.88, lineCap: "round", lineJoin: "round" }} /><Polyline positions={polylinePoints} pathOptions={{ color: "#ffffff", weight: 2, opacity: 0.78, dashArray: "1 12", lineCap: "round", lineJoin: "round" }} /></>) : null}
        </MapView>
        {/* ZoomControl — now identical to passenger: uses controlsBottom with fullscreenMap support */}
        <ZoomControl map={mapRef.current} onRecenter={handleRecenter} bottomOffset={pickMode ? "16px" : controlsBottom} />
      </div>

      <div className={`map-ui-shell ${fullscreenMap || pickMode ? "map-ui-shell-hidden" : ""}`}>
        <div className={`map-ui-panel top-panel ${fullscreenMap || pickMode ? "map-ui-panel-hidden-up" : "map-ui-panel-visible-down"}`}>
          <div className="flex items-center gap-2 h-11">
            <Link href="/" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full glass-pill" aria-label="Back"><ArrowLeft className="h-4 w-4 text-[var(--color-ink)]" /></Link>
            <button onClick={() => setPickerOpen(true)} className="flex h-11 flex-1 items-center gap-2.5 rounded-[22px] glass-pill px-4 text-left">
              <MapPin className={`h-4 w-4 shrink-0 ${destination ? "text-brand" : "text-[var(--color-ink-mute)]"}`} />
              <span className={`flex-1 truncate text-[13px] ${destination ? "font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink-mute)]"}`}>{destination ? destination.name : "Where are you going today?"}</span>
              {destination ? <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); clearRoute(); }} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-3)]" aria-label="Clear"><X className="h-3 w-3 text-[var(--color-ink-soft)]" /></button> : null}
            </button>
            {online ? <SeatCounter filled={seatsFilled} total={SEATS_TOTAL} onChange={setSeatsFilled} /> : null}
            {activePassengerId && online && (
              <button
                onClick={() => { setChatOpen(true); setUnreadChat(0); }}
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full glass-pill"
                aria-label="Open chat"
              >
                <MessageCircle className="h-5 w-5 text-[var(--color-ink)]" />
                {unreadChat > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "rgb(239,68,68)" }}>
                    {unreadChat}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        <div className={`map-ui-panel middle-panel ${fullscreenMap || pickMode ? "map-ui-panel-hidden-up" : "map-ui-panel-visible-down"}`}>
          {error && !position ? <div className="soft-card px-3 py-2.5 text-[12px] leading-relaxed text-[var(--color-ink-soft)]">{error.code === "denied" ? "📍 Allow location to see passengers near you." : "Tap the map to continue — showing default area."}</div> : online && !isFull && destination ? <div className="rounded-[14px] px-3 py-2" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.22)" }}><Eye className="h-3.5 w-3.5 inline-block mr-1.5 text-emerald-600" /><span className="text-[12px] font-medium text-emerald-700">Passengers on this route can see you</span></div> : null}
        </div>

        <div className={`map-ui-panel bottom-panel ${fullscreenMap || pickMode ? "map-ui-panel-hidden-down" : "map-ui-panel-visible-up"}`} style={{ ["--bottom-panel-height" as string]: fullscreenMap || pickMode ? "0px" : destination ? "10rem" : "6.5rem" }}>
          <CorridorPulse stats={corridorStats} destination={destination} matchCount={matches.length} route={activeRoute} asDriver />
          {destination && routeChoices.length > 1 ? <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">{routeChoices.map((r) => { const active = activeRouteId === r.id; return <button key={r.id} onClick={() => { setActiveRouteId(r.id); setRoute(r); }} className={`min-w-[8.4rem] flex-1 rounded-[16px] px-2.5 py-2.5 text-left transition-colors ${active ? "bg-brand text-white shadow-[var(--shadow-brand)]" : "border border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-[var(--shadow-soft)]"}`}><div className="text-[11px] font-semibold">{r.label}</div><div className={`mt-0.5 text-[10px] ${active ? "text-white/75" : "text-[var(--color-ink-mute)]"}`}>{formatDuration(r.durationSeconds)} · {formatDistance(r.distanceMeters)}</div></button>; })}</div> : null}
          {!destination ? <button onClick={() => setPickerOpen(true)} className="w-full h-13 rounded-[20px] text-[15px] font-semibold bg-brand text-white shadow-[var(--shadow-brand)]" style={{ height: "52px" }}>Set Your Route</button> : <button onClick={handleGoOnline} className={`w-full rounded-[20px] text-[15px] font-semibold transition-all ${online ? "border border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-[var(--shadow-soft)]" : "bg-brand text-white shadow-[var(--shadow-brand)]"}`} style={{ height: "52px" }}>{online ? "Go Offline" : "Go Online — Show My Route"}</button>}
        </div>
      </div>

      <div className={`map-ui-fader ${fullscreenMap ? "map-ui-fader-left" : "map-ui-fader-right"}`} aria-hidden="true" />

      {/* Incoming pickup notification banner */}
      {incoming && !chatOpen && (
        <PickupNotification pickup={incoming} onAccept={handlePickupAccept} onDecline={handlePickupDecline} timeoutMs={15000} />
      )}

      {/* In-trip chat for driver */}
      {chatOpen && activePassengerId && (
        <ChatTray
          role="driver"
          messages={chatMessages}
          onSend={handleSendChat}
          onClose={() => setChatOpen(false)}
        />
      )}

      {pickMode && <MapPickOverlay hint="Move the map to set your destination" onCancel={() => setPickMode(false)} onConfirm={handleMapPickConfirm} />}

      <DestinationPicker open={pickerOpen} origin={position} selectedPlaceId={destination?.placeId ?? null} title="Where are you going?" onClose={() => setPickerOpen(false)} onSelectPlace={(id) => { const p = getPlace(id); if (!p) return; setDestination({ name: p.name, position: p.position, placeId: p.id }); setPickerOpen(false); }} onPickOnMap={() => { setPickerOpen(false); setPickMode(true); }} />
      <PingSheet open={!!pingTarget} targetLabel="Passenger" onClose={() => setPingTarget(null)} onSend={handleSendPing} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
