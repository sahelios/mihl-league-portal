import { useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface RealtimeEvent {
  type: "staff-availability-update" | "game-update" | "game-info-update";
  data: any;
  timestamp: number;
}

let socket: Socket | null = null;

export function useRealtimeUpdates(
  onStaffAvailabilityUpdate?: (data: any) => void,
  onGameUpdate?: (data: any) => void,
  onGameInfoUpdate?: (gameId: string, data: any) => void,
  roomType?: "admin" | "staff-portal"
) {
  useEffect(() => {
    // Initialize socket connection if not already connected
    if (!socket) {
      socket = io(window.location.origin, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socket.on("connect", () => {
        console.log("[WebSocket] Connected:", socket?.id);
        
        // Join appropriate room
        if (roomType === "admin") {
          socket?.emit("join-admin-room");
        } else if (roomType === "staff-portal") {
          socket?.emit("join-staff-room");
        }
      });

      socket.on("disconnect", () => {
        console.log("[WebSocket] Disconnected");
      });

      socket.on("connect_error", (error) => {
        console.error("[WebSocket] Connection error:", error);
      });
    }

    // Set up event listeners
    if (onStaffAvailabilityUpdate) {
      socket?.on("staff-availability-updated", (event: RealtimeEvent) => {
        console.log("[WebSocket] Staff availability update:", event);
        onStaffAvailabilityUpdate(event.data);
      });
    }

    if (onGameUpdate) {
      socket?.on("game-updated", (event: RealtimeEvent) => {
        console.log("[WebSocket] Game update:", event);
        onGameUpdate(event.data);
      });
    }

    if (onGameInfoUpdate) {
      socket?.on("game-info-updated", (event: any) => {
        console.log("[WebSocket] Game info update:", event);
        onGameInfoUpdate(event.gameId, event.data);
      });
    }

    // Cleanup function
    return () => {
      // Don't disconnect socket here - keep it alive for other components
      // Just remove listeners
      if (onStaffAvailabilityUpdate) {
        socket?.off("staff-availability-updated", onStaffAvailabilityUpdate);
      }
      if (onGameUpdate) {
        socket?.off("game-updated", onGameUpdate);
      }
      if (onGameInfoUpdate) {
        socket?.off("game-info-updated", onGameInfoUpdate);
      }
    };
  }, [onStaffAvailabilityUpdate, onGameUpdate, onGameInfoUpdate, roomType]);

  return {
    connected: socket?.connected ?? false,
    socket,
  };
}

/**
 * Join a specific user room for targeted updates
 */
export function joinUserRoom(userId: string) {
  if (socket?.connected) {
    socket.emit("join-user-room", userId);
  }
}

/**
 * Disconnect the WebSocket
 */
export function disconnectWebSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
