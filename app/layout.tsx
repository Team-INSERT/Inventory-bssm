import type { Metadata, Viewport } from "next";
import { SerwistProvider } from "@serwist/next/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "재고관리",
  description: "재고 관리 시스템",
  applicationName: "재고관리",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-full flex flex-col antialiased">
        <SerwistProvider swUrl="/sw.js" disable={process.env.NODE_ENV === "development"}>
          {children}
        </SerwistProvider>
      </body>
    </html>
  );
}
