import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "재고관리",
  description: "재고 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
