/**
 * 部署前清理纯重复的 RSC payload 文件。
 *
 * Next.js 16 静态导出为每个页面生成 index.txt 与 __next._full.txt，
 * 两者**逐字节相同**（各 ~90KB，全站约 3MB 纯冗余）。HTML 内联的
 * payload 即 index.txt 的内容，客户端导航的完整树在
 * __next.chapters/.../__PAGE__.txt（不同内容，保留）。
 *
 * 本脚本只删除「与同目录 index.txt 逐字节相同」的 __next._full.txt，
 * 不碰任何其他文件 —— 删除后客户端导航不受影响（页面运行时按
 * index.txt / __PAGE__.txt 取数；HTML 不引用 _full.txt，已实测）。
 *
 * 运行：node scripts/clean-duplicate-payload.mjs（npm run deploy 前）
 */
import { existsSync, readdirSync,readFileSync, statSync, unlinkSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

let removed = 0;
let saved = 0;
for (const f of walk(OUT)) {
  if (!f.endsWith("__next._full.txt")) continue;
  const indexTxt = join(dirname(f), "index.txt");
  if (existsSync(indexTxt) && readFileSync(indexTxt).equals(readFileSync(f))) {
    saved += statSync(f).size;
    unlinkSync(f);
    removed++;
  }
}

console.log(
  `[clean-duplicate-payload] 删除 ${removed} 个重复 __next._full.txt，节省 ${(saved / 1024 / 1024).toFixed(2)}MB`
);
