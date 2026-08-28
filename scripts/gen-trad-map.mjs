/**
 * 一次性生成器：从 SimplifiedToggle.tsx 的 TRAD_MAP 提取简→繁映射，
 * 剔除「一简对多繁」的歧义字与恒等项，输出 src/data/trad-map.ts。
 *
 * 为什么必须剔除：
 * 逐字 1:1 映射无法正确做简→繁转换。原表把「千」映射为「韆」——
 * 而「韆」只用于「鞦韆」，于是《逍遥游》的「不知其几千里也」会变成
 * 「几韆里」。同类错误还有 面→麵（面目→麵目）、只→隻、发→發、
 * 历→曆、后→後、于→於 等。这些字在语料中出现 176~2076 次，
 * 属实质性的古籍文本讹误，而非样式问题。
 *
 * 运行：node scripts/gen-trad-map.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src", "components", "SimplifiedToggle.tsx");

/**
 * 「一简对多繁」字表：这些简体字对应多个繁体字，正确形式取决于词义/语境，
 * 逐字替换必然在部分语境下出错，故一律不转换（保持原字）。
 * 参考通行的简繁一对多字表，并针对先秦文献补入 于/后/与/万 等。
 */
const AMBIGUOUS = new Set([
  // 经典一简对多繁
  "干", "发", "复", "历", "只", "台", "云", "后", "系", "余",
  "谷", "划", "尽", "荐", "卷", "蒙", "面", "苏", "团", "叶",
  "佣", "摆", "别", "卜", "布", "采", "冲", "丑", "出", "厨",
  "当", "党", "淀", "吊", "迭", "斗", "恶", "范", "坊", "分",
  "峰", "柜", "汇", "伙", "获", "几", "家", "价", "克", "困",
  "腊", "累", "厘", "里", "帘", "了", "霉", "弥", "蔑", "千",
  "秋", "曲", "舍", "折", "征", "志", "制", "钟", "朱", "注",
  "郁", "借", "尸", "松", "咸", "纤", "须", "凶", "痒", "签",
  "胜", "种", "重", "难", "确", "并", "摊", "泄", "扎", "占",
  "证", "杆", "谚", "哄", "咨", "刨",
  // 先秦文献中本就并存、不应合并的字
  "于",  // 于/於 在传世文本中并存且有别，且语料出现 2000+ 次
  "与",  // 与/與：「与」亦为古字
  "万",  // 万/萬：「万」为古已有之的异体
  "尔",  // 尔/爾
  "无",  // 无/無：《庄子》两形并见
  "气",  // 气/氣
  "众",  // 众/眾
  "处",  // 处/處
  "号",  // 号/號
  "礼",  // 礼/禮
]);

const text = readFileSync(SRC, "utf8");
const block = text.match(/const TRAD_MAP: Record<string, string> = \{([\s\S]*?)\n\};/);
if (!block) {
  console.error("未能在 SimplifiedToggle.tsx 中定位 TRAD_MAP");
  process.exit(1);
}

const pairs = [...block[1].matchAll(/"(.)":\s*"(.)"/g)].map((m) => [m[1], m[2]]);

const kept = [];
const droppedIdentity = [];
const droppedAmbiguous = [];
const seen = new Set();

for (const [simp, trad] of pairs) {
  if (seen.has(simp)) continue;
  seen.add(simp);
  if (simp === trad) {
    droppedIdentity.push(simp);
  } else if (AMBIGUOUS.has(simp)) {
    droppedAmbiguous.push(`${simp}→${trad}`);
  } else {
    kept.push([simp, trad]);
  }
}

// 反向唯一性检查：若两个简体字映射到同一繁体字，繁→简回转会产生歧义
const byTrad = new Map();
for (const [s, t] of kept) {
  if (!byTrad.has(t)) byTrad.set(t, []);
  byTrad.get(t).push(s);
}
const collisions = [...byTrad.entries()].filter(([, v]) => v.length > 1);

const lines = [];
lines.push("/**");
lines.push(" * 简 → 繁 字符映射（安全子集）。");
lines.push(" *");
lines.push(" * 由 scripts/gen-trad-map.mjs 生成，请勿手改；改规则请改生成器。");
lines.push(" *");
lines.push(" * ⚠️ 只收录**一简对一繁**的无歧义字。");
lines.push(" * 「一简对多繁」的字（如 千/韆、面/麵、只/隻、发/發、历/曆、后/後、于/於）");
lines.push(" * 一律不转换 —— 逐字替换会在部分语境下产生讹字，例如");
lines.push(" * 「不知其几千里也」曾被转成「几韆里」。古籍站的文本正确性优先于覆盖率。");
lines.push(" *");
lines.push(` * 收录 ${kept.length} 组；剔除歧义字 ${droppedAmbiguous.length} 组、恒等项 ${droppedIdentity.length} 组。`);
lines.push(" */");
lines.push("export const TRAD_MAP: Readonly<Record<string, string>> = Object.freeze({");
for (let i = 0; i < kept.length; i += 8) {
  const chunk = kept.slice(i, i + 8).map(([s, t]) => `"${s}": "${t}",`).join(" ");
  lines.push("  " + chunk);
}
lines.push("});");
lines.push("");
lines.push("/** 繁 → 简 反向映射（由上表唯一反转而来） */");
lines.push("export const SIMP_MAP: Readonly<Record<string, string>> = Object.freeze(");
lines.push("  Object.fromEntries(Object.entries(TRAD_MAP).map(([s, t]) => [t, s]))");
lines.push(");");
lines.push("");
lines.push("/** 不做转换的一简对多繁字（供测试断言与文档引用） */");
lines.push("export const AMBIGUOUS_EXCLUDED: readonly string[] = Object.freeze([");
lines.push("  " + [...AMBIGUOUS].map((c) => `"${c}"`).join(", "));
lines.push("]);");
lines.push("");

writeFileSync(join(ROOT, "src", "data", "trad-map.ts"), lines.join("\n"), "utf8");

console.log(`原表 ${pairs.length} 组（去重后 ${seen.size}）`);
console.log(`  保留         : ${kept.length}`);
console.log(`  剔除·歧义字  : ${droppedAmbiguous.length}`);
console.log(`     ${droppedAmbiguous.slice(0, 24).join("  ")}${droppedAmbiguous.length > 24 ? " …" : ""}`);
console.log(`  剔除·恒等项  : ${droppedIdentity.length}  (${droppedIdentity.slice(0, 20).join("")}${droppedIdentity.length > 20 ? "…" : ""})`);
if (collisions.length) {
  console.log(`  ⚠ 反向冲突   : ${collisions.length}`);
  for (const [t, v] of collisions) console.log(`     ${v.join("/")} → ${t}`);
}
console.log(`\n已写出 src/data/trad-map.ts`);
