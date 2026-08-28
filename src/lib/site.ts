/**
 * 站点级常量 —— 单一数据源。
 *
 * 背景：BASE_URL 此前在 layout.tsx / sitemap.ts / robots.ts /
 * chapters/[id]/page.tsx / concepts/[id]/page.tsx 各写了一份字面量
 * "https://zhuangzi-site.pages.dev"。绑定自定义域名时必须五处同时改，
 * 漏一处就会产生指向旧域名的 canonical / sitemap，直接影响收录。
 *
 * 现在统一从这里取；部署时可用环境变量覆盖：
 *   NEXT_PUBLIC_SITE_URL=https://zhuangzi.example.com npm run build
 */

/** 站点根 URL，无尾斜杠 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://zhuangzi-site.pages.dev"
).replace(/\/+$/, "");

export const SITE_NAME = "莊子數位典藏";
export const SITE_TAGLINE = "莊子 · 逍遥游于无何有之乡";

/**
 * next.config.ts 设置了 trailingSlash: true，静态导出的每个路由都以
 * `/` 结尾。canonical 与 sitemap 必须使用同一形式，否则
 * `/chapters` 与 `/chapters/` 会被视作两个 URL（前者 308 跳后者），
 * 白白浪费抓取预算并稀释信号。
 */
export function canonicalUrl(path = "/"): string {
  if (path === "/" || path === "") return `${SITE_URL}/`;
  const clean = `/${path.replace(/^\/+/, "").replace(/\/+$/, "")}/`;
  return `${SITE_URL}${clean}`;
}

/** 内容最后一次实质性更新的日期（静态典藏，不应每次构建都变成「今天」） */
export const CONTENT_LAST_MODIFIED = "2026-02-01";

export const OG_IMAGE = {
  url: `${SITE_URL}/og-image.png`,
  width: 1200,
  height: 630,
} as const;

/**
 * 每页独立 OG 图（TODO 3.2）：构建期由 scripts/gen-og-images.mjs
 * 批量生成 /og/chapters/<id>.png 与 /og/concepts/<id>.png；
 * 其他路由回退到默认 og-image.png。
 */
export function ogImageFor(path: string): {
  url: string;
  width: number;
  height: number;
} {
  const m = path.match(/^\/(chapters|concepts)\/([\w-]+)/);
  if (m) {
    const kind = m[1];
    const id = m[2];
    return { ...OG_IMAGE, url: `${SITE_URL}/og/${kind}/${id}.png` };
  }
  return OG_IMAGE;
}

/**
 * 构造单页 metadata（标题 / 描述 / canonical / OG / Twitter）。
 * 每个路由都必须声明自己的 canonical —— 根布局不再提供，
 * 否则会继承出「本页是首页副本」的错误信号。
 */
export function buildPageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  /** false → noindex,follow（本地数据页 / 站内搜索结果） */
  index?: boolean;
  type?: "website" | "article";
}) {
  const { title, description, path, index = true, type = "website" } = opts;
  const url = canonicalUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    ...(index ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title: `${title} — ${SITE_NAME}`,
      description,
      url,
      type,
      locale: "zh_CN",
      siteName: SITE_NAME,
      images: [{ ...OG_IMAGE, alt: title }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: `${title} — ${SITE_NAME}`,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
