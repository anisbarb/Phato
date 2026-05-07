import http from "node:http";
import { WebSocketServer } from "ws";
import app from "./app";
import { logger } from "./lib/logger";
import {
  addPassengerSocket,
  handleDriverLocation,
  removeDriver,
  removePassengerSocket,
  routePickupRequest,
  routePickupResponse,
  routeChatMessage,
  type DriverLocation,
} from "./lib/locationHub";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/api/ws/location" });

wss.on("connection", (ws) => {
  let role: "driver" | "passenger" | null = null;
  let driverId: string | null = null;
  let passengerId: string | null = null;

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "identify_driver") {
        role = "driver";
        driverId = msg.id;

      } else if (msg.type === "driver_location" && role === "driver") {
        handleDriverLocation({
          id: msg.id, lat: msg.lat, lng: msg.lng,
          headingDeg: msg.headingDeg ?? 0,
          seatsFree: msg.seatsFree ?? 0,
          seatsTotal: msg.seatsTotal ?? 6,
          destinationId: msg.destinationId ?? null,
          updatedAt: msg.updatedAt ?? Date.now(),
        } as DriverLocation, ws);

      } else if (msg.type === "driver_offline" && role === "driver") {
        if (driverId) removeDriver(driverId);

      } else if (msg.type === "subscribe_passengers") {
        role = "passenger";
        passengerId = msg.passengerId ?? null;
        addPassengerSocket(ws, passengerId ?? undefined);

      } else if (msg.type === "pickup_request") {
        routePickupRequest({
          requestId: msg.requestId, passengerId: msg.passengerId,
          driverId: msg.driverId, passengerLat: msg.passengerLat,
          passengerLng: msg.passengerLng, passengerDestId: msg.passengerDestId ?? null,
          sentAt: msg.sentAt ?? Date.now(),
        });

      } else if (msg.type === "pickup_response") {
        routePickupResponse({
          requestId: msg.requestId, driverId: msg.driverId,
          passengerId: msg.passengerId, accepted: !!msg.accepted,
        });

      } else if (msg.type === "chat_message") {
        routeChatMessage({
          chatId: msg.chatId, fromId: msg.fromId, toId: msg.toId,
          role: msg.role, text: msg.text, sentAt: msg.sentAt ?? Date.now(),
        });
      }
    } catch {}
  });

  ws.on("close", () => {
    if (role === "driver" && driverId) removeDriver(driverId);
    else if (role === "passenger") removePassengerSocket(ws, passengerId ?? undefined);
  });
});

server.listen(port, () => {
  logger.info({ port }, "Server listening");
});
