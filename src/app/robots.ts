import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 个人数据页与站内搜索结果对爬虫无内容价值（数据在 localStorage）。
        // 各页已有 noindex meta，这里再加一层 robots 规则可直接省下抓取。
        disallow: [
          "/search/",
          "/bookmarks/",
          "/annotations/",
          "/report/",
          "/cards/",
          "/reading-path/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
