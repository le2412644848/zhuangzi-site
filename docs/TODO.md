# 庄子网站 · 待办清单（TODO）

> 这是**可直接开工**的待办清单。审计过程、证据与已修项见
> [`IMPROVEMENT-ROADMAP.md`](./IMPROVEMENT-ROADMAP.md)。
>
> 项目路径：`C:\Users\Administrator\OneDrive\桌面\reasonix项目\zhuangzi-site`
> 上次收尾：2026-08-21（P0+P1+P2 全干：章节页首屏 -45%、数据管线可复现、
> Zod 形状校验、检索重写、字体子集化、OG 图、无障碍批次、TS 加严）
> 2026-08-22 第二轮：信息架构补全、导航骨架屏、View Transitions、404 搜索化
> 2026-08-22 第三轮：功能批次（书斋管理/名句内嵌标记/搜索联想/
> 快捷键面板/入门徽章/引用复制/对谈 RAG）——详见下方 1.5
>
> ⚠️ 2026-08-22 01:33 主机在满载构建时意外断电一次（Kernel-Power 41、
> bugcheck=0，非软件蓝屏；疑似散热/电源满载跳保护）。此后构建一律走
> 降载模式：4/12 核 + BelowNormal 优先级
> （`%TEMP%\throttle-build.ps1`，用后可删）。

---

## 0. 开工前先跑一遍，确认基线没坏

```bash
cd "C:\Users\Administrator\OneDrive\桌面\reasonix项目\zhuangzi-site"
npm run verify          # typecheck + lint + Zod 数据校验 + 79 个测试
npm run build
node scripts/check-output.mjs    # canonical / sitemap / manifest / SW 版本
node scripts/check-budget.mjs    # 首屏体积
node scripts/check-passage-regression.mjs  # 章节页产物结构回归
```

**当前基线（改动后必须不退化）**

| 指标 | 当前值 | 上次收尾值 |
| --- | --- | --- |
| typecheck / lint | 0 错 | 0 错 |
| 测试 | 79 passed | 79 passed |
| 路由数 | 86（+ /recite） | 85 |
| canonical 指向首页 | 0 | 0 |
| 使用默认标题 | 0 | 0 |
| 共享 JS 基线（gzip） | 196.8 KB | 194.8 KB |
| 最重路由 | ~266 KB | 265.9 KB（/concepts/ziran） |
| `out/` 总体积（部署前清理后） | ~36.3 MB | ~35.6 MB |
| 站内零入链路由 | 0（/annotations 为分享落地页，刻意不加） | 5 |

⚠️ **三条不可破坏的约束**

1. **canonical 必须每路由自声明，根布局绝不能声明**
   （`src/app/layout.tsx` 有注释说明；违反会让 22 个页面自称首页副本）。
   新增路由用 `buildPageMetadata({ title, description, path })`。
2. **`src/lib/kaoju.ts` 静态 import 约 5 MB，仅限 server component**。
   硬约束已落地：`import "server-only"` + ESLint 本地规则
   `local/no-client-kaoju`（只拦 `"use client"` 文件，服务端引用放行）。
   客户端要用逻辑请引 `src/lib/kaoju-utils.ts`。
3. **正文不得进入任何 client 祖先**：静态导出会把 client 组件的
   server children 完整序列化进 RSC 载荷（章节页重复载荷的根源）。
   新组件按「server 直出 + 叶子客户端岛」模式写；全局状态一律
   非包裹式（见 `src/lib/immersive.ts` 的 CSS 类 + 事件方案）。

---

## 1. P0 — 已完成 ✅

### 1.3 信息架构与功能可发现性（2026-08-22 对标升级）✅

审计发现 **5 个功能页在站内零 UI 入链**（sitemap 收录但用户找不到）：
`/dream`、`/translate-challenge`、`reading-path`（仅 /zhuangzi 一处）、
`/zhuangzi`（仅首页一处）、`/ask-zhuangzi`、`/compare`（仅页脚）。
「问庄子」「诸子对谈」这类 AI 特色功能实际只靠悬浮球入口。

修复（对标主流站「主链接 + 分组下拉、零重复」的信息架构）：

