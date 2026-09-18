import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl">🍂</div>
      <h1 className="mt-6 text-3xl font-bold text-white">
        This tree doesn&apos;t exist
      </h1>
      <p className="mt-3 max-w-md text-zinc-400">
        The page you&apos;re looking for was moved, deleted, or never grew here
        in the first place.
      </p>
      <Link href="/" className="mt-8">
        <Button>Plant yours — it&apos;s free</Button>
      </Link>
    </main>
  );
}
