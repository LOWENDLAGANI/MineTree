import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleIcon } from "@/components/google-icon";
import { submitLogin, signInWithGoogle } from "../actions";

export const metadata = { title: "Log in" };

const ERRORS: Record<string, string> = {
  "1": "Wrong email or password.",
  confirm: "Sign-in failed or the link expired. Try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const errorText = error ? ERRORS[error] : undefined;

  return (
    <>
      <h1 className="text-2xl font-bold text-white">Log in</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Manage your tree.
      </p>

      {errorText ? (
        <p className="mt-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {errorText}
        </p>
      ) : null}

      <form action={submitLogin} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next ?? "/dashboard"} />
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
            autoComplete="current-password"
            required
            minLength={8}
            placeholder="Password"
            className="mt-1.5"
          />
        </div>

        <Button type="submit" className="w-full">
          Log in
        </Button>
      </form>

      <p className="mt-3 text-center">
        <Link
          href="/forgot-password"
          className="text-sm text-zinc-400 hover:text-emerald-400"
        >
          Forgot password?
        </Link>
      </p>

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
        No account?{" "}
        <Link href="/signup" className="font-medium text-emerald-400 hover:text-emerald-300">
          Sign up
        </Link>
      </p>
    </>
  );
}
