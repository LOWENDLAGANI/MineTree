import Link from "next/link";
import { ToastProvider } from "@/components/ui/toast";
import { requireUser } from "@/lib/auth";
import { signOut } from "../(auth)/actions";
import { DashboardNav } from "@/components/dashboard-nav";
import { ThemeToggle } from "@/components/ui/theme";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const initial = (user.email ?? "u").charAt(0).toUpperCase();

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-surface text-body">
        <DashboardNav />

        {/* Top bar (mobile: brand + account; desktop: account only, nav lives in sidebar) */}
        <header className="sticky top-0 z-30 border-b border-edge bg-surface/80 backdrop-blur lg:pl-60">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-lg font-extrabold tracking-tight text-body lg:hidden"
            >
              MineTree
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="text-brand">
                <path
                  d="M12 3c4.5 0 8 2.5 8 5.5 0 2.2-1.9 4.1-4.6 5M12 3C7.5 3 4 5.5 4 8.5c0 2.2 1.9 4.1 4.6 5M8 21l4-7 4 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <span className="hidden lg:block" />

            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-muted sm:inline">{user.email}</span>
              <ThemeToggle />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-on-brand">
                {initial}
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full border border-edge px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-body active:scale-95"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="lg:pl-60">{children}</main>
      </div>
    </ToastProvider>
  );
}
