import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { claimUsername } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Claim your username" };

const ERRORS: Record<string, string> = {
  username: "Usernames are 3–24 chars: lowercase letters, numbers, hyphens.",
  taken: "That username is already growing elsewhere. Try another.",
  save: "Something went wrong saving. Try again.",
};

export default async function ClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-edge bg-surface p-6">
        <h1 className="text-2xl font-bold text-body">Claim your username</h1>
        <p className="mt-1 text-sm text-muted">
          Your page will live at{" "}
          <span className="font-mono text-brand-strong">minetree.app/…</span>
        </p>

        <form action={claimUsername} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-sm text-muted">minetree.app/</span>
              <Input
                id="username"
                name="username"
                defaultValue={profile?.username ?? ""}
                required
                minLength={3}
                maxLength={24}
                pattern="[a-z0-9][a-z0-9-]*"
                className="flex-1"
              />
            </div>
          </div>

          {error && ERRORS[error] ? (
            <p className="text-sm text-red-400">{ERRORS[error]}</p>
          ) : null}

          <Button type="submit" className="w-full">
            Claim it
          </Button>
        </form>
      </div>
    </main>
  );
}
