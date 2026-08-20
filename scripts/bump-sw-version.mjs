// 构建后自动更新 Service Worker 缓存版本号
// 用 .next/BUILD_ID（每次构建唯一）替换 sw.js 里硬编码的 v1，
// 避免部署新版本后旧 SW 缓存不失效、用户看到旧内容。
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const cwd = process.cwd();
const buildId = readFileSync(join(cwd, ".next", "BUILD_ID"), "utf8").trim();
const swPath = join(cwd, "out", "sw.js");
const sw = readFileSync(swPath, "utf8");

const bumped = sw.replace(
  /(zhuangzi-(?:static|pages|json))-v\d+/g,
  `$1-${buildId}`
);

if (bumped === sw) {
  console.warn("[sw] 未找到可替换的缓存版本号，跳过");
} else {
  writeFileSync(swPath, bumped);
  console.log(`[sw] 缓存版本号已更新为 ${buildId}`);
}
