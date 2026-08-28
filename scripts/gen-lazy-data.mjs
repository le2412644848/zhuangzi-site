/**
 * 生成「按需加载」的懒加载数据（章节页首屏减重 v3）。
 *
 * 背景：静态导出下 RSC payload 始终包含整页树（HTML 之外的第二份全文），
 * 译本对照与段落考据这类「展开才看」的内容如果全部直出，首屏 HTML 会
 * 携带两三百 KB 的冗余。本脚本在构建期把这两类数据按篇拆成独立 JSON
 * （public/data/…），客户端组件在用户展开对应折叠区时才 fetch ——
 * 首屏只出现「有几个版本 / 几条注」的数字。
 *
 * 产物（均不进任何 bundle，仅运行时按需 fetch）：
 *   public/data/translations/<chapterId>.json
 *     { [passageId]: { default: string, versions: {translator,text}[] } }
 *   public/data/kaoju/<chapterId>.json
 *     { entries: { chen: KaojuEntry[], fang: KaojuEntry[] },
 *       passages: { [passageId]: { chen: KaojuEntry[], fang: KaojuEntry[] } } }
 *
 * 运行：node scripts/gen-lazy-data.mjs（npm run build 流程内自动执行）
 */
import { existsSync, mkdirSync, readdirSync,readFileSync, writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "src", "data");
const OUT_DIR = join(ROOT, "public", "data");

const readJson = (p) => JSON.parse(readFileSync(join(DATA, p), "utf8"));

const chaptersDir = join(DATA, "chapters");
const chapterFiles = existsSync(chaptersDir)
  ? readdirSync(chaptersDir).filter((f) => /^\d{2}-.+\.json$/.test(f))
  : [];

const kaoju = readJson("kaoju.json");
const kaojuFang = readJson("kaoju_fang.json");
const passageKaoju = readJson("passage_kaoju.json");
const passageKaojuFang = readJson("passage_kaoju_fang.json");

mkdirSync(join(OUT_DIR, "translations"), { recursive: true });
mkdirSync(join(OUT_DIR, "kaoju"), { recursive: true });

let tBytes = 0;
let kBytes = 0;

for (const file of chapterFiles) {
  const chapterId = file.replace(/\.json$/, "");
  const key = chapterId.split("-")[0];
  const chapter = readJson(join("chapters", file));

  // 译本：仅保留 passageId → 全部版本（含默认白话，作为对照基准）
  const translations = {};
  for (const p of chapter.passages ?? []) {
    if (p.translations && p.translations.length > 0) {
      translations[p.id] = {
        default: p.translation,
        versions: p.translations,
      };
    }
  }
  const tJson = JSON.stringify(translations);
  if (Object.keys(translations).length > 0) {
    writeFileSync(join(OUT_DIR, "translations", `${chapterId}.json`), tJson);
    tBytes += tJson.length;
  }

  // 考据：篇级词条（陈鼓应+方勇）+ 段落级注（陈鼓应+方勇）
  const entries = {
    chen: kaoju[key] ?? [],
    fang: kaojuFang[key] ?? [],
  };
  const passages = {};
  const pk = passageKaoju[key] ?? {};
  const pkf = passageKaojuFang[key] ?? {};
  const allPassageIds = new Set([...Object.keys(pk), ...Object.keys(pkf)]);
  for (const pid of allPassageIds) {
    passages[pid] = {
      chen: pk[pid] ?? [],
      fang: pkf[pid] ?? [],
    };
  }
  const kJson = JSON.stringify({ entries, passages });
  writeFileSync(join(OUT_DIR, "kaoju", `${chapterId}.json`), kJson);
  kBytes += kJson.length;
}

console.log(
  `[gen-lazy-data] 已生成 ${chapterFiles.length} 篇译本(${(tBytes / 1024).toFixed(0)}KB) + 考据(${(kBytes / 1024).toFixed(0)}KB) 懒加载数据 → public/data/`
);
