"use client";

import { useEffect, useRef } from "react";

export function usePolling(callback: () => void, intervalMs: number, enabled = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const tick = () => savedCallback.current();
    const id = window.setInterval(tick, intervalMs);
    tick();
    return () => window.clearInterval(id);
  }, [intervalMs, enabled]);
}
