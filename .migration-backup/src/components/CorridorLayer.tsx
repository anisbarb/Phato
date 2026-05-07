import { memo } from "react";
import { Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import { ALL_CORRIDORS, CORRIDOR_LABELS } from "@/lib/corridor";

function makeWaypointIcon(name: string, anchor: "left" | "right"): L.DivIcon {
  const dir = anchor === "right" ? "margin-left:8px" : "margin-right:8px;transform:translateX(-100%)";
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:0;height:0">
      <div style="position:absolute;top:-4px;left:-4px;width:8px;height:8px;border-radius:50%;background:#2563eb;border:2px solid #fff;box-shadow:0 1px 4px rgba(37,99,235,0.35)"></div>
      <div style="position:absolute;top:-5px;${dir};white-space:nowrap;font-size:10px;font-weight:600;color:#2563eb;text-shadow:0 1px 3px rgba(255,255,255,1),0 0 8px rgba(255,255,255,0.9);pointer-events:none;letter-spacing:0.02em">${name}</div>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

const WAYPOINT_ICONS = CORRIDOR_LABELS.map((w) => ({
  ...w,
  icon: makeWaypointIcon(w.name, w.anchor),
}));

function CorridorLayer() {
  return (
    <>
      {ALL_CORRIDORS.map((corridor, ci) => (
        <Polyline
          key={`corridor-band-${ci}`}
          positions={corridor.map((p) => [p.lat, p.lng])}
          pathOptions={{
            color: "#2563eb",
            weight: 22,
            opacity: 0.03,
            lineCap: "round",
            lineJoin: "round",
            interactive: false,
          }}
        />
      ))}
      {ALL_CORRIDORS.map((corridor, ci) => (
        <Polyline
          key={`corridor-under-${ci}`}
          positions={corridor.map((p) => [p.lat, p.lng])}
          pathOptions={{
            color: "#0f172a",
            weight: 4,
            opacity: 0.05,
            lineCap: "round",
            lineJoin: "round",
            interactive: false,
          }}
        />
      ))}
      {ALL_CORRIDORS.map((corridor, ci) => (
        <Polyline
          key={`corridor-dash-${ci}`}
          positions={corridor.map((p) => [p.lat, p.lng])}
          pathOptions={{
            color: "#2563eb",
            weight: 2,
            opacity: 0.24,
            lineCap: "round",
            lineJoin: "round",
            dashArray: "6 10",
            interactive: false,
          }}
        />
      ))}
      {WAYPOINT_ICONS.map((wpt) => (
        <Marker
          key={`wpt-${wpt.name}`}
          position={[wpt.pos.lat, wpt.pos.lng]}
          icon={wpt.icon}
          interactive={false}
          keyboard={false}
          zIndexOffset={-100}
        />
      ))}
    </>
  );
}

export default memo(CorridorLayer);
