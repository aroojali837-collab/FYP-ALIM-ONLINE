import type { Metadata } from "next";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "Alim Online | Islamic Services",
  description: "Find trusted Islamic services and Quran learning support.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
