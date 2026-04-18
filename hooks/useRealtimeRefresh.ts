"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket-client";

export function useRealtimeRefresh(events: string[], onRefresh: () => void) {
  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      return;
    }

    events.forEach((eventName) => socket.on(eventName, onRefresh));

    return () => {
      events.forEach((eventName) => socket.off(eventName, onRefresh));
    };
  }, [events, onRefresh]);
}
