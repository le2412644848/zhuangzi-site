/**
 * 构建期数据形状校验（TODO 3.10 落地）。
 *
 * 用 scripts/data-schema.mjs 的 Zod Schema 对 src/data/ 全部 JSON
 * 做 safeParse。此前这些数据经 `as Chapter` 等未校验断言进入应用，
 * 形状变化只会在运行时静默少内容；本脚本把校验提前到构建期，
 * 任何形状不合规都直接中断构建。
 *
 * 运行：node scripts/validate-data.mjs（已接入 npm run build / verify）
 */
import { readdirSync,readFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

import {
  Chapter,
  Concept,
  ConcordanceWord,
  Fable,
  KaojuMap,
  MapLocation,
  PassageKaojuMap,
  Quote,
  ReadingRoute,
  RelatedPassage,
  TimelineEntry,
} from "./data-schema.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "src", "data");

const readJson = (p) => JSON.parse(readFileSync(join(DATA, p), "utf8"));
const zArrayOf = (schema) => z.array(schema);

const failures = [];
const check = (label, data, schema) => {
  const r = schema.safeParse(data);
  if (r.success) {
    console.log(`  ✅ ${label}`);
    return r.data;
  }
  console.error(`  ❌ ${label}`);
  for (const issue of r.error.issues.slice(0, 8)) {
    console.error(`     ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  failures.push(label);
  return null;
};

console.log("— 篇章数据 —");
for (const f of readdirSync(join(DATA, "chapters")).filter((x) => /^\d{2}-.+\.json$/.test(x))) {
  check(`chapters/${f}`, readJson(`chapters/${f}`), Chapter);
}

console.log("— 概念 / 考据 —");
check("concepts/index.json", readJson("concepts/index.json").concepts, zArrayOf(Concept));
check("kaoju.json", readJson("kaoju.json"), KaojuMap);
check("kaoju_fang.json", readJson("kaoju_fang.json"), KaojuMap);
check("passage_kaoju.json", readJson("passage_kaoju.json"), PassageKaojuMap);
check("passage_kaoju_fang.json", readJson("passage_kaoju_fang.json"), PassageKaojuMap);

console.log("— 其他语料 —");
check("quotes.json", readJson("quotes.json").quotes, zArrayOf(Quote));
check("fables.json", readJson("fables.json").fables, zArrayOf(Fable));
check("related.json", readJson("related.json").conceptMap, z.record(z.string(), z.array(RelatedPassage)));
check("concordance.json", readJson("concordance.json").words, zArrayOf(ConcordanceWord));
check("timeline.json", readJson("timeline.json"), zArrayOf(TimelineEntry));
check("map-locations.json", readJson("map-locations.json"), zArrayOf(MapLocation));
check("reading-routes.json", readJson("reading-routes.json").routes, zArrayOf(ReadingRoute));

if (failures.length > 0) {
  console.error(`\n❌ 数据校验失败 ${failures.length} 项：${failures.join("、")}`);
  console.error("   数据形状与 scripts/data-schema.mjs 不一致，构建中止。");
  process.exit(1);
}
console.log("\n✅ 全部数据通过 Zod 形状校验");
