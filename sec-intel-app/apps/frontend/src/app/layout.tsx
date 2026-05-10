import type { ReactNode } from "react";
import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "SEC Intel Dashboard",
  description:
    "Track buybacks, offerings, shelf registrations, ATM programs, and other capital-market events from recent SEC filings."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(18,191,143,0.18),_transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,248,247,0.94))]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
          <main className="relative">{children}</main>
        </div>
      </body>
    </html>
  );
}