- **导航重组**（`Navigation.tsx`）：主链接精简为 首页/篇章/搜索，
  四个分组下拉——阅读（概念/名句/寓言/主题）、探索（时间线/地理/词语/
  热图/庄子生平）、**互动**（问庄子/诸子对谈/翻译挑战/庄周梦蝶/定制
  阅读路径）、工具（收藏/报告/卡片）。此前主链接与下拉重复占用宽度。
- **首页新增「深度互动」区块**（`page.tsx`）：5 张图标卡片（server 直出，
  无客户端成本）。
- **Footer 重组为五列**（`Footer.tsx`）：阅读/探索/**互动**/工具 + 品牌，
  补齐 `/zhuangzi`、`/dream`、`/translate-challenge`、`/reading-path`。
- **404 页搜索化**（`not-found.tsx`）：主流站 404 标配——搜索框
  （断链访客最可能的意图）+ 四篇名篇快捷入口（逍遥游/齐物论/养生主/秋水）。
- `/annotations` **刻意不加导航**：它是带查询参数的分享落地页，
  由段落工具条的分享按钮生成链接进入。
- 验收 ✅：入链分析全站 0 孤儿；浏览器实测下拉菜单、客户端导航、
  404 渲染全部正常。

### 1.4 导航体验：骨架屏 + 页面过渡（2026-08-22）✅

- **根级 `src/app/loading.tsx`**：server component 骨架（零 JS），
  客户端路由切换大页面（章节页未压缩 HTML 达 1MB）时提供即时反馈，
  此前点击后页面「卡住不动」。静态导出下首屏直接命中预渲染 HTML，
  仅导航期间显示 fallback。`role="status"` 供读屏播报。
- **View Transitions**（`globals.css`）：`@view-transition { navigation: auto }`
  一行 CSS 实现原生页面切换过渡（Chrome 126+/Edge/Safari 18+），
  不支持的浏览器自动降级，`prefers-reduced-motion` 下禁用。
- 体积代价：共享 JS +1.1KB（Suspense 边界）、out/ 清理后 +1.6MB
  （每路由 RSC 载荷含骨架段），预算检查全过。
- 验收 ✅：`grep` 确认骨架 fallback 已进全部路由 RSC 载荷（`*.txt`）；
  产物自检/预算/段落回归全过。

### 1.5 功能批次：书斋管理 + 名句标记 + 搜索联想等七项（2026-08-22 第三轮）✅

对标古诗文网 + 前两轮建议清单的第一/二批，共 7 项：

| # | 功能 | 说明 |
| --- | --- | --- |
| 1 | **「我的书斋」**（`/bookmarks` 重写） | 双 tab：收藏 / **批注**（此前批注写完无处回看）；每条批注显示篇名+节号、跳回原文锚点、可删除；**导出备份 / 导入**（合并去重）——`exportAnnotations` 等函数此前零引用，清缓存即静默丢数据。导航与页脚入口同步更名 |
| 2 | **原文内嵌名句标记** | 章节页构建期把 44 条名句按段落分组，在原文渲染时做二次切分高亮（`.quote-mark`），hover 显示主题+解读，点击跳 `/quotes#id`（quotes 页补了锚点）。**顺手修了数据 bug：10 条名句 passageId 指错段落**（如「天地与我并生」挂在朝三暮四段），已按原文实际位置重写 `quotes.json`。定位用两级匹配（去句末标点→去全部标点回映射）；9 条名句只存在于题解/注疏字段（正文语料为节本），优雅跳过 |
| 3 | **搜索即时联想** | SearchBar 聚焦/输入时下拉「篇/句」建议（篇名 + 名句，键盘 ↑↓ 可导航，回车仍走全文检索）。**数据刻意做成动态 import 的异步 chunk**——静态引入曾把共享 JS 基线从 195→220KB，改后 196.7KB |
| 4 | **`?` 快捷键帮助面板** | 根布局叶子客户端岛；站内已有 ⌘K/←→/b/m// 等快捷键但无处列出。页脚底部加提示入口 |
| 5 | **入门首选徽章** | `STARTER_CHAPTER_IDS`（逍遥游/齐物论/养生主/秋水）在首页与篇章页卡片显示 ★ 徽章 |
| 6 | **引用格式复制** | 段落工具条复制按钮升级为菜单：复制原文 / **带出处引用**（原文+《庄子·篇名·第N节》+段落链接）；复制后有「已复制」反馈（此前无任何反馈） |
| 7 | **诸子对谈补 RAG** | `/compare` 与问庄子同款：检索 top3 原文段落注入 system prompt，庄子方优先引原文，杜绝凭记忆引原文的失真 |

