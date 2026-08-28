/**
 * 修复 Next 16 静态导出 RSC 预取载荷路径不匹配（vercel/next.js#85374）。
 *
 * 构建产物把页载荷写成**目录式**：
 *   out/chapters/__next.chapters/__PAGE__.txt
 *   out/chapters/01-xiaoyao-you/__next.chapters/$d$id.txt
 *   out/chapters/01-xiaoyao-you/__next.chapters/$d$id/__PAGE__.txt
 *   out/search/__next.search/__PAGE__.txt
 * 而 Next 16.2.10 客户端运行时请求**点分式**：
 *   /chapters/__next.chapters.__PAGE__.txt
 *   /chapters/01-xiaoyao-you/__next.chapters.$d$id.txt
 *   /chapters/01-xiaoyao-you/__next.chapters.$d$id.__PAGE__.txt
 *   /search/__next.search.__PAGE__.txt
 *
 * 两者对不上 → 预取永远 404、悬停/视口预取完全失效，客户端导航退化为
 * ?_rsc= 拉整页 HTML。本脚本把所有名字以 `__next.` 开头的**目录**内的
 * 文件「展平」为点分式同层文件（目录分隔符 → `.`），让 prefetch 真正命中。
 *
 * 用 rename（移动）而非 copy：目录式文件名客户端从不请求，纯属死重，
 * 移动不增加 out/ 体积，还能顺带清掉空目录。
 *
 * 运行：node scripts/fix-rsc-payload-paths.mjs（已接入 npm run build）
 * 支持 --dry-run 只打印将要做的事，不实际改动。
 */
import { existsSync, readdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const DRY_RUN = process.argv.includes("--dry-run");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");

if (!existsSync(OUT)) {
  console.warn("[fix-rsc-payload] out/ 不存在，跳过（可能尚未构建）");
  process.exit(0);
}

/** 递归收集所有名字以 __next. 开头的目录 */
function collectNextDirs(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = join(dir, e.name);
    if (e.name.startsWith("__next.")) acc.push(p);
    else collectNextDirs(p, acc);
  }
  return acc;
}

/** 递归收集目录下所有文件 */
function collectFiles(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) collectFiles(p, acc);
    else acc.push(p);
  }
  return acc;
}

const dirs = collectNextDirs(OUT);
let moved = 0;
let removedDirs = 0;

for (const d of dirs) {
  const base = d.split(/[\\/]/).pop(); // 如 __next.chapters
  const files = collectFiles(d);

  for (const f of files) {
    // f 相对 d 的路径（系统分隔符），展平为点分式文件名
    const rel = relative(d, f).split(/[\\/]/).join(".");
    const target = join(dirname(d), `${base}.${rel}`);
    if (DRY_RUN) {
      console.log(`[dry-run] ${relative(OUT, f)} -> ${relative(OUT, target)}`);
    } else {
      renameSync(f, target);
    }
    moved++;
  }

  if (!DRY_RUN) {
    rmSync(d, { recursive: true, force: true });
    removedDirs++;
  }
}

console.log(
  `[fix-rsc-payload] ${DRY_RUN ? "[dry-run] " : ""}展平 ${moved} 个 RSC 载荷文件` +
    (DRY_RUN ? "" : `，清理 ${removedDirs} 个 __next.* 目录`)
);
