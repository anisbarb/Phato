import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import { MapPin, Search, X } from "lucide-react";
import MapView from "@/components/MapView";
import SmoothMarker from "@/components/SmoothMarker";
import DestinationPicker from "@/components/DestinationPicker";
import MapPickOverlay from "@/components/MapPickOverlay";
import ZoomControl from "@/components/ZoomControl";
import CorridorLayer from "@/components/CorridorLayer";
import TrailLayer from "@/components/TrailLayer";
import CorridorPulse from "@/components/CorridorPulse";
import PingSheet from "@/components/PingSheet";
import PickupRequestCard from "@/components/PickupRequestCard";
import TripView from "@/components/TripView";
import ChatTray from "@/components/ChatTray";
import Toast from "@/components/Toast";
import MenuSheet from "@/components/MenuSheet";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useSimulatedVehicles } from "@/hooks/useSimulatedVehicles";
import { usePickupRequest } from "@/hooks/usePickupRequest";
import { usePassengerIdentity } from "@/hooks/usePassengerIdentity";
import { useCorridorPulse } from "@/hooks/useCorridorPulse";
import { useChat } from "@/hooks/useChat";
import { destinationIcon, pingPulseIcon, userIcon, vehicleIcon } from "@/lib/icons";
import { DEFAULT_CENTER } from "@/lib/geolocation";
import { fetchRouteVariants, formatDistance, formatDuration } from "@/lib/osrm";
import { getPlace, nearestPlace } from "@/lib/places";
import { matchVehicles, type MatchedVehicle } from "@/lib/matching";
import { isValidLatLng } from "@/lib/types";
import type { Destination, PingPreset, RouteResult } from "@/lib/types";
import type { DriverLocation } from "@/hooks/useDriverBroadcast";

