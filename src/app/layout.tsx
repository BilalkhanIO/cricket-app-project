import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "CricketLeague App - Manage Cricket Tournaments",
  description:
    "The complete platform for managing cricket leagues, teams, live scoring, and statistics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
