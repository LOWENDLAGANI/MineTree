import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "../actions";

export const metadata = { title: "Reset password" };

const ERRORS: Record<string, string> = {
  invalid: "Enter your email address.",
  failed: "Could not send the reset email. Try again.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;
  const errorText = error ? ERRORS[error] : undefined;

  if (sent) {
    return (
      <>
        <h1 className="text-2xl font-bold text-white">Check your inbox</h1>
        <p className="mt-2 text-sm text-zinc-400">
          If an account exists for that email, we sent a link to reset your
          password.
        </p>
        <Link href="/login" className="mt-6 block">
          <Button variant="outline" className="w-full">Back to log in</Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-white">Reset password</h1>
      <p className="mt-1 text-sm text-zinc-400">
        We&apos;ll email you a link to set a new one.
      </p>

      {errorText ? (
        <p className="mt-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {errorText}
        </p>
      ) : null}

      <form action={requestPasswordReset} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="mt-1.5"
          />
        </div>

        <Button type="submit" className="w-full">
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
          Log in
        </Link>
      </p>
    </>
  );
}
