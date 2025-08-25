import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarCustomTrigger } from "@/components/sidebar-custom-trigger";
import LogoutButton from "@/components/logout-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jason - Admin",
  description: "Admin dashboard for managing products and categories",
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

        <SidebarProvider>
          <AppSidebar />

          <main className="w-full">
            <SidebarCustomTrigger />
            {children}
          </main>
        </SidebarProvider>
        <div className="w-full flex justify-end items-center mt-4 absolute top-0 z-10">
          <div className="mt-4 manual-lg-me-4">
            <LogoutButton />
          </div>
        </div>
      </body>
    </html>
  );
}
