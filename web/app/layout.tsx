import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { Sidebar } from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FM24 Squad Ability Tracker (SAT-24)",
  description: "Monitor player Current Ability (CA) progression, delta tracking, and smart transfer advice for Football Manager 2024.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
        <QueryProvider>
          <div className="min-h-screen flex flex-col lg:flex-row">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
              {children}
            </div>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
