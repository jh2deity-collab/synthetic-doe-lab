import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google"; // Added Noto_Sans_KR
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansKr = Noto_Sans_KR({
  weight: ['100', '300', '400', '500', '700', '900'],
  subsets: ['latin'],
  variable: '--font-noto-sans-kr',
});

export const metadata: Metadata = {
  title: "Synthetic DOE Lab",
  description: "AI 기반 실험계획법 및 가상 데이터 생성 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Removed external Spoqa link to fix CORS issues with html-to-image */}
      </head>
      <body
        className={`antialiased ${notoSansKr.className} font-sans`} // Applied Noto Sans KR class
        style={{ fontFamily: "'Noto Sans KR', 'Spoqa Han Sans Neo', sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
