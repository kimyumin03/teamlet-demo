import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teamlet",
  description: "풀스펙 한국형 HR SaaS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
