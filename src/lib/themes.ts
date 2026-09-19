import type { Json, ThemeConfig } from "@/lib/database.types";

export type ResolvedTheme = {
  preset: string;
  background: string;
  surface: string;
  text: string;
  subtext: string;
  accent: string;
  accentText: string;
  buttonStyle: NonNullable<ThemeConfig["buttonStyle"]>;
  font: NonNullable<ThemeConfig["font"]>;
  fontFamily: string;
  cornerStyle: NonNullable<ThemeConfig["cornerStyle"]>;
  avatarShape: NonNullable<ThemeConfig["avatarShape"]>;
};

export const CORNER_RADII: Record<NonNullable<ThemeConfig["cornerStyle"]>, string> = {
  rounded: "0.75rem",
  pill: "9999px",
  square: "0.125rem",
};

export const AVATAR_RADII: Record<NonNullable<ThemeConfig["avatarShape"]>, string> = {
  circle: "9999px",
  squircle: "1.5rem",
  square: "0.25rem",
};

export const THEME_PRESETS: Record<
  string,
  Omit<
    ResolvedTheme,
    | "preset"
    | "buttonStyle"
    | "font"
    | "fontFamily"
    | "cornerStyle"
    | "avatarShape"
  >
> = {
  mint: {
    background: "linear-gradient(160deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)",
    surface: "rgba(255,255,255,0.75)",
    text: "#064e3b",
    subtext: "#047857",
    accent: "#10b981",
    accentText: "#ffffff",
  },
  midnight: {
    background: "linear-gradient(160deg, #0f172a 0%, #1e293b 55%, #334155 100%)",
    surface: "rgba(255,255,255,0.08)",
    text: "#f1f5f9",
    subtext: "#94a3b8",
    accent: "#38bdf8",
    accentText: "#0f172a",
  },
  sunset: {
    background: "linear-gradient(160deg, #fff7ed 0%, #ffedd5 45%, #fed7aa 100%)",
    surface: "rgba(255,255,255,0.72)",
    text: "#7c2d12",
    subtext: "#c2410c",
    accent: "#f97316",
    accentText: "#ffffff",
  },
  mono: {
    background: "linear-gradient(160deg, #fafafa 0%, #f4f4f5 60%, #e4e4e7 100%)",
    surface: "rgba(255,255,255,0.85)",
    text: "#18181b",
    subtext: "#71717a",
    accent: "#18181b",
    accentText: "#ffffff",
  },
  candy: {
    background: "linear-gradient(160deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)",
    surface: "rgba(255,255,255,0.75)",
    text: "#831843",
    subtext: "#be185d",
    accent: "#ec4899",
    accentText: "#ffffff",
  },
};

const FONT_STACKS: Record<NonNullable<ThemeConfig["font"]>, string> = {
  sans: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "var(--font-mono), ui-monospace, 'SF Mono', Menlo, monospace",
};

export function resolveTheme(config: Json | null | undefined): ResolvedTheme {
  const raw = (config && typeof config === "object" && !Array.isArray(config)
    ? config
    : {}) as Partial<ThemeConfig>;
  const cfg: ThemeConfig = {
    preset: typeof raw.preset === "string" ? (raw.preset as ThemeConfig["preset"]) : undefined,
    accent: typeof raw.accent === "string" ? raw.accent : undefined,
    background: typeof raw.background === "string" ? raw.background : undefined,
    buttonStyle: typeof raw.buttonStyle === "string" ? (raw.buttonStyle as ThemeConfig["buttonStyle"]) : undefined,
    font: typeof raw.font === "string" ? (raw.font as ThemeConfig["font"]) : undefined,
    cornerStyle: typeof raw.cornerStyle === "string" ? (raw.cornerStyle as ThemeConfig["cornerStyle"]) : undefined,
    avatarShape: typeof raw.avatarShape === "string" ? (raw.avatarShape as ThemeConfig["avatarShape"]) : undefined,
  };
  const presetKey = cfg.preset && cfg.preset in THEME_PRESETS ? cfg.preset : "mint";
  const base = THEME_PRESETS[presetKey];

  return {
    preset: presetKey,
    ...base,
    background: cfg.background?.trim() ? cfg.background : base.background,
    accent: cfg.accent?.trim() ? cfg.accent : base.accent,
    buttonStyle: cfg.buttonStyle ?? "solid",
    font: cfg.font ?? "sans",
    fontFamily: FONT_STACKS[cfg.font ?? "sans"],
    cornerStyle: cfg.cornerStyle ?? "rounded",
    avatarShape: cfg.avatarShape ?? "circle",
  };
}
