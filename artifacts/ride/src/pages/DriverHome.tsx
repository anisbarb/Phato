import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import { MapPin, MessageCircle, X, Radio } from "lucide-react";
import MenuSheet from "@/components/MenuSheet";
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
import { useDriverBroadcast } from "@/hooks/useDriverBroadcast";
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

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default function DriverHome() {
  const driverId = useDriverIdentity();
  const { position, error } = useGeolocation(true);
  const [headingDeg] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
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

  const handleWsMessage = useCallback((msg: unknown) => {
    handlePickupMessage(msg);
    const m = msg as Record<string, unknown>;
    if (m["type"] === "chat_message") {
      handleChatMessage(msg);
      if (!chatOpen) setUnreadChat((n) => n + 1);
    }
  }, [handlePickupMessage, handleChatMessage, chatOpen]);

  const { send } = useDriverBroadcast({
    active: online,
    driverId,
    position,
    headingDeg,
    seatsFree,
    seatsTotal: SEATS_TOTAL,
    destinationId: destination?.placeId ?? null,
    onMessage: handleWsMessage,
  });

  useEffect(() => {
    if (incoming) {
      const nearPlace = nearestPlace({ lat: incoming.passengerLat, lng: incoming.passengerLng });
      notify("🚗 Pickup Request — Phato", `Passenger near ${nearPlace.name} wants a ride`);
    }
  }, [incoming?.requestId]);

  const handlePickupAccept = useCallback(() => {
    if (!incoming) return;
    send({ type: "pickup_response", requestId: incoming.requestId, driverId, passengerId: incoming.passengerId, accepted: true });
    setActivePassengerId(incoming.passengerId);
    setToast("Pickup accepted! Head to the passenger.");
    dismissPickup();
  }, [incoming, send, driverId, dismissPickup]);

  const handlePickupDecline = useCallback(() => {
    if (!incoming) return;
    send({ type: "pickup_response", requestId: incoming.requestId, driverId, passengerId: incoming.passengerId, accepted: false });
    dismissPickup();
  }, [incoming, send, driverId, dismissPickup]);

  const handleSendChat = useCallback((text: string) => {
    if (!activePassengerId) return;
    sendMessage(send, activePassengerId, text);
  }, [activePassengerId, sendMessage, send]);

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

  const polylinePoints = useMemo(() => {
    if (!route) return null;
    return route.coordinates.filter(isValidLatLng).map((p) => [p.lat, p.lng] as [number, number]);
  }, [route]);

  const polylineOpts = useMemo(() => {
    const style = localStorage.getItem("phato_polyline_style") ?? "apple";
    return ({
      apple:   { color: "#2563eb", weight: 5, opacity: 0.9 },
      uber:    { color: "#0f172a", weight: 6, opacity: 0.95 },
      glow:    { color: "#60a5fa", weight: 5, opacity: 1 },
      minimal: { color: "#94a3b8", weight: 2, opacity: 0.8 },
    } as Record<string, { color: string; weight: number; opacity: number }>)[style] ?? { color: "#2563eb", weight: 5, opacity: 0.9 };
  }, []);

  const controlsBottom = fullscreenMap || pickMode ? "16px" : `calc(${destination ? "9rem" : "5.5rem"} + 16px)`;

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
        requestPermission();
      }
      return !v;
    });
  }, [requestPermission]);
  const activeRoute = routeChoices.find((r) => r.id === activeRouteId) ?? route;
  void clearMessages;

  const panelH = destination ? "9rem" : "5.5rem";

  return (
    <div className={`relative h-full w-full overflow-hidden bg-white ${fullscreenMap ? "map-fullscreen" : ""}`}>
      <div className="absolute inset-0 map-zoom-feel">
        <MapView initialCenter={initialCenterRef.current} initialZoom={13} recenterTrigger={recenterTrigger} recenterTo={position} onUserPan={handleUserPan} onMapReady={handleMapReady} onMapTap={handleMapTap}>
          <CorridorLayer />
          {online && !isFull ? <DemandHalos passengers={matches} /> : null}
          {!pickMode && destination ? <Marker position={[destination.position.lat, destination.position.lng]} icon={destinationIcon} interactive={false} keyboard={false} /> : null}
          {position && isValidLatLng(position) ? <SmoothMarker position={position} icon={carIcon} /> : null}
          {!pickMode && online && !isFull ? matches.map((p) => <Marker key={p.id} position={[p.position.lat, p.position.lng]} icon={passengerIcon(p.status)} eventHandlers={{ click: () => setPingTarget(p) }} keyboard={false} />) : null}
          {!pickMode && pulseAt && Date.now() < pulseAt.until ? (() => { const p = matches.find((m) => m.id === pulseAt.id); return p ? <Marker position={[p.position.lat, p.position.lng]} icon={pingPulseIcon} interactive={false} keyboard={false} /> : null; })() : null}
          {route && polylinePoints && polylinePoints.length > 1 ? (<><Polyline positions={polylinePoints} pathOptions={{ color: "#0f172a", weight: polylineOpts.weight + 4, opacity: 0.08, lineCap: "round", lineJoin: "round" }} /><Polyline positions={polylinePoints} pathOptions={{ ...polylineOpts, lineCap: "round", lineJoin: "round" }} /></>) : null}
        </MapView>
        <ZoomControl map={mapRef.current} onRecenter={handleRecenter} bottomOffset={pickMode ? "16px" : controlsBottom} />
      </div>

      {/* ── Top bar ── */}
      <div className={`map-ui-shell ${fullscreenMap || pickMode ? "map-ui-shell-hidden" : ""}`}>
        <div className={`map-ui-panel top-panel ${fullscreenMap || pickMode ? "map-ui-panel-hidden-up" : "map-ui-panel-visible-down"}`}>
          <div className="flex items-center gap-2 h-11">
            {/* Corridor/route pill — left, flex-1 */}
            <button onClick={() => setPickerOpen(true)} className="flex h-11 flex-1 items-center gap-2.5 rounded-[22px] glass-pill px-4 text-left min-w-0">
              <MapPin className={`h-4 w-4 shrink-0 ${destination ? "text-brand" : "text-[var(--color-ink-mute)]"}`} />
              <span className={`flex-1 truncate text-[13px] ${destination ? "font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink-mute)]"}`}>
                {destination ? destination.name : "Set corridor"}
              </span>
              {destination
                ? <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); clearRoute(); }} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-3)]" aria-label="Clear"><X className="h-3 w-3 text-[var(--color-ink-soft)]" /></button>
                : null}
            </button>

            {/* Seat counter when online */}
            {online ? <SeatCounter filled={seatsFilled} total={SEATS_TOTAL} onChange={setSeatsFilled} /> : null}

            {/* Online status chip */}
            {online
              ? <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold tracking-wide px-2.5 py-1 leading-none">
                  <Radio className="h-2.5 w-2.5" /> ONLINE
                </span>
              : null}

            {/* Chat button */}
            {activePassengerId && online ? (
              <button onClick={() => { setChatOpen(true); setUnreadChat(0); }} className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full glass-pill" aria-label="Open chat">
                <MessageCircle className="h-5 w-5 text-[var(--color-ink)]" />
                {unreadChat > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "rgb(239,68,68)" }}>{unreadChat}</span>
                )}
              </button>
            ) : null}

            {/* Hamburger — always rightmost */}
            <button type="button" onClick={() => setMenuOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full glass-pill" aria-label="Open menu">
              <HamburgerIcon />
            </button>
          </div>
        </div>

        {/* Middle: location error or visibility notice */}
        <div className={`map-ui-panel middle-panel ${fullscreenMap || pickMode ? "map-ui-panel-hidden-up" : "map-ui-panel-visible-down"}`}>
          {error && !position
            ? <div className="soft-card px-3 py-2.5 text-[12px] leading-relaxed text-[var(--color-ink-soft)]">{error.code === "denied" ? "📍 Allow location so passengers can find you." : "Tap map to continue — showing default area."}</div>
            : online && !isFull && destination
              ? <div className="rounded-full px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-[11px] font-medium text-emerald-700">
                  Visible to passengers on this route
                </div>
              : null}
        </div>

        {/* ── Bottom panel — compact driver dashboard ── */}
        <div
          className={`map-ui-panel bottom-panel ${fullscreenMap || pickMode ? "map-ui-panel-hidden-down" : "map-ui-panel-visible-up"}`}
          style={{ ["--bottom-panel-height" as string]: fullscreenMap || pickMode ? "0px" : panelH }}
        >
          {/* Compact corridor stats */}
          <CorridorPulse stats={corridorStats} destination={destination} matchCount={matches.length} route={activeRoute} asDriver compact />

          {/* Route pills */}
          {destination && routeChoices.length > 1
            ? <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {routeChoices.map((r) => {
                  const active = activeRouteId === r.id;
                  return (
                    <button key={r.id} onClick={() => { setActiveRouteId(r.id); setRoute(r); }}
                      className={`min-w-[7.5rem] flex-1 rounded-[14px] px-2.5 py-2 text-left transition-colors ${active ? "bg-[#0f172a] text-white" : "border border-[var(--color-line)] bg-white text-[var(--color-ink)]"}`}>
                      <div className="text-[11px] font-semibold">{r.label}</div>
                      <div className={`mt-0.5 text-[10px] ${active ? "text-white/60" : "text-[var(--color-ink-mute)]"}`}>{formatDuration(r.durationSeconds)} · {formatDistance(r.distanceMeters)}</div>
                    </button>
                  );
                })}
              </div>
            : null}

          {/* CTA — compact pill, not full-width block */}
          {!destination
            ? <button onClick={() => setPickerOpen(true)}
                className="w-full rounded-[14px] text-[14px] font-semibold bg-[#0f172a] text-white tracking-tight"
                style={{ height: "44px" }}>
                Set Corridor
              </button>
            : <button onClick={handleGoOnline}
                className={`w-full rounded-[14px] text-[14px] font-semibold transition-all ${online ? "border border-[var(--color-line)] bg-white text-[var(--color-ink)]" : "bg-[#0f172a] text-white"}`}
                style={{ height: "44px" }}>
                {online ? "Go Offline" : "Go Online"}
              </button>}
        </div>
      </div>

      <div className={`map-ui-fader ${fullscreenMap ? "map-ui-fader-left" : "map-ui-fader-right"}`} aria-hidden="true" />

      {incoming && !chatOpen && (
        <PickupNotification pickup={incoming} onAccept={handlePickupAccept} onDecline={handlePickupDecline} timeoutMs={15000} />
      )}

      {chatOpen && activePassengerId && (
        <ChatTray role="driver" messages={chatMessages} onSend={handleSendChat} onClose={() => setChatOpen(false)} />
      )}

      {pickMode && <MapPickOverlay hint="Move the map to set your corridor end" onCancel={() => setPickMode(false)} onConfirm={handleMapPickConfirm} />}

      <DestinationPicker open={pickerOpen} origin={position} selectedPlaceId={destination?.placeId ?? null} title="Set your corridor" onClose={() => setPickerOpen(false)}
        onSelectPlace={(id) => { const p = getPlace(id); if (!p) return; setDestination({ name: p.name, position: p.position, placeId: p.id }); setPickerOpen(false); }}
        onPickOnMap={() => { setPickerOpen(false); setPickMode(true); }} />
      <PingSheet open={!!pingTarget} targetLabel="Passenger" onClose={() => setPingTarget(null)} onSend={handleSendPing} />
      <Toast message={toast} onDone={() => setToast(null)} />
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} isDriver />
    </div>
  );
}
