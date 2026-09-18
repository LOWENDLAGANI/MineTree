"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    // Respect reduced motion by jumping straight to the value.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return value;
}

function StatCard({
  label,
  value,
  hint,
  delay,
}: {
  label: string;
  value: number;
  hint?: string;
  delay: number;
}) {
  const displayed = useCountUp(value);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-4",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5",
        mounted ? "animate-fade-in-up" : "opacity-0",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* subtle accent wash on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-emerald-500/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
      />
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-white">
        {displayed.toLocaleString()}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-zinc-600">{hint}</p> : null}
    </div>
  );
}

export function StatCards({
  views7,
  views30,
  clicks7,
  clicks30,
}: {
  views7: number;
  views30: number;
  clicks7: number;
  clicks30: number;
}) {
  const ctr =
    views30 > 0 ? `${Math.round((clicks30 / views30) * 100)}% click-through` : "No traffic yet";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Views (7d)" value={views7} delay={0} />
      <StatCard label="Views (30d)" value={views30} delay={70} />
      <StatCard label="Clicks (7d)" value={clicks7} delay={140} />
      <StatCard label="Clicks (30d)" value={clicks30} delay={210} hint={ctr} />
    </div>
  );
}
