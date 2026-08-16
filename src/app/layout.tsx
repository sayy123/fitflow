import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fitloww | Gestion de studio de fitness et réservations",
  description: "La solution moderne pour gérer votre studio de fitness. Planning, réservations, membres et paiements centralisés.",
};

import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${outfit.variable} ${dmSans.variable} font-sans antialiased bg-[#FCFCFD] text-slate-900`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
