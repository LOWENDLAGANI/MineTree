"use client";

import { useState } from "react";
import { QrCodeModal } from "@/components/qr-code-modal";

/** Client button + modal pair so the dashboard header can stay a server component. */
export function QrButton({ url }: { url: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Show QR code"
        className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-2.5 py-1 text-xs text-muted transition-all hover:border-brand/50 hover:text-body active:scale-95"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <path d="M14 14h3v3h-3zM18 18h3v3h-3z" fill="currentColor" />
        </svg>
        QR
      </button>
      <QrCodeModal url={url} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
