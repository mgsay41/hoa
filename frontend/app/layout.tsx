import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "اتحاد ملاك برج الوليد",
  description: "نظام إدارة مالية اتحاد ملاك برج الوليد",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlexArabic.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
