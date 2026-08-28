/**
 * 产物自检 —— 对 out/ 的真实 HTML 做断言。
 *
 * 这些不变量都对应过去真实存在的缺陷，用产物级检查钉住，避免回退：
 *  1. 曾有 22 个路由（含 /chapters、/concepts、/quotes、/fables、/timeline）
 *     因根布局继承 alternates.canonical 而声明「canonical = 首页」，
 *     等于自报为首页副本，会被搜索引擎判重去索引。
 *  2. 曾有 15 个 "use client" 路由拿不到自己的 title，全站共用首页标题。
 *  3. sitemap 的 URL 无尾斜杠，而站点 trailingSlash: true 实际提供带斜杠地址，
 *     每条都要吃一次 308 跳转，并与 canonical 自相矛盾。
 *  4. 结构化数据里 datePublished 是未来日期（2026-07-29）。
 *  5. manifest 引用了不存在的图标文件。
 *
 * 运行：node scripts/check-output.mjs
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");

if (!existsSync(OUT)) {
  console.error("未找到 out/ —— 请先执行 npm run build");
  process.exit(1);
}

const problems = [];
const note = (msg) => problems.push(msg);

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(OUT);
const pages = files.filter((f) => f.endsWith("index.html"));

// ── 1 & 2：canonical 与 title ──
const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://zhuangzi-site.pages.dev";
const HOME_CANONICAL = `${SITE}/`;

let genericTitle = 0;
let homeCanonical = 0;
let missingCanonical = 0;
const DEFAULT_TITLE = "莊子 · 逍遥游于无何有之乡";

for (const file of pages) {
  const html = readFileSync(file, "utf8");
  let route = "/" + relative(OUT, dirname(file)).replace(/\\/g, "/");
  if (route === "/.") route = "/";

  const title = /<title>(.*?)<\/title>/s.exec(html)?.[1] ?? "";
  const canonical = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1] ?? "";
  const isNoIndex = /name="robots"[^>]*content="[^"]*noindex/.test(html);

  // 错误页不需要 canonical，但必须是 noindex
  const isErrorPage = route === "/404" || route === "/_not-found";
  if (isErrorPage) {
    if (!isNoIndex) note(`${route}: 错误页应声明 noindex`);
  } else if (!canonical) {
    missingCanonical++;
    note(`${route}: 缺少 canonical`);
  } else if (canonical === HOME_CANONICAL && route !== "/") {
    homeCanonical++;
    note(`${route}: canonical 指向首页（会被判重去索引）`);
  } else if (canonical && !canonical.endsWith("/")) {
    note(`${route}: canonical 缺尾斜杠（与 trailingSlash 设置不一致）— ${canonical}`);
  }

  if (title === DEFAULT_TITLE && route !== "/") {
    genericTitle++;
    note(`${route}: 使用了站点默认标题，缺少本页专属 title`);
  }
  if (!title) note(`${route}: 缺少 <title>`);
}

// ── 3：sitemap ──
const sitemapPath = join(OUT, "sitemap.xml");
if (!existsSync(sitemapPath)) {
  note("缺少 sitemap.xml");
} else {
  const xml = readFileSync(sitemapPath, "utf8");
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  if (locs.length === 0) note("sitemap.xml 内没有任何 <loc>");
  const noSlash = locs.filter((u) => !u.endsWith("/"));
  if (noSlash.length) {
    note(`sitemap 有 ${noSlash.length} 条 URL 缺尾斜杠，例如 ${noSlash[0]}`);
  }
  // sitemap 不应收录 noindex 页面（Search Console 会报「已提交但被排除」）
  const shouldNotBeListed = locs.filter((u) =>
    /\/(search|bookmarks|annotations|report|cards|reading-path)\/$/.test(u)
  );
  if (shouldNotBeListed.length) {
    note(`sitemap 收录了 noindex 页面: ${shouldNotBeListed.join(", ")}`);
  }
  // 每条 sitemap URL 都应有对应的实际产物
  for (const loc of locs) {
    const rel = loc.replace(SITE, "").replace(/^\/|\/$/g, "");
    const target = rel ? join(OUT, rel, "index.html") : join(OUT, "index.html");
    if (!existsSync(target)) note(`sitemap 中的 ${loc} 没有对应产物`);
  }
}

// ── 4：结构化数据日期 ──
const today = new Date().toISOString().slice(0, 10);
for (const file of pages.slice(0, 400)) {
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(/"date(?:Published|Modified)":"(\d{4}-\d{2}-\d{2})/g)) {
    if (m[1] > today) {
      const route = "/" + relative(OUT, dirname(file)).replace(/\\/g, "/");
      note(`${route}: 结构化数据含未来日期 ${m[1]}`);
      break;
    }
  }
}

// ── 5：manifest 图标存在性 ──
const manifestPath = join(OUT, "manifest.json");
if (!existsSync(manifestPath)) {
  note("缺少 manifest.json");
} else {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const icon of manifest.icons ?? []) {
    const p = join(OUT, icon.src.replace(/^\//, ""));
    if (!existsSync(p)) note(`manifest 引用了不存在的图标: ${icon.src}`);
    else if (statSync(p).size < 1024 && icon.type !== "image/svg+xml") {
      note(`manifest 图标 ${icon.src} 仅 ${statSync(p).size}B，疑似空白占位图`);
    }
  }
  if (!(manifest.icons ?? []).some((i) => (i.purpose ?? "").includes("maskable"))) {
    note("manifest 缺少 maskable 图标（影响 Android 安装图标质量）");
  }
  for (const key of ["id", "scope", "lang", "start_url", "theme_color", "background_color"]) {
    if (!manifest[key]) note(`manifest 缺少 ${key}`);
  }
}

// ── 6：robots.txt ──
const robotsPath = join(OUT, "robots.txt");
if (!existsSync(robotsPath)) note("缺少 robots.txt");
else if (!readFileSync(robotsPath, "utf8").includes("Sitemap:")) {
  note("robots.txt 未声明 Sitemap");
}

// ── 7：Service Worker 版本号已替换 ──
const swPath = join(OUT, "sw.js");
if (!existsSync(swPath)) note("缺少 sw.js");
else {
  const sw = readFileSync(swPath, "utf8");
  if (/zhuangzi-(static|pages|json)-v1\b/.test(sw)) {
    note("sw.js 的缓存版本号仍是 v1 —— bump-sw-version.mjs 未生效，部署后旧缓存不会失效");
  }
}

// ── 汇总 ──
console.log("产物自检");
console.log("".padEnd(58, "-"));
console.log(`页面数              ${pages.length}`);
console.log(`canonical 指向首页  ${homeCanonical}   (历史基线: 22)`);
console.log(`缺少 canonical      ${missingCanonical}`);
console.log(`使用默认标题        ${genericTitle}   (历史基线: 15)`);
console.log("".padEnd(58, "-"));

if (problems.length) {
  console.error(`\n❌ 发现 ${problems.length} 个问题：`);
  for (const p of problems.slice(0, 40)) console.error("   " + p);
  if (problems.length > 40) console.error(`   … 另有 ${problems.length - 40} 条`);
  process.exit(1);
}
console.log("\n✅ 产物自检全部通过");
