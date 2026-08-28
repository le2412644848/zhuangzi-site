/**
 * 从各篇 chapter JSON 重新生成 src/data/chapters/metadata.json。
 *
 * 取代 scripts/generate_metadata.py（Python 版）：
 *  - Python 版不输出 passageIds —— 而 passageNumber() 依赖 passageIds
 *    渲染「第 N 节」，按旧脚本重跑会静默破坏功能（现被 tests/data-integrity
 *    拦住）。本版本补齐。
 *  - 统一为 Node，CI 无需 Python 环境。
 *
 * 输出格式与仓库提交版本保持一致（数组、2 空格缩进、UTF-8 中文、
 * 键序 id/title/category/order/summary/conclusion/passageCount/passageIds、
 * 按 order 排序、无结尾换行），因此 CI 可用
 * `node scripts/gen-metadata.mjs && git diff --exit-code` 校验一致性。
 *
 * 运行：node scripts/gen-metadata.mjs
 */
import { readdirSync,readFileSync, writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src", "data", "chapters");

const files = readdirSync(SRC)
  .filter((f) => f.endsWith(".json") && f !== "metadata.json")
  .sort();

const entries = [];
for (const fname of files) {
  const ch = JSON.parse(readFileSync(join(SRC, fname), "utf8"));
  const passages = ch.passages ?? [];
  entries.push({
    id: ch.id,
    title: ch.title,
    category: ch.category,
    order: ch.order,
    summary: ch.summary,
    conclusion: ch.conclusion ?? null,
    passageCount: passages.length,
    passageIds: passages.map((p) => p.id),
  });
}

entries.sort((a, b) => a.order - b.order);

const OUT = join(SRC, "metadata.json");
// JSON.stringify 与 Python json.dump(ensure_ascii=False, indent=2) 逐字节一致
// （无结尾换行，与仓库当前提交一致）
writeFileSync(OUT, JSON.stringify(entries, null, 2), "utf8");

console.log(`Generated ${OUT} with ${entries.length} entries.`);
