"use client";

import { useEffect, useState } from "react";

/**
 * Floating pill shown only on mobile (hidden ≥ lg where the preview sits in
 * the side column). Smooth-scrolls to the live preview and fades out while
 * scrolling so it never blocks the content.
 */
export function MobilePreviewButton() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    function onScroll() {
      const preview = document.getElementById("preview");
      if (!preview) return;
      const { top } = preview.getBoundingClientRect();
      // Hide when the preview is already on screen.
      setVisible(top > window.innerHeight * 0.85 || top < -preview.offsetHeight);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href="#preview"
      aria-label="Jump to live preview"
      className={`fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-on-brand shadow-lg shadow-black/20 transition-all duration-300 active:scale-95 lg:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="7" y="2.5" width="10" height="19" rx="2.5" stroke="currentColor" strokeWidth="2" />
        <path d="M11 18.5h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      Preview
    </a>
  );
}
