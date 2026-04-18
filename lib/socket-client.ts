"use client";

import { io, type Socket } from "socket.io-client";

const TOKEN_STORAGE_KEY = "fixahead_auth_token";
let socket: Socket | null = null;

export function getSocket() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
      autoConnect: false,
      auth: {
        token: window.localStorage.getItem(TOKEN_STORAGE_KEY) || "",
      },
    });
  }

  socket.auth = {
    token: window.localStorage.getItem(TOKEN_STORAGE_KEY) || "",
  };

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}