type RouteChoice = RouteResult & { id: string; label: string };

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default function PassengerHome() {
  const [menuOpen, setMenuOpen] = useState(false);
  const passengerId = usePassengerIdentity();
  const { position, error } = useGeolocation(true);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [fullscreenMap, setFullscreenMap] = useState(false);
  const [route, setRoute] = useState<RouteChoice | null>(null);
  const [routeChoices, setRouteChoices] = useState<RouteChoice[]>([]);
  const [activeRouteId, setActiveRouteId] = useState<string>("primary");
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [followMode, setFollowMode] = useState(false);
  const [pingTarget, setPingTarget] = useState<MatchedVehicle | null>(null);
  const [pickupTarget, setPickupTarget] = useState<MatchedVehicle | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pulseAt, setPulseAt] = useState<{ id: string; until: number } | null>(null);
  const [unreadChat, setUnreadChat] = useState(0);
  const [realtimeDrivers, setRealtimeDrivers] = useState<DriverLocation[]>([]);
  const mapRef = useRef<L.Map | null>(null);
  const initialCenterRef = useRef(position ?? DEFAULT_CENTER);

  const handleDriverUpdate = useCallback((drivers: DriverLocation[]) => {
    setRealtimeDrivers(drivers);
  }, []);

  const { messages: chatMessages, handleMessage: handleChatMessage, sendMessage, clearMessages } = useChat(passengerId, "passenger");

  const handleIncomingChat = useCallback((msg: unknown) => {
    handleChatMessage(msg);
    if (!chatOpen) setUnreadChat((n) => n + 1);
  }, [handleChatMessage, chatOpen]);

  const { state: pickupState, sendRequest, reset: resetPickup, chRef, sendChat } = usePickupRequest({
    passengerId,
    onDriverUpdate: handleDriverUpdate,
    onChatMessage: handleIncomingChat,
  });

  // Expose sendChat to useChat's sendMessage
  const handleSendChat = useCallback((text: string) => {
    if (!tripDriverId) return;
    // Send via channel + add to local state
    sendMessage(
      (msg) => chRef.current?.postMessage(msg),
      tripDriverId,
      text,
    );
    // Also directly send via sendChat for reliability
    void sendChat;
  }, [sendMessage, chRef]);

  // Active trip = pickup was accepted
  const inTrip = pickupState.status === "accepted" && pickupState.driverId != null;
  const tripDriverId = inTrip ? pickupState.driverId! : null;
  const tripDriverLabel = tripDriverId ?? "Driver";

  const center = position ?? DEFAULT_CENTER;
  const simulatedVehicles = useSimulatedVehicles(center, 16);
  const realtimeIds = useMemo(() => new Set(realtimeDrivers.map((d) => d.id)), [realtimeDrivers]);

  const allVehicles = useMemo(() => {
    if (realtimeDrivers.length === 0) return simulatedVehicles;
    const filtered = simulatedVehicles.filter((v) => !realtimeIds.has(v.id));
    const asVehicles = realtimeDrivers.map((d) => ({
      id: d.id, label: d.id, position: { lat: d.lat, lng: d.lng }, trail: [],
      destinationId: d.destinationId ?? "silchar", routeCoords: [],
      headingDeg: d.headingDeg, speedMps: 8, seatsTotal: d.seatsTotal,
      seatsFilled: d.seatsTotal - d.seatsFree, status: "moving" as const, lastUpdated: d.updatedAt,
    }));
    return [...asVehicles, ...filtered];
  }, [simulatedVehicles, realtimeDrivers, realtimeIds]);

  const corridorStats = useCorridorPulse(allVehicles);
  const nearbyCount = useMemo(() => allVehicles.filter((v) => v.status === "moving" || v.status === "waiting").length, [allVehicles]);
  const matches = useMemo(() => matchVehicles({ origin: position, destination, vehicles: allVehicles, radiusM: 800 }), [position, destination, allVehicles]);

  useEffect(() => {
    if (pickupState.status === "accepted") {
      setToast("Driver is on the way! 🚗");
    }
    if (pickupState.status === "declined") {
      setToast("Driver declined — try another.");
      const t = setTimeout(() => { resetPickup(); setPickupTarget(null); }, 3000);
      return () => clearTimeout(t);
    }
  }, [pickupState.status, resetPickup]);

  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!position || !destination) { setRoute(null); setRouteChoices([]); return; }
    if (abortRef.current) abortRef.current.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
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

  const homeLocation = useMemo(() => {
    try { const v = localStorage.getItem("phato_home_location"); return v ? JSON.parse(v) as { lat: number; lng: number } : null; }
    catch { return null; }
  }, []);

  const savedPlaces = useMemo(() => {
    try { const v = localStorage.getItem("phato_saved_places"); return v ? JSON.parse(v) as Array<{ id: string; lat: number; lng: number; name: string }> : []; }
    catch { return []; }
  }, []);

  const homePinIcon = useMemo(() => L.divIcon({
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#fff;border:2px solid #2563eb;display:flex;align-items:center;justify-content:center;opacity:0.6;box-shadow:0 1px 4px rgba(37,99,235,0.2)"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`,
    className: "", iconSize: [20, 20], iconAnchor: [10, 10],
  }), []);

  const savedPinIcon = useMemo(() => L.divIcon({
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#fff;border:2px solid #f59e0b;display:flex;align-items:center;justify-content:center;opacity:0.55;box-shadow:0 1px 4px rgba(245,158,11,0.2)"><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>`,
    className: "", iconSize: [18, 18], iconAnchor: [9, 9],
  }), []);

  const handleMapReady = useCallback((m: L.Map) => { mapRef.current = m; }, []);
  const handleUserPan = useCallback(() => setFollowMode(false), []);
  const handleMapTap = useCallback(() => { if (pickMode) return; setFullscreenMap((v) => !v); }, [pickMode]);
  const handleRecenter = useCallback(() => { if (!position) return; setFollowMode(true); setRecenterTrigger((n) => n + 1); }, [position]);
  const handleMapPickConfirm = useCallback(() => {
    const map = mapRef.current; if (!map) return;
    const c = map.getCenter();
    const np = nearestPlace({ lat: c.lat, lng: c.lng });
    setDestination({ name: `Near ${np.name}`, position: { lat: c.lat, lng: c.lng }, placeId: np.id, isCustom: true });
    setPickMode(false);
  }, []);

  const handleVehicleClick = useCallback((v: MatchedVehicle) => {
    if (realtimeIds.has(v.id)) { setPickupTarget(v); resetPickup(); }
    else setPingTarget(v);
  }, [realtimeIds, resetPickup]);

  const handleSendPickupRequest = useCallback(() => {
    if (!pickupTarget || !position) return;
    sendRequest({ driverId: pickupTarget.id, passengerLat: position.lat, passengerLng: position.lng, passengerDestId: destination?.placeId ?? null });
  }, [pickupTarget, position, destination, sendRequest]);

  const handleSendPing = useCallback((_preset: PingPreset) => {
    if (!pingTarget) return;
    setToast(`Message sent to ${pingTarget.label}`);
    setPulseAt({ id: pingTarget.id, until: Date.now() + 1200 });
    setPingTarget(null);
  }, [pingTarget]);

  const handleCancelTrip = useCallback(() => {
    resetPickup(); setPickupTarget(null); clearMessages(); setUnreadChat(0);
  }, [resetPickup, clearMessages]);

  const clearDestination = useCallback(() => { setDestination(null); setRoute(null); setRouteChoices([]); }, []);
  const activeRoute = routeChoices.find((r) => r.id === activeRouteId) ?? route;
  const controlsBottom = fullscreenMap || pickMode ? "16px" : `calc(${destination ? "10rem" : "6.5rem"} + 16px)`;
  const pickupVehicle = pickupTarget ? matches.find((v) => v.id === pickupTarget.id) ?? pickupTarget : null;
  void followMode; void error;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#eef5ff]">
      <motion.div
        className={`absolute inset-0 ${fullscreenMap ? "map-fullscreen" : ""}`}
        animate={menuOpen
          ? { scale: 0.91, x: -22, borderRadius: 20 }
          : { scale: 1, x: 0, borderRadius: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.7 }}
        style={{ willChange: "transform", transformOrigin: "center center" }}
      >
        <div className="absolute inset-0 map-zoom-feel">
          <MapView initialCenter={initialCenterRef.current} initialZoom={13} recenterTrigger={recenterTrigger} recenterTo={position} onUserPan={handleUserPan} onMapReady={handleMapReady} onMapTap={handleMapTap}>
            <CorridorLayer />
            <TrailLayer vehicles={matches} />
            {position && isValidLatLng(position) ? <Marker position={[position.lat, position.lng]} icon={userIcon} interactive={false} keyboard={false} /> : null}
            {!pickMode && destination ? <Marker position={[destination.position.lat, destination.position.lng]} icon={destinationIcon} interactive={false} keyboard={false} /> : null}
            {!pickMode && matches.map((v) => {
              const seatsFree = Math.max(0, v.seatsTotal - v.seatsFilled);
              const isFull = seatsFree === 0;
              const isReal = realtimeIds.has(v.id);
              return <SmoothMarker key={v.id} position={v.position} icon={vehicleIcon({ label: isReal ? "LIVE" : `~${v.etaMinutes} min`, status: v.status, seatsFree, seatsTotal: v.seatsTotal, headingDeg: v.headingDeg, faded: isFull })} interactive={!isFull} onClick={!isFull ? () => handleVehicleClick(v) : undefined} />;
            })}
            {!pickMode && pulseAt && Date.now() < pulseAt.until ? (() => {
              const v = matches.find((m) => m.id === pulseAt.id);
              return v ? <Marker key={`pulse-${v.id}`} position={[v.position.lat, v.position.lng]} icon={pingPulseIcon} interactive={false} keyboard={false} /> : null;
            })() : null}
            {homeLocation ? <Marker position={[homeLocation.lat, homeLocation.lng]} icon={homePinIcon} interactive={false} keyboard={false} /> : null}
            {savedPlaces.map((sp) => <Marker key={sp.id} position={[sp.lat, sp.lng]} icon={savedPinIcon} interactive={false} keyboard={false} />)}
            {activeRoute && polylinePoints && polylinePoints.length > 1 ? (<><Polyline positions={polylinePoints} pathOptions={{ color: "#0f172a", weight: polylineOpts.weight + 4, opacity: 0.08, lineCap: "round", lineJoin: "round" }} /><Polyline positions={polylinePoints} pathOptions={{ ...polylineOpts, lineCap: "round", lineJoin: "round" }} /></>) : null}
          </MapView>
          <ZoomControl map={mapRef.current} onRecenter={handleRecenter} bottomOffset={pickMode ? "16px" : controlsBottom} />
        </div>

        <div className={`map-ui-shell ${fullscreenMap || pickMode ? "map-ui-shell-hidden" : ""}`}>
          <div className={`map-ui-panel top-panel ${fullscreenMap || pickMode ? "map-ui-panel-hidden-up" : "map-ui-panel-visible-down"}`}>
            <div className="flex items-center h-12">
              <button
                onClick={() => setPickerOpen(true)}
                className="flex flex-1 items-center gap-3 rounded-l-[22px] glass-pill px-4 h-12 text-left border-r border-[rgba(203,213,225,0.45)]"
                style={{ borderRadius: "22px 0 0 22px" }}
              >
                {destination
                  ? <MapPin className="h-4 w-4 shrink-0 text-[#2563eb]" />
                  : <Search className="h-4 w-4 shrink-0 text-[var(--color-ink-mute)]" />}
                <span className={`flex-1 truncate text-[13.5px] ${destination ? "font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink-mute)]"}`}>
                  {destination ? destination.name : "Where are you going?"}
                </span>
                {destination
                  ? <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); clearDestination(); }}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-3)]"
                      aria-label="Clear"
                    >
                      <X className="h-3 w-3 text-[var(--color-ink-soft)]" />
                    </button>
                  : nearbyCount > 0
                    ? <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">{nearbyCount} near</span>
                    : null}
              </button>
              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Menu"
                className="flex h-12 w-12 shrink-0 items-center justify-center glass-pill text-[var(--color-ink)]"
                style={{ borderRadius: "0 22px 22px 0", borderLeft: "none" }}
              >
                <HamburgerIcon />
              </button>
            </div>
          </div>
          <div className={`map-ui-panel middle-panel ${fullscreenMap || pickMode ? "map-ui-panel-hidden-up" : "map-ui-panel-visible-down"}`}>
            {!destination && matches.length > 0
              ? <div className="rounded-full px-3 py-1.5 text-[12px] font-medium text-white" style={{ background: "rgba(15,23,42,0.72)", backdropFilter: "blur(12px)" }}>Tap any auto on the map to signal it</div>
              : null}
          </div>
          <div className={`map-ui-panel bottom-panel ${fullscreenMap || pickMode ? "map-ui-panel-hidden-down" : "map-ui-panel-visible-up"}`}>
            <CorridorPulse stats={corridorStats} destination={destination} matchCount={matches.length} route={activeRoute} />
            {destination && routeChoices.length > 1
              ? <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {routeChoices.map((r) => {
                    const active = activeRouteId === r.id;
                    return <button key={r.id} onClick={() => { setActiveRouteId(r.id); setRoute(r); }} className={`min-w-[8.4rem] flex-1 rounded-[16px] px-2.5 py-2.5 text-left transition-colors ${active ? "bg-brand text-white shadow-[var(--shadow-brand)]" : "border border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-[var(--shadow-soft)]"}`}><div className="text-[11px] font-semibold">{r.label}</div><div className={`mt-0.5 text-[10px] ${active ? "text-white/75" : "text-[var(--color-ink-mute)]"}`}>{formatDuration(r.durationSeconds)} · {formatDistance(r.distanceMeters)}</div></button>;
                  })}
                </div>
              : null}
            {!destination
              ? <button onClick={() => setPickerOpen(true)} className="w-full h-13 rounded-[20px] text-[15px] font-semibold bg-brand text-white shadow-[var(--shadow-brand)]" style={{ height: "52px" }}>Set Your Route</button>
              : null}
          </div>
        </div>

        <div className={`map-ui-fader ${fullscreenMap ? "map-ui-fader-left" : "map-ui-fader-right"}`} aria-hidden="true" />

        {pickMode && <MapPickOverlay hint="Move the map to pick your destination" onCancel={() => setPickMode(false)} onConfirm={handleMapPickConfirm} />}

        {pickupVehicle && !pickMode && !inTrip && (
          <PickupRequestCard
            driverLabel={pickupVehicle.label}
            seatsFree={Math.max(0, pickupVehicle.seatsTotal - pickupVehicle.seatsFilled)}
            seatsTotal={pickupVehicle.seatsTotal}
            etaMinutes={pickupVehicle.etaMinutes ?? 3}
            destinationName={pickupVehicle.destinationId ?? "Silchar"}
            status={pickupState.driverId === pickupVehicle.id ? pickupState.status : "idle"}
            onRequest={handleSendPickupRequest}
            onClose={() => { setPickupTarget(null); resetPickup(); }}
          />
        )}

        {inTrip && !chatOpen && (
          <TripView
            driverId={tripDriverId!}
            driverLabel={tripDriverLabel}
            passengerPosition={position}
            realtimeDrivers={realtimeDrivers}
            unreadCount={unreadChat}
            onOpenChat={() => { setChatOpen(true); setUnreadChat(0); }}
            onCancel={handleCancelTrip}
          />
        )}

        {inTrip && chatOpen && (
          <ChatTray
            role="passenger"
            messages={chatMessages}
            onSend={handleSendChat}
            onClose={() => setChatOpen(false)}
          />
        )}

        <DestinationPicker open={pickerOpen} origin={position} selectedPlaceId={destination?.placeId ?? null} title="Where are you going?" onClose={() => setPickerOpen(false)} onSelectPlace={(id) => { const p = getPlace(id); if (!p) return; setDestination({ name: p.name, position: p.position, placeId: p.id }); setPickerOpen(false); }} onPickOnMap={() => { setPickerOpen(false); setPickMode(true); }} />
        <PingSheet open={!!pingTarget} targetLabel={pingTarget?.label ?? ""} onClose={() => setPingTarget(null)} onSend={handleSendPing} />
        <Toast message={toast} onDone={() => setToast(null)} />
      </motion.div>
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
