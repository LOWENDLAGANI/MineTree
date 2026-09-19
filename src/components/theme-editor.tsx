"use client";

import { useRef, useState, useTransition } from "react";
import type { ThemeConfig } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { resolveTheme, THEME_PRESETS } from "@/lib/themes";
import { saveTheme } from "@/app/dashboard/actions";
import { PhonePreview, type LinkRow } from "@/components/phone-preview";

type ThemeDraft = {
  preset?: ThemeConfig["preset"];
  accent?: string;
  background?: string;
  buttonStyle?: ThemeConfig["buttonStyle"];
  font?: ThemeConfig["font"];
  cornerStyle?: ThemeConfig["cornerStyle"];
  avatarShape?: ThemeConfig["avatarShape"];
};

const PRESET_CARDS: { key: NonNullable<ThemeConfig["preset"]>; name: string; swatch: string }[] = [
  { key: "mint", name: "Mint", swatch: "#10b981" },
  { key: "midnight", name: "Midnight", swatch: "#0f172a" },
  { key: "sunset", name: "Sunset", swatch: "#f97316" },
  { key: "mono", name: "Mono", swatch: "#18181b" },
  { key: "candy", name: "Candy", swatch: "#ec4899" },
];

const FONTS = ["sans", "serif", "mono"] as const;
const BUTTON_STYLES = ["solid", "outline", "soft"] as const;
const CORNER_STYLES = ["rounded", "pill", "square"] as const;
const AVATAR_SHAPES = ["circle", "squircle", "square"] as const;

type SaveState = "idle" | "saving" | "saved" | "error";

