import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ UNIFY branding — not default Next.js placeholder
export const metadata: Metadata = {
  title: "UNIFY — Society Management",
  description: "Admin dashboard for UNIFY society management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* ✅ AuthProvider wraps entire app — useAuth() works everywhere */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}