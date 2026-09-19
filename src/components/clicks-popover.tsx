"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tiny popover chart: 30 daily bars (clicks over the last 30 days) for one
 * link. Opens when the click-count badge is tapped; closes on outside click
 * or Escape.
 */
export function ClicksPopover({
  series,
  total,
  title,
}: {
  /** 30 daily buckets, oldest → newest. */
  series: number[];
  total: number;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const max = Math.max(1, ...series);
  const bestDay = series.indexOf(max);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Click chart for ${title}: ${total} clicks in 30 days`}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-xs font-medium text-body transition-all hover:bg-edge active:scale-95"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        {total}
      </button>

      {open ? (
        <div className="animate-pop-in absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-edge bg-surface p-3 shadow-xl shadow-black/20">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-xs font-semibold text-body">Last 30 days</p>
            <p className="text-xs text-muted">
              {total} click{total === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex h-14 items-end gap-[2px]" aria-hidden>
            {series.map((v, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-sm transition-all ${
                  v === max && v > 0 ? "bg-brand-strong" : "bg-brand/50"
                }`}
                style={{
                  height: `${Math.max(v > 0 ? 12 : 3, (v / max) * 100)}%`,
                  transitionDelay: `${i * 8}ms`,
                }}
                title={`${v} click${v === 1 ? "" : "s"}`}
              />
            ))}
          </div>

          <div className="mt-1.5 flex justify-between text-[10px] text-faint">
            <span>30d ago</span>
            <span>
              {max > 0
                ? `Best day: ${max} (${bestDay === series.length - 1 ? "today" : `${series.length - 1 - bestDay}d ago`})`
                : "No clicks yet"}
            </span>
            <span>Today</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