- 目录 scroll spy 核查后发现 **ChapterTOC 已自带**（IntersectionObserver + 高亮），无需重做。
- **顺手修存量 bug：段落工具条桌面端 hover 从不显示** —— CSS 写的是
  `.group:hover > .passage-toolbar`，但段落根类名是 Tailwind 命名分组
  `group/passage`（不同 token，`.group` 匹配不到），此前只有触屏常驻与
  focus-within 能救。修复：section 追加字面 `group` 类。
- 名句标记实现踩坑记录：① quotes 数据 10 条 passageId 指错段落（已按
  原文位置重写）② 句末标点差异（去标点定位）③ **注释词会把名句切断**
  （鲲、鹏是 WordTooltip 片段）——最终方案是「名句全文区间 × 普通片段
  求交集」分段标记，被切断的名句各段均可点击跳转。
- 回归脚本 `check-passage-regression.mjs` 的复制按钮断言已同步新语义（aria-haspopup 菜单）。
- 验收 ✅：typecheck/lint/79 测试/产物自检/预算/段落回归全过；浏览器实测
  书斋/名句/联想/徽章/帮助面板/复制菜单全部通过；名句标记 38 处（35 条
  可标记，9 条仅存于题解不标）。



### 1.1 章节页首屏减重（全站最大的一块）✅

| 项 | 内容 |
| --- | --- |
| **结果** | `/chapters/02-qiwu-lun` 首屏 **471.7 → 259.8 KB gzip**（-45%，达标 <300KB）；out/ 总体积 41.2 → 34.0 MB |
| **v2 教训** | 拆分组件边界**不减少** payload——静态导出下整页树必然序列化（server 组件渲染结果也在 payload 里），`LayoutClient` 等 client 祖先只是把重复量变大 |
| **v3 方案（最终生效）** | ① 页面主体不经过任何 client 祖先（layout.tsx 并列渲染，ThemeProvider 收进 Navigation，ErrorBoundary 由 app/error.tsx 取代，沉浸模式改 `html.immersive-mode` CSS 类）② **译本对照与段落考据懒加载**：构建期由 `scripts/gen-lazy-data.mjs` 拆成按篇 JSON（`/data/translations/`、`/data/kaoju/`），展开折叠区才 fetch（首屏只出现「N 个版本/N 条注」的数字）③ 拼音版原文从 DOM 读取（`PinyinSlot` 激活时取 `.annotated-original` 文本），不再序列化第二份原文 ④ 交互状态用「工具条切 CSS 类 + MutationObserver」而非跨组件共享状态（`split-view`/`pinyin-on`/`annotation-on`，见 globals.css） |
| **涉及文件** | `PassageView.tsx`（server 壳）、`PassageToolbar.tsx`（客户端岛）、`PinyinSlot.tsx`、`KaojuSection.tsx`、`TranslationCompare.tsx`、`WordTooltip.tsx`（kaoju 懒加载）、`ChapterTOC.tsx`（props 收窄为 id+短标签）、`layout.tsx`、`LayoutClient.tsx`（删除）、`ReadingModeProvider.tsx`（删除→`lib/immersive.ts`）、`globals.css`、`scripts/gen-lazy-data.mjs`、`scripts/check-passage-regression.mjs` |
| **验收** | ✅ <300KB、预算全过、75 测试全过、产物回归检查全过（工具条 8 按钮、折叠区、懒加载 JSON 33 篇） |
| **注意** | 手测要点：段落工具条 8 按钮（收藏/批注/复制/链接/拼音/沉浸/分栏/朗读）、多译本展开、考据展开、逐字注浮层训诂（首次点击有短暂加载） |

### 1.6 第三批功能：背诵模式 + 段落级续读 + 名句加厚（2026-08-22 第四轮）✅

