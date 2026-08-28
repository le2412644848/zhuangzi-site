/**
 * 首屏体积预算检查。
 *
 * 为什么需要：本站是静态古籍阅读站，正文本身才是主体，但实测每个路由都要
 * 先下载约 200KB(gzip) 的 JS；章节页更是 HTML + JS 合计 348–464KB(gzip)，
 * 其中齐物论页 HTML 达 1MB（未压缩），约 43% 是给客户端组件做 hydration 的
 * RSC 重复载荷。没有预算约束时，这类回退不会被任何人发现。
 *
 * 本脚本对**真实产物**做测量（读 out/ 下每个 index.html 引用的 chunk），
 * 用 gzip 后大小对照预算，超出即以非零码退出，可直接接进 CI。
 *
 * 运行：node scripts/check-budget.mjs
 *      node scripts/check-budget.mjs --update   （把当前值写回基线）
 */
import { existsSync, readdirSync, readFileSync, statSync,writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");
const BASELINE_PATH = join(ROOT, "scripts", "budget.json");

if (!existsSync(OUT)) {
  console.error("未找到 out/ —— 请先执行 npm run build");
  process.exit(1);
}

/** 预算（KB, gzip）。刻意略高于当前实测值，留出正常波动空间。 */
const BUDGETS = {
  // 每个路由共享的 JS 基线
  sharedJsGzipKB: 230,
  // 单个路由 HTML(gzip)
  routeHtmlGzipKB: 260,
  // 单路由总量（HTML + JS + CSS，gzip）
  routeTotalGzipKB: 480,
  // 全站 out/ 总量
  totalOutputMB: 45,
};

const gz = (buf) => gzipSync(buf, { level: 9 }).length;

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const allFiles = walk(OUT);
const totalBytes = allFiles.reduce((s, f) => s + statSync(f).size, 0);

const htmlFiles = allFiles.filter((f) => f.endsWith("index.html"));
const assetCache = new Map();
const assetGzip = (rel) => {
  if (assetCache.has(rel)) return assetCache.get(rel);
  const abs = join(OUT, rel.replace(/^\//, ""));
  const size = existsSync(abs) ? gz(readFileSync(abs)) : 0;
  assetCache.set(rel, size);
  return size;
};

const routes = [];
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const refs = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]);
  const unique = [...new Set(refs)];
  let js = 0;
  let css = 0;
  for (const r of unique) {
    const size = assetGzip(r);
    if (r.endsWith(".css")) css += size;
    else js += size;
  }
  const htmlGzip = gz(readFileSync(file));
  const route = "/" + relative(OUT, dirname(file)).replace(/\\/g, "/");
  routes.push({
    route: route === "/." ? "/" : route,
    htmlKB: htmlGzip / 1024,
    jsKB: js / 1024,
    cssKB: css / 1024,
    totalKB: (htmlGzip + js + css) / 1024,
  });
}

routes.sort((a, b) => b.totalKB - a.totalKB);
const sharedJsKB = Math.min(...routes.map((r) => r.jsKB));

const failures = [];
if (sharedJsKB > BUDGETS.sharedJsGzipKB) {
  failures.push(
    `共享 JS 基线 ${sharedJsKB.toFixed(1)}KB > 预算 ${BUDGETS.sharedJsGzipKB}KB`
  );
}
for (const r of routes) {
  if (r.htmlKB > BUDGETS.routeHtmlGzipKB) {
    failures.push(`${r.route} HTML ${r.htmlKB.toFixed(1)}KB > ${BUDGETS.routeHtmlGzipKB}KB`);
  }
  if (r.totalKB > BUDGETS.routeTotalGzipKB) {
    failures.push(`${r.route} 首屏合计 ${r.totalKB.toFixed(1)}KB > ${BUDGETS.routeTotalGzipKB}KB`);
  }
}
const totalMB = totalBytes / 1024 / 1024;
if (totalMB > BUDGETS.totalOutputMB) {
  failures.push(`out/ 总体积 ${totalMB.toFixed(1)}MB > ${BUDGETS.totalOutputMB}MB`);
}

console.log("首屏体积（gzip, KB） —— 最重的 12 个路由");
console.log("".padEnd(74, "-"));
console.log(
  "route".padEnd(34) + "html".padStart(9) + "js".padStart(9) + "css".padStart(8) + "total".padStart(10)
);
for (const r of routes.slice(0, 12)) {
  console.log(
    r.route.padEnd(34) +
      r.htmlKB.toFixed(1).padStart(9) +
      r.jsKB.toFixed(1).padStart(9) +
      r.cssKB.toFixed(1).padStart(8) +
      r.totalKB.toFixed(1).padStart(10)
  );
}
console.log("".padEnd(74, "-"));
console.log(`路由数 ${routes.length}   共享 JS 基线 ${sharedJsKB.toFixed(1)}KB   out/ 总体积 ${totalMB.toFixed(1)}MB`);

if (process.argv.includes("--update")) {
  const baseline = {
    updatedAt: new Date().toISOString().slice(0, 10),
    sharedJsGzipKB: Number(sharedJsKB.toFixed(1)),
    worstRoute: routes[0]?.route,
    worstRouteTotalGzipKB: Number(routes[0]?.totalKB.toFixed(1)),
    totalOutputMB: Number(totalMB.toFixed(1)),
  };
  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + "\n", "utf8");
  console.log(`\n已写入基线 ${relative(ROOT, BASELINE_PATH)}`);
}

if (failures.length) {
  console.error("\n❌ 超出体积预算：");
  for (const f of failures) console.error("   " + f);
  console.error("\n若为有意的体积增长，请在 scripts/check-budget.mjs 中调整 BUDGETS 并说明原因。");
  process.exit(1);
}
console.log("\n✅ 全部路由均在体积预算内");
