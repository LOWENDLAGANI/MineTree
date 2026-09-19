"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    href: "/dashboard",
    label: "My Tree",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3c4.5 0 8 2.5 8 5.5 0 2.2-1.9 4.1-4.6 5M12 3C7.5 3 4 5.5 4 8.5c0 2.2 1.9 4.1 4.6 5M8 21l4-7 4 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/dashboard/settings",
    label: "Design",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3a9 9 0 1 0 0 18c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1.1 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-4-4-7.6-9-7.6Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="7.5" cy="11.5" r="1.2" fill="currentColor" />
        <circle cx="11" cy="7.5" r="1.2" fill="currentColor" />
        <circle cx="16" cy="9.5" r="1.2" fill="currentColor" />
      </svg>
    ),
  },
] as const;

/**
 * Responsive dashboard navigation:
 *  - Desktop (≥lg): vertical sidebar rail.
 *  - Mobile: floating pill dock at the bottom of the screen.
 */
export function DashboardNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-edge bg-surface px-3 py-5 lg:flex">
        <Link
          href="/dashboard"
          className="mb-8 flex items-center gap-1.5 px-2 text-xl font-extrabold tracking-tight text-body"
        >
          MineTree
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-brand">
            <path
              d="M12 3c4.5 0 8 2.5 8 5.5 0 2.2-1.9 4.1-4.6 5M12 3C7.5 3 4 5.5 4 8.5c0 2.2 1.9 4.1 4.6 5M8 21l4-7 4 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <nav className="flex flex-col gap-1">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                isActive(item.href)
                  ? "bg-brand/10 text-brand-strong"
                  : "text-muted hover:bg-surface-2 hover:text-body",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto px-2 text-xs text-faint">
          MineTree · your links, one page
        </div>
      </aside>

      {/* Mobile floating pill dock */}
      <nav
        aria-label="Dashboard navigation"
        className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-edge bg-surface/95 p-1.5 shadow-lg shadow-black/10 backdrop-blur lg:hidden"
      >
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-95",
              isActive(item.href)
                ? "bg-brand text-on-brand"
                : "text-muted hover:text-body",
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
