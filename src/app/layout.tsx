import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MineTree — one page for everything you are",
    template: "%s · MineTree",
  },
  description:
    "MineTree is the ad-free link-in-bio platform. One sleek page for every link you share.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
