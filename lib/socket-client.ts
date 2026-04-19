"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getRealtimeSocket(token: string) {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: false,
    });
  } else {
    socket.auth = { token };
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectRealtimeSocket() {
  socket?.disconnect();
  socket = null;
}
