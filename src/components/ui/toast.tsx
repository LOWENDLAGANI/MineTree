"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastKind = "success" | "error" | "info" | "loading";

export type ToastOptions = {
  kind?: ToastKind;
  message: string;
  /** Auto-dismiss after this many ms. `loading` toasts stay until updated. */
  duration?: number;
};

type Toast = Required<Pick<ToastOptions, "message">> & {
  id: number;
  kind: ToastKind;
  duration: number;
  leaving: boolean;
};

type ToastApi = {
  toast: (opts: ToastOptions) => number;
  success: (message: string, duration?: number) => number;
  error: (message: string, duration?: number) => number;
  info: (message: string, duration?: number) => number;
  loading: (message: string) => number;
  /** Resolve a loading toast into success/error. */
  update: (id: number, opts: ToastOptions) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION: Record<ToastKind, number> = {
  success: 3000,
  error: 5000,
  info: 3500,
  loading: Infinity, // stays until update()/dismiss()
};

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ToastIcon({ kind }: { kind: ToastKind }) {
  if (kind === "loading") {
    return (
      <svg
        className="animate-spin text-emerald-400"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "success") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-emerald-400">
        <circle cx="12" cy="12" r="10" className="fill-emerald-500/15" />
        <path
          d="M7.5 12.5l3 3 6-6.5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-check-draw"
        />
      </svg>
    );
  }
  if (kind === "error") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-red-400">
        <circle cx="12" cy="12" r="10" className="fill-red-500/15" />
        <path d="M12 7.5v6 M12 16.5h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-sky-400">
      <circle cx="12" cy="12" r="10" className="fill-sky-500/15" />
      <path d="M12 11v5.5 M12 7.5h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const beginLeave = useCallback(
    (id: number) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
      );
      const timer = setTimeout(() => remove(id), 250);
      timers.current.set(id, timer);
    },
    [remove],
  );

  const schedule = useCallback(
    (id: number, duration: number) => {
      const existing = timers.current.get(id);
      if (existing) clearTimeout(existing);
      if (duration === Infinity) return;
      const timer = setTimeout(() => beginLeave(id), duration);
      timers.current.set(id, timer);
    },
    [beginLeave],
  );

  const push = useCallback(
    (opts: ToastOptions) => {
      const id = nextId.current++;
      const kind = opts.kind ?? "info";
      const duration = opts.duration ?? DEFAULT_DURATION[kind];
      setToasts((prev) => [
        // Cap visible toasts to keep things calm.
        ...prev.slice(-3),
        { id, kind, message: opts.message, duration, leaving: false },
      ]);
      schedule(id, duration);
      return id;
    },
    [schedule],
  );

  const api = useMemo<ToastApi>(() => {
    return {
      toast: push,
      success: (message, duration) => push({ kind: "success", message, duration }),
      error: (message, duration) => push({ kind: "error", message, duration }),
      info: (message, duration) => push({ kind: "info", message, duration }),
      loading: (message) => push({ kind: "loading", message }),
      update: (id, opts) => {
        const kind = opts.kind ?? "info";
        const duration = opts.duration ?? DEFAULT_DURATION[kind];
        setToasts((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, kind, message: opts.message, duration, leaving: false } : t,
          ),
        );
        schedule(id, duration);
      },
      dismiss: (id) => beginLeave(id),
    };
  }, [push, schedule, beginLeave]);

  // Clean up all timers on unmount.
  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const timer of map.values()) clearTimeout(timer);
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-surface/95 px-3.5 py-3 text-sm text-body shadow-lg shadow-black/20 backdrop-blur",
              t.kind === "success" && "border-brand/40",
              t.kind === "error" && "border-red-500/40",
              t.kind === "info" && "border-sky-500/40",
              t.kind === "loading" && "border-brand/40",
              t.leaving ? "animate-toast-out" : "animate-toast-in",
            )}
          >
            <span className="mt-0.5 shrink-0">
              <ToastIcon kind={t.kind} />
            </span>
            <p className="flex-1 leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => beginLeave(t.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded p-0.5 text-faint transition-colors hover:text-body"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}