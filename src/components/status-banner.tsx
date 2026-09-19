"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const MESSAGES: Record<string, string> = {
  username: "Usernames are 3–24 chars: lowercase letters, numbers, hyphens.",
  username_taken: "That username is taken. Try another.",
  save: "Could not save changes. Try again.",
  file: "Choose a file first.",
  toobig: "Images must be under 2 MB.",
  type: "Only PNG, JPG, WEBP, or GIF allowed.",
  upload: "Upload failed — check the storage bucket exists.",
};

/**
 * Animated success/error banner for the settings page. Reads the ?saved /
 * ?error params the server actions redirect with, shows a friendly message,
 * fires a matching toast, and cleans the URL so refreshes don't re-show it.
 */
export function StatusBanner({ saved, error }: { saved?: string; error?: string }) {
  const toast = useToast();
  const fired = useRef(false);

  const hasError = Boolean(error && MESSAGES[error]);
  const hasSaved = Boolean(saved) && !hasError;

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    if (hasError && error) {
      toast.error(MESSAGES[error]);
    } else if (hasSaved) {
      toast.success("Changes saved.");
    }

    // Strip the status params so refresh/back doesn't replay them.
    if (hasError || hasSaved) {
      const url = new URL(window.location.href);
      url.searchParams.delete("saved");
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasSaved && !hasError) return null;

  return (
    <div
      role="status"
      className={cn(
        "animate-fade-in-up flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm",
        hasSaved
          ? "border-brand/30 bg-brand/10 text-brand-strong"
          : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
      )}
    >
      {hasSaved ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-emerald-400">
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-red-400">
          <circle cx="12" cy="12" r="10" className="fill-red-500/15" />
          <path d="M12 7.5v6 M12 16.5h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )}
      {hasSaved ? "Saved." : MESSAGES[error as string]}
    </div>
  );
}
