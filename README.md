# 莊子數位典藏

《庄子》三十三篇的数字典藏与深读工具：原文、白话翻译、逐字注、历代考据训诂，
以及概念知识图谱、词语索引、寓言集、名句、地理图、时间线与主题阅读路线。

* 技术栈：Next.js 16（App Router）· TypeScript · Tailwind CSS v4
* 交付形态：`output: "export"` 全静态导出，部署于 Cloudflare Pages
* 数据规模：33 篇正文 + 1049 条词条注释 + 约 5MB 考据/训诂语料

---

## 快速开始

```bash
npm install
npm run dev          # http://localhost:3000
```

常用脚本：

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发服务器 |
| `npm run build` | 生产构建（导出到 `out/`，并刷新 SW 缓存版本号） |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint（覆盖 `src/`、`scripts/`、`functions/`） |
| `npm test` | 数据完整性 + 主题对比度 + 简繁映射测试 |
| `npm run verify` | typecheck + lint + test，提交前跑一遍 |
| `npm run budget` | 首屏体积预算检查（需先 build） |
| `npm run deploy` | 构建并发布到 Cloudflare Pages |

构建后建议再跑两个产物级校验（CI 已包含）：

```bash
node scripts/check-output.mjs   # canonical / sitemap / manifest / SW 版本
node scripts/check-budget.mjs   # 首屏体积
```

---

## 架构

```
src/
  app/                  App Router 路由
    layout.tsx          根布局：站点级 metadata、JSON-LD、主题内联脚本
    <route>/layout.tsx  仅导出 metadata 的 server component
                        （因为对应 page.tsx 是 "use client"，无法自己导出）
    chapters/[id]/      章节正文页（server component，构建期读取考据数据）
    concepts/[id]/      概念详情页
  components/           UI 组件（多数为 "use client"）
  data/                 全部内容数据（JSON + 类型化入口）
  lib/
    site.ts             站点常量：SITE_URL / canonicalUrl() / buildPageMetadata()
    theme.ts            主题调色板（单一数据源）
    kaoju.ts            ⚠️ 服务端专用：静态 import 约 5MB 考据 JSON
    kaoju-utils.ts      纯函数，客户端可安全引用
    search.ts           全文检索（fuse.js 与全量数据均为动态 import）
functions/api/chat.js   Cloudflare Pages Function：DeepSeek 代理
scripts/                构建期与一次性数据脚本
tests/                  Vitest 测试
```

### 两条必须遵守的边界

**1. 重数据只能在服务端引用。**
`src/lib/kaoju.ts` 静态 import 了四个 JSON，合计约 5MB。它只能被 server component
引用；任何 `"use client"` 文件误引一次，这 5MB 就会进浏览器 bundle，而且
**没有任何编译错误**。客户端要用相关逻辑，请引 `src/lib/kaoju-utils.ts`（纯函数）。

> 现状是靠注释约定。建议加 `server-only` 包与 ESLint `no-restricted-imports`
> 做硬约束，见 `docs/IMPROVEMENT-ROADMAP.md` 第 3 节。

**2. canonical 必须每个路由各自声明，根布局绝不能声明。**
Next.js 的 metadata 会向下继承。根布局一旦写 `alternates.canonical`，
所有未在自身 `generateMetadata` 覆盖它的路由都会输出「canonical = 首页」，
等于告诉搜索引擎这些页面是首页副本。此前共 22 个路由中招（含 `/chapters`、
`/concepts`、`/quotes`、`/fables`、`/timeline`）。
新增路由时请用 `buildPageMetadata({ title, description, path })`，
并由 `scripts/check-output.mjs` 在 CI 中把关。

---

## 数据模型

章节 JSON（`src/data/chapters/NN-slug.json`）：

```jsonc
{
  "id": "01-xiaoyao-you",
  "title": "逍遥游",
  "category": "内篇",          // 内篇 | 外篇 | 杂篇
  "order": 1,
  "summary": "…",
  "intro": "…",                 // 篇首题解
  "conclusion": "…",
  "passages": [
    {
      "id": "01-xiaoyao-you-1", // 必须以篇 id 为前缀
      "original": "…",
      "translation": "…",
      "commentary": "【逐字注】…【章旨】…",
      "concepts": ["xiaoyao"],  // 必须存在于 concepts/index.json
      "annotations": [{ "term": "野马", "text": "…" }],
      "translations": [{ "translator": "陈鼓应", "text": "…" }]
    }
  ]
}
```

* `metadata.json` 是上述文件的轻量派生（含 `passageIds`，`passageNumber()` 依赖它）。
  正文与它不一致时 `npm test` 会失败。
* `annotations[].term` 若未出现在 `original` 中，则无法内联渲染；
  这类主题性词条（如「庖丁解牛」「朝三暮四」）会显示在段落下方的**要义**区，
  不再被静默丢弃。
* 考据数据按两位篇序号索引：`kaoju.json["01"]`。
  `getKaojuByChapter` 用 `chapterId.split("-")[0]` 取键，
  键位约定变化会让整篇注释静默消失 —— 已由测试覆盖。

### 内容来源与版权（重要）

