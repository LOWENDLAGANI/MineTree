import Link from "next/link";
import { GoogleIcon } from "@/components/google-icon";
import { submitSignup, signInWithGoogle } from "../actions";

export const metadata = { title: "Sign up" };

const ERRORS: Record<string, string> = {
  invalid: "Enter a valid email and a password of at least 8 characters.",
  exists: "An account with that email already exists. Log in instead.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; check?: string }>;
}) {
  const { error, check } = await searchParams;
  const errorText = error ? ERRORS[error] : undefined;

  if (check) {
    return (
      <div className="animate-fade-in-up text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
          Check your inbox
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          We sent you a confirmation link. Open it to activate your account,
          then log in.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block w-full rounded-full bg-emerald-600 py-3.5 text-base font-bold text-white transition-transform hover:bg-emerald-500 active:scale-[0.98]"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-center text-4xl font-extrabold tracking-tight text-zinc-900">
        Join MineTree
      </h1>
      <p className="mt-2 text-center text-sm text-zinc-500">
        Free. Takes about a minute.
      </p>

      {errorText ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-600">
          {errorText}
        </p>
      ) : null}

      <form action={submitSignup} className="mt-8 space-y-3">
        <div className="rounded-2xl border-2 border-zinc-900 px-4 py-2.5 transition-shadow focus-within:shadow-[4px_4px_0_0_#0a0a0a]">
          <label htmlFor="email" className="block text-[11px] font-medium text-zinc-500">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="block w-full border-0 bg-transparent p-0 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </div>

        <div className="rounded-2xl border-2 border-zinc-900 px-4 py-2.5 transition-shadow focus-within:shadow-[4px_4px_0_0_#0a0a0a]">
          <label htmlFor="password" className="block text-[11px] font-medium text-zinc-500">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            className="block w-full border-0 bg-transparent p-0 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-emerald-600 py-3.5 text-base font-bold text-white transition-transform hover:bg-emerald-500 active:scale-[0.98]"
        >
          Create account
        </button>

        <p className="text-center text-xs text-zinc-400">
          By signing up you agree to be excellent to each other.
        </p>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs font-medium text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200" />
        OR
        <span className="h-px flex-1 bg-zinc-200" />
      </div>

      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 py-3.5 text-base font-bold text-zinc-900 transition-colors hover:bg-zinc-50 active:scale-[0.98]"
        >
          <GoogleIcon className="h-5 w-5" />
          Continue with Google
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-zinc-900 underline decoration-emerald-500 decoration-2 underline-offset-2 hover:text-emerald-600">
          Log in
        </Link>
      </p>
    </div>
  );
}
