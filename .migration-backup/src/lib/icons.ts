import L from "leaflet";
import type { LiveStatus } from "./types";

export const userIcon = L.divIcon({
  className: "user-divicon",
  html: '<div class="pulse-dot"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export const destinationIcon = L.divIcon({
  className: "dest-divicon",
  html: '<div class="dest-marker"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const carSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1L2 11v5h3"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>';

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}

export const carIcon = L.divIcon({
  className: "car-divicon",
  html: `<div class="car-marker">${carSvg}</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

type VehicleIconArgs = {
  label: string;
  status: LiveStatus;
  seatsFree: number;
  seatsTotal: number;
  headingDeg?: number;
  faded?: boolean;
};

export function vehicleIcon(args: VehicleIconArgs): L.DivIcon {
  const safe = escapeHtml(args.label);
  const statusCls =
    args.status === "moving" ? "moving" : args.status === "waiting" ? "waiting" : "offline";
  const seatsFree = Math.max(0, args.seatsFree);
  const isFull = seatsFree === 0;
  const badge = isFull
    ? '<div class="seat-badge full">FULL</div>'
    : `<div class="seat-badge">${seatsFree}/${args.seatsTotal}</div>`;
  const fadedCls = args.faded ? "car-faded" : "";
  const arrow =
    args.status === "moving" && args.headingDeg !== undefined
      ? `<div class="car-arrow-ring" style="transform:rotate(${args.headingDeg}deg)"></div>`
      : "";
  return L.divIcon({
    className: `veh-divicon ${fadedCls}`,
    html: `<div class="veh-cluster">${arrow}<div class="car-marker">${carSvg}<span class="status-dot ${statusCls}"></span>${badge}</div><div class="veh-label">${safe}</div></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export function passengerIcon(status: LiveStatus, faded = false): L.DivIcon {
  const statusCls =
    status === "waiting" ? "waiting" : status === "moving" ? "moving" : "offline";
  const fadedCls = faded ? "passenger-faded" : "";
  return L.divIcon({
    className: `passenger-divicon ${fadedCls}`,
    html: `<div class="passenger-marker"><span class="status-dot ${statusCls}"></span></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export const pingPulseIcon = L.divIcon({
  className: "ping-divicon",
  html: '<div class="ping-pulse"></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});
