"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";

export function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Public URL copied to clipboard.");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — your browser blocked clipboard access.");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${url}`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 transition-all hover:border-emerald-500/50 hover:text-white active:scale-95"
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
