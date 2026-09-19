import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold text-white">
        Nowhere To Be Found
      </h1>
      <p className="mt-3 max-w-md text-zinc-400">
        It may moved, deleted, or never here in the first place
      </p>
      <Link href="/" className="mt-8">
        <Button>Try It</Button>
      </Link>
    </main>
  );
}
