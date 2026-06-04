import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

export interface RealtimeEvent {
  type: "staff-availability-update" | "game-update" | "game-info-update";
  data: any;
  timestamp: number;
}

let io: SocketIOServer | null = null;

export function initializeWebSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? undefined : "*",
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log("[WebSocket] Client connected:", socket.id);

    // Join user to their own room for targeted updates
    socket.on("join-user-room", (userId: string) => {
      socket.join(`user-${userId}`);
      console.log(`[WebSocket] User ${userId} joined their room`);
    });

    // Join admin room for admin-specific updates
    socket.on("join-admin-room", () => {
      socket.join("admin");
      console.log(`[WebSocket] Client ${socket.id} joined admin room`);
    });

    // Join staff portal room for staff-specific updates
    socket.on("join-staff-room", () => {
      socket.join("staff-portal");
      console.log(`[WebSocket] Client ${socket.id} joined staff-portal room`);
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Client disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("WebSocket not initialized");
  }
  return io;
}

/**
 * Broadcast staff availability update to all connected clients
 */
export function broadcastStaffAvailabilityUpdate(data: any) {
  if (!io) return;
  
  // Broadcast to admin room
  io.to("admin").emit("staff-availability-updated", {
    type: "staff-availability-update",
    data,
    timestamp: Date.now(),
  });

  // Broadcast to staff portal room
  io.to("staff-portal").emit("staff-availability-updated", {
    type: "staff-availability-update",
    data,
    timestamp: Date.now(),
  });
}

/**
 * Broadcast game update to all connected clients
 */
export function broadcastGameUpdate(data: any) {
  if (!io) return;

  // Broadcast to admin room
  io.to("admin").emit("game-updated", {
    type: "game-update",
    data,
    timestamp: Date.now(),
  });

  // Broadcast to staff portal room
  io.to("staff-portal").emit("game-updated", {
    type: "game-update",
    data,
    timestamp: Date.now(),
  });
}

/**
 * Broadcast game info update (score, penalties, etc.) to all connected clients
 */
export function broadcastGameInfoUpdate(gameId: string, data: any) {
  if (!io) return;

  // Broadcast to admin room
  io.to("admin").emit("game-info-updated", {
    type: "game-info-update",
    gameId,
    data,
    timestamp: Date.now(),
  });

  // Broadcast to staff portal room
  io.to("staff-portal").emit("game-info-updated", {
    type: "game-info-update",
    gameId,
    data,
    timestamp: Date.now(),
  });
}