| # | 功能 | 说明 |
| --- | --- | --- |
| 9 | **名句背诵 `/recite`** | 对标古诗文网「背诵」：44 句名句随机挖空填字（按字数 2–6 空），候选字区（本句汉字乱序）降猜运，Enter 检查、逐空正误着色（错字显示「你的→对的」），批改后展开译文+解读；主题筛选九类；统计（完成/全对/连对）存 localStorage。已接入导航「互动」组、首页深度互动区块、页脚、sitemap（路由 85→86） |
| 2 | **段落级续读** | 修「死功能」：`restoreProgress` 的段落锚点分支从未生效（旧 `currentPassageId` prop 无人传，存进去恒为空串）。现由 RecordReading 用 IntersectionObserver 内部跟踪可见段落（观察参数与 ChapterTOC scroll spy 一致），刷新/重进恢复到段落锚点；`/chapters` 篇章卡新增 `ChapterProgressBadge`（叶子岛，读 localStorage 显示「读至第 N 节 / 已读完」，无记录不渲染） |
| 11 | **名句内容加厚** | `scripts/enrich-quotes.mjs` 为全部 44 条补自撰「translation（今日译文）+ usage（今日适用）」；quotes 页卡片改为 原文→译文→解读→今日适用 四段式 + 主题标签；背诵页批改后亦展示译文。Zod `Quote` schema 两字段设为必填；attributions 页注明该部分为本站自撰、非引述今译著作 |
| 12 | 生僻字兜底 | **刻意不做**：全文拼音（PinyinSlot）已覆盖生僻字的发音需求；字义兜底需要外部字典数据源（常用字表+释义库），数据获取与维护成本高、边际价值低 |

- 验收 ✅：typecheck/lint/79 测试/产物自检/预算/段落回归全过；浏览器实测通过。

### 1.2 给「服务端专用数据」加硬约束 ✅

- `src/lib/kaoju.ts` 首行 `import "server-only"`（构建期按打包边界拦截）
- ESLint 本地规则 `local/no-client-kaoju`：只拦 `"use client"` 文件引用
  `@/lib/kaoju` 与 4 个考据 JSON（初版用 `no-restricted-imports` 会误伤
  合法的服务端引用，已改为按文件声明判断）
- 验收 ✅：故意在客户端组件 import `@/lib/kaoju` → lint 报错（exit 1）；
  服务端 import → 放行（exit 0）

---

## 2. P1

### 2.1 版权与 LICENSE ✅（授权情况仍需你确认）

- ✅ 新建 `/attributions` 引用与致谢页（原文/古代注疏公有领域说明、
  陈鼓应《庄子今注今译》与方勇《庄子纂要》逐条标注、开源软件清单、
  代码许可说明），已接入页脚与 sitemap
- ✅ 新增 `LICENSE`：MIT + **明确排除 `src/data/`**（现代学术著作内容
  不在开源许可范围）
- ✅ `/privacy` 著作权段落改为链接到致谢页
- **仍待你确认**：公开运营 or 仅自用？如公开运营，建议就现代学术著作
  引述征询权利人（页面已声明「学习研究之用、可联系调整移除」）

### 2.2 数据管线可复现 ✅

- ✅ `scripts/gen-metadata.mjs`（Node 版，取代 Python 版）补齐 `passageIds`
  输出，与提交版 `metadata.json` **逐字节一致**；CI 增加
  「重新生成 → `git diff --exit-code`」校验
- ✅ `scripts/data/` 的 9 个一次性 Python 脚本归档至 `archive/`
  （README 说明：硬编码绝对路径、含测试串，**禁止重跑**）；
  新增 `scripts/data/README.md` 区分「可复现产物 / 人工整理输入」
- ✅ 考据 JSON 无生成脚本的缺口：README 说明其为人工整理输入（核心资产）
- ✅ 删除旧 `scripts/generate_metadata.py`

### 2.3 共享 JS 基线 ✅（目标修正）

