import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ToastProvider } from "@/components/ui/toast";
import { requireUser } from "@/lib/auth";
import { signOut } from "../(auth)/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-zinc-950 text-zinc-100">
        <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 font-bold transition-opacity hover:opacity-80"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="text-emerald-400">
                  <path
                    d="M12 3c4.5 0 8 2.5 8 5.5 0 2.2-1.9 4.1-4.6 5M12 3C7.5 3 4 5.5 4 8.5c0 2.2 1.9 4.1 4.6 5M8 21l4-7 4 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                MineTree
              </Link>
              <nav className="flex items-center gap-1 text-sm">
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-1.5 text-zinc-400 transition-colors hover:bg-zinc-800/70 hover:text-white"
                >
                  Links
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="rounded-lg px-3 py-1.5 text-zinc-400 transition-colors hover:bg-zinc-800/70 hover:text-white"
                >
                  Settings
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-zinc-500 sm:inline">{user.email}</span>
              <form action={signOut}>
                <Button variant="ghost" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </header>

        {children}
      </div>
    </ToastProvider>
  );
}
