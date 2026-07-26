import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoloDM",
  description: "A solo D&D 5e oneshot, run by Gemini as your Dungeon Master.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
