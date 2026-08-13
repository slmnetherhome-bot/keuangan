"use client";

import { useEffect, useRef } from "react";

interface UseRealtimeRefreshOptions {
  intervalMs?: number;
}

/**
 * Memicu refresh data ketika:
 * 1. Service worker menerima push notification (postMessage DATA_UPDATED) -> instan
 * 2. Polling berkala sebagai fallback (hanya saat tab aktif)
 */
export function useRealtimeRefresh(
  onRefresh: () => void,
  { intervalMs = 30000 }: UseRealtimeRefreshOptions = {}
) {
  const refreshRef = useRef(onRefresh);

  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "DATA_UPDATED") {
        refreshRef.current();
      }
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener(
        "message",
        handleMessage as EventListener
      );
    }

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshRef.current();
      }
    }, intervalMs);

    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener(
          "message",
          handleMessage as EventListener
        );
      }
      clearInterval(interval);
    };
  }, [intervalMs]);
}