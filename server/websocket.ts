import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { AttendanceRecord, TickSheetMark, Artist } from "@shared/schema";
import { log } from "./vite";

export interface WebSocketMessage {
  type: "attendance_update" | "tick_sheet_update" | "artist_status_update";
  data: any;
}

export interface AttendanceUpdateData {
  record: AttendanceRecord;
  artist: Artist;
  action: "sign_in" | "sign_out" | "update";
}

export interface TickSheetUpdateData {
  tickSheetId: string;
  mark?: TickSheetMark;
  artistId: string;
  action: "mark" | "unmark" | "reset";
}

export interface ArtistStatusUpdateData {
  artistId: string;
  status: "active" | "out" | "long_term_out";
}

let wss: WebSocketServer | null = null;

export function setupWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    log("WebSocket client connected");

    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        log(`Received WebSocket message: ${JSON.stringify(data)}`);
      } catch (error) {
        log(`Failed to parse WebSocket message: ${error}`);
      }
    });

    ws.on("close", () => {
      log("WebSocket client disconnected");
    });

    ws.on("error", (error) => {
      log(`WebSocket error: ${error}`);
    });

    ws.send(JSON.stringify({ type: "connected", data: { message: "Connected to WebSocket server" } }));
  });

  log("WebSocket server initialized on /ws");
}

export function broadcastAttendanceUpdate(data: AttendanceUpdateData): void {
  broadcast({
    type: "attendance_update",
    data,
  });
}

export function broadcastTickSheetUpdate(data: TickSheetUpdateData): void {
  broadcast({
    type: "tick_sheet_update",
    data,
  });
}

export function broadcastArtistStatusUpdate(data: ArtistStatusUpdateData): void {
  broadcast({
    type: "artist_status_update",
    data,
  });
}

function broadcast(message: WebSocketMessage): void {
  if (!wss) {
    log("Warning: WebSocket server not initialized");
    return;
  }

  const messageStr = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}
