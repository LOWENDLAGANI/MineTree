import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleIcon } from "@/components/google-icon";
import { submitSignup, signInWithGoogle } from "../actions";

export const metadata = { title: "Sign up" };

const ERRORS: Record<string, string> = {
  invalid: "Enter a valid email and a password of at least 8 characters.",
  exists: "An account with that email already exists. Log in instead.",
};

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; check?: string }>;
}) {
  return (
    <SignupForm searchParams={searchParams} />
  );
}

async function SignupForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; check?: string }>;
}) {
  const { error, check } = await searchParams;
  const errorText = error ? ERRORS[error] : undefined;

  if (check) {
    return (
      <>
        <h1 className="text-2xl font-bold text-white">Check your inbox</h1>
        <p className="mt-2 text-sm text-zinc-400">
          We sent you a confirmation link. Open it to activate your account,
          then log in.
        </p>
        <Link href="/login" className="mt-6 block">
          <Button variant="outline" className="w-full">Back to log in</Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-white">Sign up</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Free. Takes about a minute.
      </p>

      {errorText ? (
        <p className="mt-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {errorText}
        </p>
      ) : null}

      <form action={submitSignup} className="mt-6 space-y-4">
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
        <div>
          <Label htmlFor="password">Password</Label>
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
          Create account
        </Button>

        <p className="text-xs text-zinc-500">
          By signing up you agree to be excellent to each other.
        </p>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-zinc-500">
        <span className="h-px flex-1 bg-zinc-700" />
        or
        <span className="h-px flex-1 bg-zinc-700" />
      </div>

      <form action={signInWithGoogle}>
        <Button type="submit" variant="outline" className="w-full">
          <GoogleIcon className="h-4 w-4" />
          Continue with Google
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
          Log in
        </Link>
      </p>
    </>
  );
}
