import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Do NOT set maximumScale — disabling user zoom breaks accessibility (WCAG 1.4.4)
  // iOS auto-zoom prevention is handled by font-size >= 16px on inputs
};

export const metadata: Metadata = {
  title: "Advisory Evaluation",
  description: "Profitia Advisory - Human Feedback Evaluation Environment",
  robots: "noindex, nofollow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
