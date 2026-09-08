import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MatchSeat",
  description: "Find official football tickets in London.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
