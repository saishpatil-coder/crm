import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import "./globals.css";
import PwaGuard from "@/components/PwaGuard";
import InstallPrompt from "@/components/InstallPrompt";
import { LanguageProvider } from "@/context/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming in when tapping inputs on mobile
};
export const metadata: Metadata = {
  title: "Campaign CRM",
  description: "Offline-first Voter Management System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Campaign CRM",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
         <LanguageProvider>
           {/* <PwaGuard>
        {children}
        </PwaGuard> */}
        {children}
        {/* <InstallPrompt/> */}
         </LanguageProvider>
        </AuthProvider>

      </body>
    </html>
  );
}
