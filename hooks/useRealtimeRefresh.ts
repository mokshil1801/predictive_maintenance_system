"use client";

import { useEffect } from "react";
import { getRealtimeSocket } from "@/lib/socket-client";

const WORKFLOW_EVENTS = [
  "report:created",
  "prediction:created",
  "priorityQueue:updated",
  "principalStatus:updated",
  "contractorTask:assigned",
  "contractorTask:started",
  "contractorTask:completed",
  "analytics:updated",
];

export function useRealtimeRefresh(onRefresh: () => void | Promise<void>) {
  useEffect(() => {
    const token = window.localStorage.getItem("fixahead_auth_token");
    if (!token) {
      return;
    }

    const socket = getRealtimeSocket(token);
    const refresh = () => {
      void onRefresh();
    };

    WORKFLOW_EVENTS.forEach((eventName) => socket.on(eventName, refresh));

    return () => {
      WORKFLOW_EVENTS.forEach((eventName) => socket.off(eventName, refresh));
    };
  }, [onRefresh]);
}
