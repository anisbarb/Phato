import type { WebSocket } from "ws";

export type DriverLocation = {
  id: string;
  lat: number;
  lng: number;
  headingDeg: number;
  seatsFree: number;
  seatsTotal: number;
  destinationId: string | null;
  updatedAt: number;
};

const drivers = new Map<string, DriverLocation>();
const driverSockets = new Map<string, WebSocket>();
const passengerSockets = new Set<WebSocket>();
const passengerSocketMap = new Map<string, WebSocket>();

// active trips: driverId <-> passengerId
const activeTrips = new Map<string, string>(); // driverId -> passengerId
const passengerTrips = new Map<string, string>(); // passengerId -> driverId

export function handleDriverLocation(data: DriverLocation, ws: WebSocket) {
  drivers.set(data.id, data);
  driverSockets.set(data.id, ws);
  broadcastToPassengers();

  // Also push to paired passenger if in an active trip
  const passengerId = activeTrips.get(data.id);
  if (passengerId) {
    const passengerWs = passengerSocketMap.get(passengerId);
    if (passengerWs && passengerWs.readyState === 1) {
      passengerWs.send(JSON.stringify({ type: "trip_driver_update", driver: data }));
    }
  }
}

export function removeDriver(id: string) {
  drivers.delete(id);
  driverSockets.delete(id);
  const pairedPassenger = activeTrips.get(id);
  if (pairedPassenger) {
    activeTrips.delete(id);
    passengerTrips.delete(pairedPassenger);
  }
  broadcastToPassengers();
}

export function addPassengerSocket(ws: WebSocket, passengerId?: string) {
  passengerSockets.add(ws);
  if (passengerId) passengerSocketMap.set(passengerId, ws);
  ws.send(JSON.stringify({ type: "driver_update", drivers: Array.from(drivers.values()) }));
}

export function removePassengerSocket(ws: WebSocket, passengerId?: string) {
  passengerSockets.delete(ws);
  if (passengerId) {
    passengerSocketMap.delete(passengerId);
    const pairedDriver = passengerTrips.get(passengerId);
    if (pairedDriver) {
      activeTrips.delete(pairedDriver);
      passengerTrips.delete(passengerId);
    }
  }
}

export function routePickupRequest(msg: {
  requestId: string;
  passengerId: string;
  driverId: string;
  passengerLat: number;
  passengerLng: number;
  passengerDestId: string | null;
  sentAt: number;
}) {
  const driverWs = driverSockets.get(msg.driverId);
  if (!driverWs || driverWs.readyState !== 1) return false;
  driverWs.send(JSON.stringify({ type: "pickup_request", ...msg }));
  return true;
}

export function routePickupResponse(msg: {
  requestId: string;
  driverId: string;
  passengerId: string;
  accepted: boolean;
}) {
  const passengerWs = passengerSocketMap.get(msg.passengerId);
  if (!passengerWs || passengerWs.readyState !== 1) return false;
  passengerWs.send(JSON.stringify({ type: "pickup_response", ...msg }));

  // If accepted, register active trip
  if (msg.accepted) {
    activeTrips.set(msg.driverId, msg.passengerId);
    passengerTrips.set(msg.passengerId, msg.driverId);
  }
  return true;
}

export function routeChatMessage(msg: {
  chatId: string;
  fromId: string;
  toId: string;
  role: "driver" | "passenger";
  text: string;
  sentAt: number;
}) {
  // Route to recipient
  if (msg.role === "driver") {
    // Driver sent → passenger receives
    const passengerWs = passengerSocketMap.get(msg.toId);
    if (passengerWs && passengerWs.readyState === 1) {
      passengerWs.send(JSON.stringify({ type: "chat_message", ...msg }));
    }
  } else {
    // Passenger sent → driver receives
    const driverWs = driverSockets.get(msg.toId);
    if (driverWs && driverWs.readyState === 1) {
      driverWs.send(JSON.stringify({ type: "chat_message", ...msg }));
    }
  }
}

function broadcastToPassengers() {
  const payload = JSON.stringify({ type: "driver_update", drivers: Array.from(drivers.values()) });
  for (const ws of passengerSockets) {
    if (ws.readyState === 1) {
      ws.send(payload);
    }
  }
}
