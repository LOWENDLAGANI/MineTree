"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";

/**
 * Copy-URL button that upgrades to the native mobile share sheet
 * (navigator.share) when the platform supports it.
 *
 * HYDRATION FIX: `navigator` doesn't exist during SSR, so we always render the
 * copy variant first (server + first client render match), then swap to the
 * share variant in an effect. No more server/client markup mismatch.
 */
export function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Public URL copied to clipboard.");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy. Your browser blocked clipboard access.");
    }
  }

  async function share() {
    try {
      await navigator.share({ title: "My MineTree", url });
    } catch (err) {
      // AbortError = user dismissed the sheet — not an error worth a toast.
      if ((err as DOMException)?.name === "AbortError") return;
      // Share failed (unsupported content, permission) — fall back to copy.
      await copy();
    }
  }

  if (canShare) {
    return (
      <button
        type="button"
        onClick={share}
        title={`Share ${url}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 transition-all hover:bg-emerald-500/20 active:scale-95"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3v13M8 6.5L12 3l4 3.5M6 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Share
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${url}`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-2.5 py-1 text-xs text-muted transition-all hover:border-brand/50 hover:text-body active:scale-95"
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden className="text-emerald-400">
          <path
            d="M5 12.5l4.5 4.5L19 7"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-check-draw"
          />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}
      {copied ? "Copied!" : "Copy URL"}
    </button>
  );
}
