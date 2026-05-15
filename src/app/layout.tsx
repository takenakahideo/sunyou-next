import type { Metadata } from "next";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "サンユー・ネクスト LLC｜大崎市の害虫・害獣駆除 創業40年",
  description:
    "宮城県大崎市の害虫・害獣駆除ならサンユー・ネクスト（旧：三友薬品消毒）。創業40年・施工実績5,000件以上。ハクビシン・ネズミ・シロアリ・ハチ・ゴキブリ対応。24時間AIチャット受付・現地調査無料。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} ${notoSerifJP.variable}`} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
