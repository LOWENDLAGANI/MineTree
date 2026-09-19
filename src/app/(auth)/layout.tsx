import Link from "next/link";

/**
 * Linktree-style split-screen auth layout:
 *  - Left (light): brand, welcome, form.
 *  - Right: your custom brand image, full-bleed.
 *
 * Put your image at: public/auth-hero.jpg (any portrait/landscape ≥1080px wide)
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-white">
      <div className="mx-auto grid min-h-dvh max-w-[1600px] lg:grid-cols-2">
        {/* Left — form panel */}
        <div className="relative flex flex-col px-6 py-8 sm:px-12">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-2xl font-extrabold tracking-tight text-zinc-900"
          >
            MineTree
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="text-emerald-500">
              <path
                d="M12 3c4.5 0 8 2.5 8 5.5 0 2.2-1.9 4.1-4.6 5M12 3C7.5 3 4 5.5 4 8.5c0 2.2 1.9 4.1 4.6 5M8 21l4-7 4 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="sr-only">home</span>
          </Link>

          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-sm">{children}</div>
          </div>

          <p className="text-xs text-zinc-400">Cookie preferences</p>
        </div>

        {/* Right — brand image panel (hidden on small screens) */}
        <div className="relative hidden lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element -- local static brand asset */}
          <img
            src="/auth-hero.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>
    </main>
  );
}
