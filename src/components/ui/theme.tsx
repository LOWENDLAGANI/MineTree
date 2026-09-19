"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type UiMode = "light" | "dark";

const ModeContext = createContext<{
  mode: UiMode;
  toggle: () => void;
}>({ mode: "light", toggle: () => {} });

/**
 * Inlined in <head> by the root layout BEFORE any paint: applies the saved
 * theme (or the light default) so there is no white/black flash on load.
 * Keep this file tiny — it runs on every page.
 */
export const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem("mt-ui-mode");
    var mode = saved === "dark" || saved === "light" ? saved : "light";
    if (mode === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export function UiThemeProvider({ children }: { children: React.ReactNode }) {
  // Start on the default; sync from the DOM class (set by the init script)
  // after mount so SSR markup and the first client render always match.
  const [mode, setMode] = useState<UiMode>("light");

  useEffect(() => {
    setMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next: UiMode = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem("mt-ui-mode", next);
      } catch {
        /* private mode etc. — theme just won't persist */
      }
      return next;
    });
  }, []);

  return <ModeContext.Provider value={{ mode, toggle }}>{children}</ModeContext.Provider>;
}

export function useUiMode() {
  return useContext(ModeContext);
}

/** Sun/moon toggle button used in the dashboard topbar and auth pages. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { mode, toggle } = useUiMode();
  const dark = mode === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-edge text-muted transition-colors hover:bg-surface-2 hover:text-body active:scale-95 ${className}`}
    >
      {dark ? (
        // Sun (currently dark → click for light)
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        // Moon (currently light → click for dark)
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M20 13.2A8.5 8.5 0 0 1 10.8 4 7.5 7.5 0 1 0 20 13.2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
