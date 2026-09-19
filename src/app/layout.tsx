import type { Metadata } from "next";
import "./globals.css";
import { UiThemeProvider, themeInitScript } from "@/components/ui/theme";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  // Required so OpenGraph/Twitter URLs resolve absolutely in production.
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "MineTree",
    template: "%s · MineTree",
  },
  description:
    "Create your page and share all of your links in one place.",
  openGraph: {
    siteName: "MineTree",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the saved UI mode before first paint — prevents theme flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-surface text-body antialiased">
        <UiThemeProvider>{children}</UiThemeProvider>
      </body>
    </html>
  );
}
