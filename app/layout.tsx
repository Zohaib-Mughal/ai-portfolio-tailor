import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Resume & Portfolio Tailor",
  description: "Automated resume tailoring capstone skeleton",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen flex flex-col`}>
        <nav className="border-b border-slate-800 p-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">Tailor.ai</h1>
            <div className="flex gap-6 text-sm text-slate-300">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="/resume" className="hover:text-white transition-colors">Resume Builder</Link>
              <Link href="/portfolio" className="hover:text-white transition-colors">Portfolio Preview</Link>
              <Link href="/health-check" className="hover:text-white transition-colors">Health Check</Link>
            </div>
          </div>
        </nav>
        <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}