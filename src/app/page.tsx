import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserOrNull } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const metadata = { title: "MineTree" };

export default async function RootPage() {
  // Already logged in? Straight to the dashboard.
  const user = await getUserOrNull();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 py-12">
      <div className="w-full">
        <header className="text-center">
          <h1 className="text-2xl font-bold">MineTree</h1>
        </header>

        <div className="mt-8 space-y-3">
          <Link href="/login" className="block">
            <Button className="w-full">Log in</Button>
          </Link>
          <Link href="/signup" className="block">
            <Button variant="outline" className="w-full">
              Sign up
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
