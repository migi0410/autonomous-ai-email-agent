import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Autonomous AI Email Marketing Agent | By Ha Minh Dung",
  description: "Autonomous LLM-driven email marketing agent featuring adaptive sequence planning, behavioral branching, and automated 24/7 campaign dispatching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-slate-50">{children}</body>
    </html>
  );
}
