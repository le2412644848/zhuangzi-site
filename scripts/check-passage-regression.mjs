/**
 * P0-1.1 章节页减重 · 产物级功能回归检查。
 *
 * 无法目视浏览器，改用产物断言：
 *  - 章节页 HTML：工具条 8 按钮齐全、data-passage-root、原文/译文/
 *    pinyin-original、annotation-panel、多译本/考据折叠 summary、逐字注按钮
 *  - 懒加载数据：public/data 已复制进 out/，33 篇译本+考据 JSON 格式正确
 *  - 默认交互状态与 server HTML 一致（split/pinyin 类不出现、批注面板隐藏）
 */
import { existsSync, readdirSync,readFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log(`  ✅ ${msg}`);
  else {
    console.error(`  ❌ ${msg}`);
    failures++;
  }
};

// 1) 章节页结构
const qiwu = readFileSync(join(OUT, "chapters", "02-qiwu-lun", "index.html"), "utf8");
console.log("— 章节页 02-qiwu-lun 结构 —");
ok(qiwu.includes('data-passage-root'), "data-passage-root 存在");
ok((qiwu.match(/aria-label="(?:收藏|取消收藏)"/g) || []).length >= 1, "收藏按钮");
ok((qiwu.match(/aria-label="批注"/g) || []).length >= 1, "批注按钮");
ok((qiwu.match(/aria-label="(?:已复制|复制)"/g) || []).length >= 1 && qiwu.includes('aria-haspopup="menu"'), "复制按钮（带选项菜单）");
ok((qiwu.match(/aria-label="(?:已复制链接|复制段落链接)"/g) || []).length >= 1, "链接按钮");
ok((qiwu.match(/aria-label="(?:隐藏拼音|显示拼音)"/g) || []).length >= 1, "拼音按钮");
ok((qiwu.match(/aria-label="(?:退出沉浸阅读|沉浸阅读)"/g) || []).length >= 1, "沉浸按钮");
ok((qiwu.match(/aria-label="(?:上下排列|分栏对照)"/g) || []).length >= 1, "分栏按钮");
ok((qiwu.match(/aria-label="(?:停止朗读|朗读原文)"/g) || []).length >= 1, "朗读按钮");
ok(qiwu.includes("annotated-original"), "注释版原文容器");
ok(qiwu.includes("pinyin-original"), "拼音槽容器");
ok(qiwu.includes("annotation-panel"), "批注面板容器");
ok(qiwu.includes("多译本对照"), "多译本对照折叠");
ok(qiwu.includes("陈鼓应注"), "陈鼓应注折叠");
ok(qiwu.includes("查看注释"), "逐字注按钮（WordTooltip）");
ok(qiwu.includes("passage-grid"), "分栏网格容器");
ok(!qiwu.includes("split-view"), "初始无 split-view 类（hydration 一致）");
ok(!qiwu.includes("pinyin-on"), "初始无 pinyin-on 类");
// 2) 懒加载数据
console.log("— 懒加载数据 —");
const dataOut = join(OUT, "data");
ok(existsSync(dataOut), "out/data 存在");
const tFiles = readdirSync(join(dataOut, "translations")).filter((f) => f.endsWith(".json"));
const kFiles = readdirSync(join(dataOut, "kaoju")).filter((f) => f.endsWith(".json"));
ok(tFiles.length === 33, `译本 JSON ${tFiles.length}/33 篇`);
ok(kFiles.length === 33, `考据 JSON ${kFiles.length}/33 篇`);
const t02 = JSON.parse(readFileSync(join(dataOut, "translations", "02-qiwu-lun.json"), "utf8"));
const pids = Object.keys(t02);
ok(pids.length > 0, `齐物论译本覆盖 ${pids.length} 段`);
ok(pids.every((pid) => t02[pid].default && Array.isArray(t02[pid].versions)), "译本条目结构（default+versions）");
const k02 = JSON.parse(readFileSync(join(dataOut, "kaoju", "02-qiwu-lun.json"), "utf8"));
ok(Array.isArray(k02.entries.chen) && k02.entries.chen.length > 0, `篇级陈鼓应词条 ${k02.entries.chen.length} 条`);
ok(Array.isArray(k02.entries.fang) && k02.entries.fang.length > 0, `篇级方勇词条 ${k02.entries.fang.length} 条`);
ok(Object.keys(k02.passages).length > 0, `段落级考据覆盖 ${Object.keys(k02.passages).length} 段`);
// 3) 首页仍正常
const home = readFileSync(join(OUT, "index.html"), "utf8");
console.log("— 首页 —");
ok(home.includes("莊子"), "首页标题");
ok(home.includes("site-header"), "导航 header");
ok(home.includes("site-footer"), "页脚 footer");

console.log(failures === 0 ? "\n✅ P0-1.1 产物回归检查全部通过" : `\n❌ ${failures} 项失败`);
process.exit(failures === 0 ? 0 : 1);