| 项 | 内容 |
| --- | --- |
| **结果** | 213.3 → **193.7 KB** gzip（概念/章节页 JS 从 203.7/213.3 → 192.8/202.0） |
| **目标修正** | **<150 KB 在 Next 16 + React 19 下不可达**：共享基线 90% 是框架本身（React ~108KB + Next 运行时 ~70KB + polyfill ~15KB gzip），组件只占 ~3KB。实测确认：去客户端化、browserslist（Turbopack 不读）、polyfill 均无法再压 |
| **实际收益** | ① `ConceptTag` 去 `"use client"`（无 hooks，纯 server）→ concepts 数据离开章节页 bundle ② `ChapterTOC` props 收窄 ③ fuse.js 移除（见 3.14）④ 各页 chunk 瘦身 |
| **新硬底** | 共享 JS 约 193KB；预算 `sharedJsGzipKB: 230` 保留回退空间 |

---

## 3. P2 — 全部完成 ✅

| # | 项 | 结果 |
| --- | --- | --- |
| 3.1 | **字体子集化** | `python scripts/subset-font.py`：Noto Serif SC 可变字体按全站 4570 用字子集为 `public/fonts/zhuangzi-serif.woff2`（1.56MB，OFL）。`@font-face` + `font-display: swap` + unicode-range；`_headers` 不可变缓存；SW 已按 woff2 走 Cache-First。源字体 25MB gitignore，产物提交 |
| 3.2 | **每页独立 OG 图** | `scripts/gen-og-images.mjs`（sharp）批量生成 33 篇 + 27 概念 1200×630 PNG（篇名+题解+篇序）；`lib/site.ts` 新增 `ogImageFor()`，章节页/概念页 metadata 接入。CI 需 `fonts-noto-cjk`（已加）。产物 gitignore |
| 3.3 | **ReadingSettings 接入** | 接在导航栏工具区（桌面+移动）。修复其 CSS 变量从未被消费的问题：值映射为 CSS 长度（`CSS_VALUE_MAP`）、globals.css 增加 `--reading-*` 消费规则（默认值与原样式一致）、加载时恢复。补 Escape 关闭与遮罩 `aria-hidden` |
| 3.4 | **死代码** | 删除 `ChapterNav`、`CrossReferencePanel`、`InkWashEffect`、`ShareCard`（零引用，约 20KB） |
| 3.5 | **剩余无障碍** | 搜索结果数 `role="status" aria-live`；批注「已保存」`aria-live`；导航下拉补 `role=menu`/`menuitem` + 方向键/Home/End（`handleMenuKeyDown`/`handleTriggerKeyDown`）；标题跳级修复（h4→h3，Footer 的 h4→p）；10-11px 小字 CSS 统一提到 12px（`[class~="text-[10px]"]` 覆盖）；⌘K 全站可用（KeyboardNav 补处理）；沉浸模式工具条常驻（退出入口不再藏 hover 里） |
| 3.6 | **`.stat-number` 渐变文字** | 默认纯色 + `@supports` 才叠加渐变（渐变失效时文字可见） |
| 3.7 | **CSP 去 `unsafe-inline`** | **保持现状**：RSC payload（`self.__next_f.push`）是每页不同的内联 `<script>`，静态 `_headers` 无法穷举 hash；JSON-LD 是 `ld+json`（不执行，不受 script-src 约束）。可行路径仍是 roadmap 三方案（Workers nonce / Next 配置外置 payload——需验证 Next 16 支持）。已做：`img-src` 移除 cdnjs（图标自托管） |
| 3.8 | **DO 限流** | **保持现状**：Cache API 限流同 colo 内共享，个人站点量级足够；严格配额需 Durable Object/KV 账户绑定（`wrangler.toml` 配置），属部署架构决策，未擅自加绑定 |
| 3.9 | **自托管 cdnjs 图标** | Leaflet 标记图标 3 个文件下载至 `public/vendor/leaflet/`；`ZhuangziMap.tsx` 改本地引用；CSP `img-src` 移除 cdnjs 域名；privacy/SW 注释同步 |
| 3.10 | **Zod 边界校验** | `scripts/data-schema.mjs` + `scripts/validate-data.mjs`：构建期 safeParse 全部 46 个数据文件（33 篇 + 概念/考据/语料），形状不合规即中断构建。zod 仅 devDependencies（**零客户端成本**）。已接入 `npm run verify` 与 `build`。校验立刻抓到 3 处真实形状偏差（fables/concordance/reading-routes 字段名与 Schema 不符） |
| 3.11 | **`error.tsx`** | 新增 `src/app/error.tsx`（框架级错误边界，不包裹 children）；`ErrorBoundary` 不再使用（其包裹整页会引入 client 祖先） |
| 3.12 | **tsconfig / ESLint 加严** | `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` 全量修复（37+8 处，含 tests）；`simple-import-sort` 全仓自动整理；`.editorconfig` + `.prettierrc` 就位。注：`no-floating-promises` 需 type-aware lint 基建，未加（收益/风险比低） |
| 3.13 | **`out/` 重复 `.txt`** | `scripts/clean-duplicate-payload.mjs`：部署前删除与 `index.txt` 逐字节相同的 `__next._full.txt`（84 个，省 4.5MB）；已实测 HTML 不引用该文件，客户端导航不受影响（`__next.chapters/.../__PAGE__.txt` 保留） |
| 3.14 | **检索质量** | **移除 fuse.js**（中文召回差 + 33KB gzip），`src/lib/search.ts` 重写：单字/双字直接包含；三字以上 **bigram 共现 AND** + 位置/原文域加权评分 + 完整串精确命中加分。核心匹配抽为纯函数 `matchItems`/`buildGrams`，新增 10 个检索测试（75 测试全过） |
| 3.15 | **散落数据文件** | 判定为**一次性导入产物**（数据已入库且测试校验）：`git rm --cached` + 删除 `_qiwu_data.json`、`_updates_02..07.json`、`updates_json/`（9 个文件） |

