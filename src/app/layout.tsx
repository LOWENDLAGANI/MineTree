import type { Metadata } from "next";
import "./globals.css";
import { UiThemeProvider, themeInitScript } from "@/components/ui/theme";

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
