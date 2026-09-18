import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitPasswordReset } from "../actions";

export const metadata = { title: "Set a new password" };

const ERRORS: Record<string, string> = {
  invalid: "Password must be at least 8 characters.",
  failed: "Could not update the password. Request a new link.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorText = error ? ERRORS[error] : undefined;

  return (
    <>
      <h1 className="text-2xl font-bold text-white">Set a new password</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Choose something you&apos;ll remember this time.
      </p>

      {errorText ? (
        <p className="mt-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {errorText}
        </p>
      ) : null}

      <form action={submitPasswordReset} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            className="mt-1.5"
          />
        </div>

        <Button type="submit" className="w-full">
          Save password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Link expired?{" "}
        <Link href="/forgot-password" className="font-medium text-emerald-400 hover:text-emerald-300">
          Request a new one
        </Link>
      </p>
    </>
  );
}
