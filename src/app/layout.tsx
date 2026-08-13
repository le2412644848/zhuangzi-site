import type { Metadata } from "next";
import Link from "next/link";
import { Noto_Serif_SC } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutClient } from "@/components/LayoutClient";

const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-serif",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
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
        url: `${BASE_URL}/og-image.png`,
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
    images: [`${BASE_URL}/og-image.png`],
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
        <link rel="preconnect" href="https://tile.openstreetmap.org" />
        <meta name="theme-color" content="#8B5E3C" />
        {/* Cloudflare Web Analytics — replace token to enable */}
        {/* <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "YOUR_TOKEN"}'></script> */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('siteTheme')||'xuanzhi';var c={"xuanzhi":{"bp":"#FBF9F5","bs":"#F5EFE5","bc":"#FFFFFF","tp":"#2A2218","ts":"#7A6B5D","tm":"#A89880","ta":"#8B5E3C","br":"#E8E0D5","bl":"#F0EBE2"},"zhujian":{"bp":"#F3F0E4","bs":"#E8E3D2","bc":"#FAF7EC","tp":"#3A3520","ts":"#6B6340","tm":"#9B9060","ta":"#5A6B3A","br":"#D8D0B0","bl":"#E8E2C8"},"moyun":{"bp":"#F5F5F5","bs":"#EEEEEE","bc":"#FFFFFF","tp":"#1A1A1A","ts":"#5C5C5C","tm":"#999999","ta":"#333333","br":"#D5D5D5","bl":"#E5E5E5"},"qinghua":{"bp":"#F7F9FB","bs":"#EDF2F7","bc":"#FFFFFF","tp":"#1A2A3A","ts":"#4A6278","tm":"#7A8EA0","ta":"#2B5F8A","br":"#D0DDE8","bl":"#E0EAF3"}};var v=c[t]||c.xuanzhi;var r=document.documentElement;r.style.setProperty('--bg-primary',v.bp);r.style.setProperty('--bg-secondary',v.bs);r.style.setProperty('--bg-card',v.bc);r.style.setProperty('--text-primary',v.tp);r.style.setProperty('--text-secondary',v.ts);r.style.setProperty('--text-muted',v.tm);r.style.setProperty('--text-accent',v.ta);r.style.setProperty('--border-color',v.br);r.style.setProperty('--border-light',v.bl)}catch(e){}})()`,
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[var(--bg-card)] focus:text-[var(--text-accent)] focus:border focus:border-[var(--border-color)] focus:shadow-lg"
        >
          跳到主要内容
        </a>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}