---

## 4. 刻意不做（勿当遗漏重开）

| 项 | 理由 |
| --- | --- |
| **不加 RSS/Atom** | 固定语料（33 篇先秦文本，不产出新内容），feed 无订阅价值；「每日一段」是客户端按日期种子算的，静态导出生成不了真正每日变化的 feed。若将来加「札记/更新日志」栏目，再为该栏目单独加 |
| **`og:locale` 保留 `zh_CN`** | 与 `inLanguage: "zh-Hans"` 遵循**不同规范**：OG 用 `语言_地区`（`zh-Hans` 不是合法 og:locale 值），HTML `lang` 与 schema.org 用 BCP-47 文字标签。为「统一」而改会写出无效值 |
| **不加 COEP `require-corp`** | 仍会拦掉高德瓦片（不带 CORP 头）。Leaflet 图标已自托管（3.9），障碍只剩瓦片 |
| **`hasPart`/`Quotation` 不放根布局** | 33+27+44 条长列表若放根布局会被塞进全部 85 个页面的 JSON-LD，白白增加每页体积。现各自放在 `/chapters`、`/concepts`、`/quotes` 枢纽页 |
| **CSP 仍保留 `script-src 'unsafe-inline'`** | RSC payload 内联脚本每页不同，静态 `_headers` 无法穷举 hash（见 3.7） |
| **限流仍用 Cache API** | 跨 colo 不共享是已知限制，个人站量级足够；DO/KV 需账户级绑定（见 3.8） |
| **未加 `no-floating-promises`** | 需要 type-aware lint 基建（typescript-eslint projectService），现有代码为事件处理器内 async 调用，误报风险高 |
| **CI 不重跑字体子集化** | woff2 产物已提交仓库（1.56MB）；子集脚本 `scripts/subset-font.py` 需 Python+fontTools+25MB 源字体，仅在数据用字变化时本地重跑 |

---

## 5. 需你拍板才能推进

| # | 事项 | 状态 |
| --- | --- | --- |
| 1 | **2.1 版权授权与 LICENSE** | ✅ 已拍板：**仅自用**（个人学习研究，不对外运营）。页面与 LICENSE 已就位（MIT 排除 `src/data/`）；致谢页与隐私页已明确「本站定位为个人学习研究用途」 |
| 2 | ~~**1.1 章节页重构**~~ | ✅ 已做并达标（259.8KB < 300KB） |
| 3 | ~~**3.3 `ReadingSettings` 放哪里**~~ | ✅ 已接导航栏工具区 |
| 4 | ~~**3.15 散落数据文件性质**~~ | ✅ 判定为产物，已 `git rm --cached` + 删除 |
| 5 | ~~**是否部署本次改动**~~ | ✅ 已审查并 git 提交（见提交历史）；部署到 Cloudflare Pages 仍由你手动执行（`npm run deploy` 或合并 main 触发 CI 自动部署） |
