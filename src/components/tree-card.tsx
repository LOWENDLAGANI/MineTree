"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/components/ui/toast";

/**
 * The Linktree-style "Your tree" card: big rounded tile in the theme accent
 * color with a circular QR medallion, share + edit buttons, and the link
 * count — matching the reference dashboard.
 */
export function TreeCard({
  username,
  displayName,
  avatarUrl,
  publicUrl,
  linkCount,
  themeAccent,
}: {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  publicUrl: string;
  linkCount: number;
  themeAccent: string;
}) {
  const toast = useToast();
  // SSR-safe share detection (avoids hydration mismatch).
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function share() {
    try {
      if (canShare) {
        await navigator.share({ title: `My MineTree`, url: publicUrl });
        return;
      }
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Public URL copied to clipboard.");
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
      toast.error("Couldn't share. Try copying the URL instead.");
    }
  }

  return (
    <div
      className="relative flex aspect-[4/5] w-full max-w-[340px] flex-col justify-between overflow-hidden rounded-3xl p-6 shadow-xl shadow-black/30 transition-transform duration-300 hover:-translate-y-1 sm:aspect-square"
      style={{ background: themeAccent }}
    >
      {/* Decorative soft circles */}
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div aria-hidden className="pointer-events-none absolute -bottom-14 -left-8 h-44 w-44 rounded-full bg-black/10" />

      {/* QR medallion */}
      <div className="relative mx-auto mt-2 flex h-44 w-44 items-center justify-center rounded-full bg-white p-3 shadow-lg">
        <QRCodeSVG value={publicUrl} size={128} marginSize={0} aria-label={`QR code for ${publicUrl}`} />
      </div>

      {/* Footer row */}
      <div className="relative flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-2xl font-extrabold text-white drop-shadow">
            {displayName || username}
          </p>
          <p className="text-sm font-medium text-white/80">
            {linkCount} link{linkCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={share}
            aria-label="Share your tree"
            title="Share"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow transition-transform hover:scale-105 active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M13 5.5l6 5.5-6 5.5v-3.7c-4.2 0-7 1.3-9 4.2.8-4.6 3.4-7.6 9-8V5.5Z"
                fill="currentColor"
              />
            </svg>
          </button>
          <Link
            href="/dashboard/settings"
            className="rounded-full bg-white/90 px-5 py-2.5 text-sm font-bold text-zinc-900 shadow transition-transform hover:scale-105 active:scale-95"
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}
