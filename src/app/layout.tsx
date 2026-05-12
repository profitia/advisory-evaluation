import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Advisory Evaluation",
  description: "Profitia Advisory — Human Feedback Evaluation Environment",
  robots: "noindex, nofollow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
