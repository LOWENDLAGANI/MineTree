"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/components/ui/toast";

/**
 * Modal showing a scannable QR code for the user's public tree URL, with a
 * one-click SVG download (vector — prints crisply on business cards).
 */
export function QrCodeModal({ url, open, onClose }: { url: string; open: boolean; onClose: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function downloadSvg() {
    const svg = wrapRef.current?.querySelector("svg");
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "minetree-qr.svg";
    a.click();
    URL.revokeObjectURL(href);
    toast.success("QR code downloaded.");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="QR code for your tree"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-pop-in w-full max-w-xs rounded-2xl border border-edge bg-surface p-6 text-center shadow-2xl">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold text-body">Share your tree</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-faint transition-colors hover:bg-surface-2 hover:text-body"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="mb-4 text-xs text-muted">Scan to open minetree.app</p>

        <div
          ref={wrapRef}
          className="mx-auto w-fit rounded-xl bg-white p-4 shadow-inner"
        >
          <QRCodeSVG value={url} size={180} marginSize={2} aria-label={`QR code for ${url}`} />
        </div>

        <p className="mt-3 truncate font-mono text-[11px] text-muted">{url}</p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={downloadSvg}
            className="flex-1 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-on-brand transition-transform hover:bg-brand-strong active:scale-95"
          >
            Download SVG
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-edge px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