export function ThemeEditor({
  initial,
  initialPreviewProps,
}: {
  initial: ThemeDraft;
  initialPreviewProps: {
    username: string;
    displayName: string;
    bio: string;
    avatarUrl: string | null;
    links: LinkRow[];
  };
}) {
  const [draft, setDraft] = useState<ThemeDraft>(initial);
  const [, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const toast = useToast();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstPatch = useRef(true);

  const theme = resolveTheme(draft);

  function patch(p: Partial<ThemeDraft>) {
    const next = { ...draft, ...p };
    setDraft(next);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    if (isFirstPatch.current) {
      isFirstPatch.current = false;
      toast.info("Changes save automatically as you customize.");
    }

    // Debounced autosave; preview updates instantly regardless.
    saveTimer.current = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await saveTheme(next);
          if (res?.ok) {
            setSaveState("saved");
            if (resetTimer.current) clearTimeout(resetTimer.current);
            resetTimer.current = setTimeout(() => setSaveState("idle"), 2000);
          } else {
            setSaveState("error");
            toast.error(res?.message ?? "Couldn't save your theme.");
          }
        } catch {
          setSaveState("error");
          toast.error("Network error while saving your theme.");
        }
      });
    }, 600);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {/* Presets */}
        <div>
          <Label>Theme</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESET_CARDS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => patch({ preset: p.key, accent: undefined, background: undefined })}
                className={
                  draft.preset === p.key || (!draft.preset && p.key === "mint")
                    ? "rounded-lg border border-brand bg-brand/10 px-4 py-2 text-sm font-medium text-body transition-all active:scale-95"
                    : "rounded-lg border border-edge px-4 py-2 text-sm text-muted transition-all hover:-translate-y-0.5 hover:border-faint hover:text-body active:scale-95"
                }
              >
                <span
                  className="mr-2 inline-block h-3 w-3 rounded-full ring-1 ring-white/20"
                  style={{ background: p.swatch }}
                />
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Accent color */}
        <div>
          <Label htmlFor="accent">Accent color</Label>
          <div className="mt-2 flex items-center gap-3">
            <input
              id="accent"
              type="color"
              value={draft.accent ?? theme.accent}
              onChange={(e) => patch({ accent: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded-lg border border-edge bg-surface"
            />
            <span className="font-mono text-sm text-muted">
              {draft.accent ?? theme.accent}
            </span>
            {draft.accent ? (
              <Button variant="ghost" size="sm" onClick={() => patch({ accent: undefined })}>
                Reset
              </Button>
            ) : null}
          </div>
        </div>

        {/* Background color / gradient */}
        <div>
          <Label htmlFor="background">Background</Label>
          <p className="mt-1 text-xs text-muted">
            Pick a solid color, or blend your accent into a gradient.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center gap-2 rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-muted transition-colors hover:border-faint hover:text-body">
              <span
                className="h-5 w-5 rounded border border-white/20"
                style={{ background: draft.background ?? theme.background }}
              />
              Custom
              <input
                id="background"
                type="color"
                className="absolute inset-0 cursor-pointer opacity-0"
                value={/^#[0-9a-fA-F]{6}$/.test(draft.background ?? "")
                  ? (draft.background as string)
                  : "#09090b"}
                onChange={(e) => patch({ background: e.target.value })}
              />
            </label>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                patch({
                  background: `linear-gradient(160deg, ${(draft.accent ?? theme.accent)} 0%, #09090b 100%)`,
                })
              }
            >
              Blend with accent
            </Button>

            {draft.background ? (
              <Button variant="ghost" size="sm" onClick={() => patch({ background: undefined })}>
                Use preset
              </Button>
            ) : null}
          </div>
        </div>

        {/* Button style */}
        <div>
          <Label>Button style</Label>
          <div className="mt-2 flex gap-2">
            {BUTTON_STYLES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => patch({ buttonStyle: s })}
                className={
                  theme.buttonStyle === s
                    ? "rounded-lg border border-brand bg-brand/10 px-4 py-2 text-sm font-medium capitalize text-body transition-all active:scale-95"
                    : "rounded-lg border border-edge px-4 py-2 text-sm capitalize text-muted transition-all hover:-translate-y-0.5 hover:border-faint hover:text-body active:scale-95"
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Font */}
        <div>
          <Label>Font</Label>
          <div className="mt-2 flex gap-2">
            {FONTS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => patch({ font: f })}
                className={
                  theme.font === f
                    ? "rounded-lg border border-brand bg-brand/10 px-4 py-2 text-sm font-medium capitalize text-body transition-all active:scale-95"
                    : "rounded-lg border border-edge px-4 py-2 text-sm capitalize text-muted transition-all hover:-translate-y-0.5 hover:border-faint hover:text-body active:scale-95"
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Link corner shape */}
        <div>
          <Label>Link shape</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {CORNER_STYLES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => patch({ cornerStyle: s })}
                className={
                  theme.cornerStyle === s
                    ? "rounded-lg border border-brand bg-brand/10 px-4 py-2 text-sm font-medium capitalize text-body transition-all active:scale-95"
                    : "rounded-lg border border-edge px-4 py-2 text-sm capitalize text-muted transition-all hover:-translate-y-0.5 hover:border-faint hover:text-body active:scale-95"
                }
              >
                <span
                  className="mr-2 inline-block h-3 w-5 border-2 border-current"
                  style={{
                    borderRadius:
                      s === "pill" ? "9999px" : s === "square" ? "2px" : "6px",
                  }}
                />
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Avatar shape */}
        <div>
          <Label>Avatar shape</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {AVATAR_SHAPES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => patch({ avatarShape: s })}
                className={
                  theme.avatarShape === s
                    ? "rounded-lg border border-brand bg-brand/10 px-4 py-2 text-sm font-medium capitalize text-body transition-all active:scale-95"
                    : "rounded-lg border border-edge px-4 py-2 text-sm capitalize text-muted transition-all hover:-translate-y-0.5 hover:border-faint hover:text-body active:scale-95"
                }
              >
                <span
                  className="mr-2 inline-block h-4 w-4 bg-current"
                  style={{
                    borderRadius:
                      s === "circle" ? "9999px" : s === "squircle" ? "6px" : "2px",
                  }}
                />
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Save status pill */}
        <div className="flex items-center gap-2" aria-live="polite">
          {saveState === "saving" ? (
            <span className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-edge bg-surface px-3 py-1 text-xs text-muted">
              <svg className="animate-spin text-emerald-400" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Saving…
            </span>
          ) : saveState === "saved" ? (
            <span className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-medium text-brand-strong">
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
              Saved
            </span>
          ) : saveState === "error" ? (
            <span className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-300">
              Save failed. Try again
            </span>
          ) : (
            <span className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-edge bg-surface-2/60 px-3 py-1 text-xs text-muted">
              Changes save automatically.
            </span>
          )}
        </div>
      </div>

      {/* Live preview */}
      <aside className="self-start lg:sticky lg:top-20">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Live preview
        </h2>
        <PhonePreview
          username={initialPreviewProps.username}
          displayName={initialPreviewProps.displayName}
          bio={initialPreviewProps.bio}
          avatarUrl={initialPreviewProps.avatarUrl}
          links={initialPreviewProps.links}
          theme={theme}
        />
      </aside>
    </div>
  );
}