* 《庄子》**原文**及清代以前注疏（陆德明《经典释文》、成玄英疏等）属公有领域。
* 但本项目的**白话翻译、题解、逐字注、考据训诂**大量引述
  陈鼓应《庄子今注今译》、方勇《庄子纂要》等**现代学术著作**，
  这些内容受著作权保护。公开部署前请确认授权情况，
  并建立独立的「引用与致谢」页面标注来源。
* 仓库目前**没有 LICENSE**。建议对**代码**采用 MIT/Apache-2.0，
  并在其中明确排除 `src/data/` 下的文本数据。

---

## 主题系统

五个主题：宣纸（默认）· 竹简 · 墨韵 · 青花 · 夜读（深色）。

调色板**只在 `src/lib/theme.ts` 定义**，以下三者全部由它派生：

1. `<head>` 内的防闪烁内联脚本（`buildInlineThemeScript()`）
2. `ThemeProvider` 运行时切换
3. `<meta name="theme-color">` 与 `color-scheme`

> 曾经这三处各有一份手抄副本。后果是 `globals.css` 把辅助文字色从
> `#A89880`（2.67:1，不达 WCAG AA）修正为更深的值，但另两处仍写旧值，
> 且以**行内样式**落到 `:root`（优先级高于样式表），修复被完全抵消。
> `tests/theme-contrast.test.ts` 现在会对五个主题逐一校验对比度，
> 改坏任何一处都会红。

新增主题：在 `theme.ts` 的 `themes` 里加一项，补齐 `ThemeColors` 全部字段即可；
测试会自动覆盖新主题的对比度与变量完整性。

---

## 部署

推送到 `main` 触发 `.github/workflows/ci.yml`：
typecheck → lint → test → build → 体积预算 → 产物自检 → Lighthouse → 部署。

需要配置：

| 类型 | 名称 | 说明 |
| --- | --- | --- |
| Secret | `CLOUDFLARE_API_TOKEN` | Pages 部署权限 |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | |
| Variable | `SITE_URL` | 站点根 URL，如 `https://zhuangzi.example.com` |

**绑定自定义域名只需改 `SITE_URL`**：canonical、sitemap、robots、OG
全部由 `src/lib/site.ts` 的 `SITE_URL` 派生（可用 `NEXT_PUBLIC_SITE_URL` 覆盖）。

### AI 功能（问庄子 / 诸子对谈 等）

采用 BYOK：访问者自备 DeepSeek API Key，存于其浏览器 `localStorage`，
经 `functions/api/chat.js` 转发。该函数已加同源校验、限流、输入上限、
模型白名单、上游错误脱敏与超时保护。

> 这一架构的固有弱点是**用户密钥途经本站**。若要长期运营，
> 建议改为服务端自持密钥 + 自建配额，或让浏览器直连 DeepSeek。
> 见 `docs/IMPROVEMENT-ROADMAP.md` 第 2 节。

---

## 性能基线

当前实测（gzip，`npm run budget`）：

| 指标 | 数值 |
| --- | --- |
| 共享 JS 基线（每个路由） | ~193 KB |
| 最重路由 `/chapters/02-qiwu-lun` | ~471 KB（HTML 247 + JS 213 + CSS 11） |
| `out/` 总体积 | ~41 MB |

`/chapters/02-qiwu-lun` 的 HTML 里约 43% 是给客户端组件做 hydration 的
RSC 重复载荷（正文与考据被序列化了两遍）。
优化方案见 `docs/IMPROVEMENT-ROADMAP.md` 第 1 节。

预算在 `scripts/check-budget.mjs` 的 `BUDGETS` 中，超出即 CI 失败。

---

## 相关文档

* [`docs/TODO.md`](docs/TODO.md) —— **可直接开工的待办清单**（含优先级、验收标准、
  刻意不做的事项、待拍板事项）。开工前先看这份。
* [`docs/IMPROVEMENT-ROADMAP.md`](docs/IMPROVEMENT-ROADMAP.md) —— 对标主流网站的
  完整审计结论：每项缺陷的证据、影响与修复说明。

---

## UI 优化记录（2026-08-28）

东方新文人美学 × 现代数字典藏 全面升级，经多模态视觉验收（全项达标 · 准予发布）：

* **色彩体系**：澄心堂宣纸 #FAF8F4 暖底、玄青暗夜 #161412、远山竹青 + 朱砂印泥点睛，WCAG AA 对比度全量达标
* **首页 Hero**：断笔禅圆呼吸光晕 + 巨字「遊」水印 + 毛玻璃搜索框
* **核心组件**：Navigation 宣纸透光 + 竹青竖指示线、Card hover 微浮暖调阴影、Button 语义类、Footer 水墨渐隐边线 + 朱砂方印
* **页面**：每日一则线装古籍书页（竖排提字/缎带书签/装订线）、三区段渐变徽章、Stagger 淡入动效
* **主题系统**：五套主题（宣纸/竹简/墨韵/青花/夜读）单一真值源，新增 accent-bamboo / danger token
* **无障碍**：暗色按钮对比度、热图主题感知、danger 色 token 全量修复

线上地址：https://zhuangzi-site.pages.dev

## 版本归档规则

主目录 zhuangzi-site 为**工作版**，改版前必须先归档：

`ash
# 运行归档脚本（自动归档为 zhuangzi-site-vN，版本号递增）
powershell -File "归档当前版本.ps1"
`

已归档：zhuangzi-site-v1（历史备份）、zhuangzi-site-v2（原版基线）。
