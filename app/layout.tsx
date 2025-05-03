// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { SocketProvider } from "@/contexts/SocketContext";
import SWRConfigProvider from '@/components/SWRConfigProvider';
import {Toaster} from "@/components/ui/sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wesynchro",
  description: "The power of connections",
  icons: {
    icon: "/logo-png.png", //
  },
};


 function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
            <SWRConfigProvider>

      <SocketProvider>
        <Navbar />
        {children}
      </SocketProvider>
      </SWRConfigProvider>

    </SessionProvider>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Toaster/>
        {/* Client-side components wrapped separately */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}