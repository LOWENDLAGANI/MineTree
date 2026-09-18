"use client";

import { useEffect, useRef } from "react";

/**
 * Fires a page_view once on mount, then intercepts clicks on any element
 * carrying [data-link-id] and beacons them to /api/click. Uses
 * navigator.sendBeacon so the request survives navigation to the target URL
 * and never blocks the user.
 */
export function ClickTracker({ username }: { username: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const payload = JSON.stringify({
      type: "page_view",
      username,
      referrer: typeof document !== "undefined" ? document.referrer : "",
    });

    const url = "/api/click";
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
    } else {
      fetch(url, {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
  }, [username]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest("[data-link-id]");
      if (!target) return;

      const linkId = target.getAttribute("data-link-id");
      if (!linkId) return;

      const payload = JSON.stringify({
        type: "link_click",
        linkId,
        referrer: typeof document !== "undefined" ? document.referrer : "",
      });

      // Let the browser fire the beacon even as the tab navigates away.
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/click", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/click", {
          method: "POST",
          body: payload,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
