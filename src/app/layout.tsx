import type { Metadata } from "next";
import Link from "next/link";
import { Noto_Serif_SC } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutClient } from "@/components/LayoutClient";

const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-serif",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-sans",
});

const BASE_URL = "https://zhuangzi-site.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: "%s — 莊子數位典藏",
    default: "莊子 · 逍遥游于无何有之乡",
  },
  description:
    "庄子全文解读 — 内篇七篇、外篇十五篇、杂篇十一篇。原文、白话翻译与深度解读，包含概念知识图谱、词语索引、寓言故事、名句精选、地理地图和主题阅读路线。",
  keywords: [
    "庄子", "庄子全文", "逍遥游", "道家", "庄子解读", "庄子译文",
    "庄子寓言", "齐物论", "养生主", "秋水", "庄子哲学", "南华真经",
    "古典文学", "先秦哲学", "国学经典",
  ],
  authors: [{ name: "莊子數位典藏" }],
  creator: "莊子數位典藏",
  publisher: "莊子數位典藏",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: BASE_URL,
    siteName: "莊子數位典藏",
    title: "莊子 · 逍遥游于无何有之乡",
    description:
      "内篇精粹、外篇广博、杂篇绚烂。全文解读、白话翻译、概念图谱、词语索引。",
    images: [
      {
        url: `${BASE_URL}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: "莊子 · 逍遥游于无何有之乡",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "莊子 · 逍遥游于无何有之乡",
    description:
      "内篇精粹、外篇广博、杂篇绚烂。全文解读、白话翻译、概念图谱、词语索引。",
    images: [`${BASE_URL}/og-image.svg`],
  },
  alternates: {
    canonical: BASE_URL,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "莊子",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${notoSerif.variable} ${inter.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://tile.openstreetmap.org" />
        <meta name="theme-color" content="#8B5E3C" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "莊子數位典藏",
              url: BASE_URL,
              description:
                "庄子全文解读 — 内篇七篇、外篇十五篇、杂篇十一篇。原文、白话翻译与深度解读。",
              inLanguage: "zh-CN",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-serif">
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}

