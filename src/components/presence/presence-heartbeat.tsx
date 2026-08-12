"use client";

import { useEffect } from "react";

const HEARTBEAT_INTERVAL_MS = 30_000;

export function PresenceHeartbeat() {
  useEffect(() => {
    async function heartbeat() {
      if (document.visibilityState !== "visible") return;
      try {
        await fetch("/api/live-presence", {
          method: "POST",
          cache: "no-store",
        });
      } catch {
        // The next interval retries transient network failures.
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void heartbeat();
    };

    void heartbeat();
    const timer = window.setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
