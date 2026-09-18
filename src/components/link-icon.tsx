import { cn } from "@/lib/utils";

const PATHS: Record<string, string> = {
  link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M3.6 9h16.8 M3.6 15h16.8 M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z",
  mail: "M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z M22 7l-10 7L2 7",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z",
  music: "M9 18V5l12-2v13 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  video: "m22 8-6 4 6 4V8Z M2 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8Z",
  cart: "M6 6h15l-1.5 8.5a2 2 0 0 1-2 1.5H8.6a2 2 0 0 1-2-1.55L4.6 3.55A2 2 0 0 0 2.66 2H1 M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm10 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2Z",
  heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l8.84 8.84 8.84-8.84a5.5 5.5 0 0 0 0-7.78Z",
  calendar: "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z M14 2v6h6 M9 13h6 M9 17h6",
  github:
    "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4 M9 18c-4.51 2-5-2-7-2",
  twitter:
    "M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3Z",
  instagram:
    "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z M17.5 6.5h.01",
  youtube:
    "M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.92 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.41Z M9.75 15.02 15.5 11.75 9.75 8.48v6.54Z",
  linkedin:
    "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V8h4v1.5A5 5 0 0 1 16 8Z M6 9H2v12h4V9Z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  map_pin: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  tip_jar: "M12 1v4 M8.5 5h7l1.5 7a4 4 0 0 1-4 5h-2a4 4 0 0 1-4-5l1.5-7Z M12 17v6",
  calendly:
    "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z M9 15l2 2 4-4",
};

export type IconName = keyof typeof PATHS;

const ICON_NAMES = Object.keys(PATHS);

export function LinkIcon({
  name,
  color,
  className,
}: {
  name: string;
  color: string;
  className?: string;
}) {
  const path = PATHS[name] ?? PATHS.link;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("h-5 w-5 shrink-0", className)}
      style={{ color }}
    >
      {path.split(" M").map((seg, i) => (
        <path key={i} d={(i === 0 ? seg : `M${seg}`).trim()} />
      ))}
    </svg>
  );
}

export function IconPickerGrid({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ICON_NAMES.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          title={name.replace("_", " ")}
          className={
            value === name
              ? "flex h-9 w-9 items-center justify-center rounded-lg border-2 border-emerald-600 bg-emerald-50"
              : "flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50"
          }
        >
          <LinkIcon name={name} color={value === name ? "#059669" : "#52525b"} />
        </button>
      ))}
    </div>
  );
}
