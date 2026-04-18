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
  title: {
    default: "اطعام — لوحة التحكم",
    template: "%s | اطعام",
  },
  description: "نظام تتبع تبرعات ومصروفات اطعام الخيرية — تقارير مالية شفافة",
  openGraph: {
    title: "اطعام",
    description: "لوحة التحكم — تبرعات ومصروفات وتقارير",
    locale: "ar_SA",
    type: "website",
    siteName: "اطعام",
  },
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
