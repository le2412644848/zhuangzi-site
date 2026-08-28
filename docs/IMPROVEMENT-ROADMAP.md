# 莊子數位典藏 —— 审计结论与提升路线图

对标主流内容/参考类网站（MDN、维基文库、Perseus Digital Library、
中国哲学书电子化计划 ctext.org 等）的一次全面审计。

> **要开工请直接看 [`TODO.md`](./TODO.md)** —— 那里是按优先级排好、
> 带验收标准的待办清单。本文档记录的是**审计证据与已修项说明**，
> 用于回答「为什么这么改」。

审计方式：读全部源码 + 对**构建产物** `out/` 做实测（84 个页面、
gzip 体积、HTML/RSC 载荷占比、WCAG 对比度计算、1049 条注释的可渲染性校验）。

图例：✅ 本轮已修复 · 🔶 建议下一步 · 🔷 中长期

---

## 一、已修复项（本轮）

### 1. SEO：22 个路由此前会被搜索引擎判重去索引 ✅ 最高影响

`src/app/layout.tsx` 在根布局声明了 `alternates.canonical = 首页`。
Next.js 的 metadata 向下继承，导致所有未在自身 `generateMetadata` 覆盖它的
路由都输出 `<link rel="canonical" href="首页">`。

实测受影响 22 个，包含全部枢纽页：
`/chapters`、`/concepts`、`/quotes`、`/fables`、`/timeline`、`/map`、
`/zhuangzi`、`/concordance`、`/heatmap`、`/reading-routes`、`/ask-zhuangzi` 等。

后果：这些页面主动声明「我是首页的副本」，正常会被剔出索引 ——
等于全站除章节页/概念页外的入口都拿不到自然流量。

修复：根布局不再声明 canonical；新增 `buildPageMetadata()`；
为 15 个 `"use client"` 路由补 `layout.tsx` 提供各自 metadata。

| 指标 | 修复前 | 修复后 |
| --- | --- | --- |
| canonical 指向首页 | 22 | **0** |
| 使用站点默认标题 | 15 | **0** |
| sitemap 带尾斜杠 | 0 / 81 | **75 / 75** |
| sitemap 收录 noindex 页 | 6 | **0** |
| 源码中硬编码 pages.dev | ~42 | **1**（`lib/site.ts` 的兜底默认值） |

结构化数据也一并补齐（对标参考类站点的常见实体）：

| 位置 | 新增实体 | 实测条目数 |
| --- | --- | --- |
| 根布局 | `WebSite` + `Organization` + `Book` + `Person(庄周)` | — |
| `/chapters` | `Book.hasPart` → 33 个 `Chapter` | 33 ✅ |
| `/concepts` | `DefinedTermSet.hasDefinedTerm` | 27 ✅ |
| `/quotes` | `CollectionPage` + `ItemList` + `Quotation`（`isBasedOn` 指回篇章） | 44 ✅ |
| 章节页 | `Chapter`+`Article`（`isPartOf` → Book）、`dateModified` | 每页 |
| 概念页 | `DefinedTerm`（`inDefinedTermSet` → 术语集） | 每页 |
| 各层级页 | `BreadcrumbList` | 全部嵌套页 |

`hasPart`/`hasDefinedTerm`/`Quotation` 刻意放在各自的枢纽页而非根布局 ——
否则这些长列表会被塞进全部 83 个页面的 JSON-LD，白白增加每页体积。

**两个刻意不做的决定（非遗漏）：**

* **不加 RSS/Atom。** 审计建议「主流内容站都有 feed」，但本站是**固定语料**
  （33 篇先秦文本，不产出新内容），feed 没有订阅价值。
  唯一有更新语义的是「每日一段」，而它的轮换是客户端按日期取种子计算的，
  静态导出无法生成真正每日变化的 feed。若将来加入「札记/更新日志」类
  持续产出的栏目，再为该栏目单独加 feed 更合理。
* **`og:locale` 保留 `zh_CN`，与 `inLanguage: "zh-Hans"` 并存不是矛盾。**
  两者遵循不同规范：Open Graph 用 `语言_地区` 形式（`zh_CN` 合法，
  `zh-Hans` 不是合法 og:locale 值），而 HTML `lang` 与 schema.org `inLanguage`
  用 BCP-47 文字标签（`zh-Hans` 才准确表达「简体」）。
  请勿为「统一」而把任一侧改成另一侧的格式。

### 2. 无障碍：核心注释功能对键盘/读屏用户完全不可用 ✅

`WordTooltip` 是全站阅读体验的核心（逐字注 + 历代注家浮层），
原实现是 `<span onMouseEnter onMouseLeave onClick>`：
无 `tabIndex`、无 `role`、无键盘事件、无 Escape、无 aria 关联。

修复：改为真正的 `<button>`，支持 focus 触发、Enter/Space、Escape 关闭并
归还焦点、`aria-expanded` + `aria-describedby` 关联浮层（WCAG 1.4.13 / 2.1.1 / 4.1.2）。

同时：全站 `role=` 出现 **0** 次、`aria-live` **0** 次 —— 本轮为主题切换器补了
`radiogroup` 语义，其余见「🔶 二·4」。

### 3. 无障碍：四个主题的辅助文字全部不达 WCAG AA，且既有修复被静默覆盖 ✅

`globals.css` 曾把 `--color-ink-muted` 从 `#A89880` 改深并注释说明
「对比度仅 2.67，加深至 4.71 达 WCAG AA」。
但 `ThemeProvider.tsx` 与 `layout.tsx` 内联脚本仍写 `#A89880`，
且以**行内样式**写入 `:root` —— 优先级高于样式表，修复被完全抵消。

实测（`--text-muted`，共 63 处使用）：

| 主题 | 修复前 | 修复后 |
| --- | --- | --- |
| 宣纸（默认） | 2.67:1 ❌ | 4.54:1 ✅ |
| 竹简 | 2.81:1 ❌ | 4.54:1 ✅ |
| 墨韵 | 2.61:1 ❌ | 4.54:1 ✅ |
| 青花 | 3.21:1 ❌ | 4.56:1 ✅ |

根因是调色板存在**三份手抄副本**。已收敛为 `src/lib/theme.ts` 单一数据源，
内联脚本由代码生成；`tests/theme-contrast.test.ts` 逐主题校验，防止再次改坏。

### 4. 长文阅读站没有任何深色模式 ✅

`globals.css` 有完整的 `.dark` 变量块、3 个组件写了 `dark:` 变体、
`ShareCard` 还在读 `classList.contains("dark")` —— 但**没有任何代码添加该类**，
`ThemeProvider` 反而每次 `classList.remove("dark")`。四个主题全是浅色。

修复：新增「夜读」深色主题（AA 达标：正文 14.4:1 / 次要 8.0:1 / 辅助 5.2:1），
接上 `.dark` 类与 `color-scheme`，并在用户未手动选择时跟随
`prefers-color-scheme` 自动切换。

### 5. 简繁切换会讹改古籍正文 ✅

映射表把「千」映射为「韆」。「韆」只用于「鞦韆」，于是
《逍遥游》「不知其几千里也」在繁体模式下变成「几**韆**里」。
同类错误：面→麵（面目→麵目）、只→隻、发→發、历→曆、后→後、于→於。

语料中出现频次：于 2076 · 后 625 · 面 500 · 只 488 · 发 353 · 千 176 · 历 62。
对一个以文本准确性立身的典藏站，这是内容错误而非样式瑕疵。

修复：映射表改由 `scripts/gen-trad-map.mjs` 生成，剔除 33 组「一简对多繁」
歧义字（保留 351 组无歧义映射）；切换改为保存原文、无损还原；
同步更新 `lang` 为 `zh-Hant`/`zh-Hans`。
`tests/script-conversion.test.ts` 对全部 33 篇做「简→繁→简」往返一致性校验。

### 6. 2.8% 的人工整理成果在页面上永不显示 ✅

`AnnotatedText` 用 `original.indexOf(term)` 定位注释词，找不到即**静默丢弃**。
实测 1049 条注释中有 29 条属此类 —— 它们是主题性词条
（庖丁解牛、庄周梦蝶、朝三暮四、游刃有余、浑沌之死、人籁地籁天籁…），
并非错误数据。

修复：分离内联型与主题型，后者回收到段落下方的**要义**区展示；
内联匹配同时改为「取最靠前的匹配」，避免长词优先导致前面的短词被跳过。

### 7. 安全：AI 代理是无鉴权开放中继，且限流实际无效 ✅

`functions/api/chat.js` 原状：

* 无同源校验 —— 任何人可 POST `/api/chat`，自带 key 即可把本站当免费代理，
  并借本站 IP 规避风控。
* 限流用模块作用域 `new Map()`。在 Workers 上每个 isolate 各有一份内存、
  随时回收、同一 IP 会落到不同 colo —— 基本不生效。
* `messages` 无长度/条数上限，`maxTokens`/`temperature` 由客户端任意指定 →
  成本放大。
* 上游错误原文直接回传客户端 → 信息泄露。
* 无模型白名单、无超时。

修复：同源校验（Origin/Referer）、基于 Cache API 的跨 isolate 限流、
输入上限（128KB/40 条/单条 8k 字/总 40k 字）、参数夹紧、模型白名单、
上游错误按状态码脱敏、`AbortController` 超时。

**补充加固（第二轮）✅**

* **消除未转义的 HTML 注入通道**：`PassageView.tsx` 与 `WordTooltip.tsx`
  各有一份 `renderHtml`，都是直接把注疏文本 `replace` 成 HTML 后注入
  `dangerouslySetInnerHTML`，**不做转义**。两份副本还导致「只修一处」的隐患。
  现统一到 `src/lib/markup.ts` 的 `renderEmphasis()`：先整体转义，
  再只把 `**粗体**` 还原为 `<strong>`，不产生任何其他标签。
  当前数据来自构建期本地 JSON（可信），此改动是为将来接入用户贡献 /
  AI 生成注释时不至于变成存储型 XSS。
* **合并 `_headers` 的两个 `/*` 区块**（此前是两段互不相干的 `/*`，
  一旦 Cloudflare 按「后者覆盖前者」解析，前一段的安全头会整体丢失）。
* **补齐缺失安全头**：`Cross-Origin-Opener-Policy: same-origin`、
  `Cross-Origin-Resource-Policy: same-origin`、`X-DNS-Prefetch-Control: off`；
  CSP 补 `worker-src`、`manifest-src`、`frame-src 'none'`、`media-src`、
  `upgrade-insecure-requests`。
  刻意**不加** `Cross-Origin-Embedder-Policy: require-corp` —— 它会拦掉
  高德瓦片与 cdnjs 图标（两者都不带 CORP 头），需先自托管这些资源。
* **`/sw.js` 明确不长缓存**（`max-age=0, must-revalidate`），
  否则新版本 SW 无法及时接管；`/api/*` 加 `no-store` + `X-Robots-Tag: noindex`。
* **新增隐私说明页** `/privacy`：如实披露 localStorage 存了什么
  （含明文 API Key 及其风险与吊销建议）、三处第三方请求
  （高德地图瓦片、cdnjs 图标、DeepSeek 接口）分别可能获得什么数据、
  当前未启用任何统计追踪，以及现代学术著作的著作权说明。已接入页脚与 sitemap。
* **`wrangler` 固定为 devDependency**（原 `npx wrangler` 未锁版本，
  每次部署都可能拉到不同版本，属供应链风险）。

**仍待处理 🔶**

* 限流仍是 Cache API 近似方案（同 colo 内共享，跨 colo 不共享）。
  严格配额需 Durable Object 或 KV，需额外绑定配置。
* `cdnjs` 的 Leaflet 标记图标应自托管（消除第三方 IP/Referer 泄露，
  并为将来开启 COEP 铺路）。
* 仓库根仍有被 git 跟踪的散落数据文件
  （`_qiwu_data.json`、`_updates_02..07.json`、`updates_json/`）。
  `.gitignore` 规则对已跟踪文件无效，需手动执行：
  `git rm --cached _qiwu_data.json _updates_0*.json updates_json/*.json`
  （已在 `.gitignore` 注释中写明命令；未代为执行以免改动版本库状态）。

> 仍存的结构性弱点：用户密钥途经本站。根治需改架构，见「🔷 三·1」。

### 8. Service Worker 三处实质缺陷 ✅

* **离线回退永远命中不了**：预缓存 `/404.html`，回退却 `caches.match("/404/")`。
* **缓存投毒**：三种策略都未检查 `response.ok` 即 `cache.put`，
  4xx/5xx 与跨域 opaque 响应会被缓存，且后续一直命中。
* **无上限增长**：章节页 HTML 单页最大 1MB（齐物论），33 篇 + 1.5MB 级 JSON
  全量缓存，极易触发存储配额导致整个 Cache Storage 被清空。

修复：回退按序尝试两种键并内置离线兜底页；`isCacheable()` 校验
同源 + `response.ok` + 非 206/opaque；三类缓存各设条目上限并 FIFO 裁剪；
开启 navigation preload；`controllerchange` 时安全重载一次
（避免新 SW 接管后旧页面去取已被清掉的 hashed chunk 而白屏）。

### 9. PWA 图标是近乎空白的占位图 ✅

`icon-192.png` 仅 593 B、`icon-512.png` 仅 2.2 KB。
已重新生成（5.1 KB / 16.6 KB / 13.7 KB maskable）并补矢量 `icon.svg`。
manifest 补齐 `id`/`scope`/`lang`/`dir`/`display_override`/`categories`/
`shortcuts`/maskable，并修正 `theme_color`、`background_color` 与实际主题不一致。

### 10. 工程基建：此前无测试、无 CI、无 typecheck ✅

数据即产品（约 6MB 手工整理 JSON），而全部 JSON 都经
`as Chapter` / `as KaojuMap` 这类**未经校验的类型断言**进入应用 ——
数据形状变化不会有编译错误，只会静默少内容。

新增：

* `tests/data-integrity.test.ts` —— 33 篇结构、order 唯一、passage id 全局唯一
  且前缀合规、原文/译文非空、U+FFFD 编码损坏、占位文本、概念引用完整性、
  `metadata.json` 与正文同步（含 `passageIds`）、考据键位可映射到真实篇目/段落。
* `tests/theme-contrast.test.ts` —— 五主题 WCAG 对比度 + 变量完整性 + 内联脚本一致性。
* `tests/script-conversion.test.ts` —— 简繁映射安全性 + 全语料往返一致性。
* `scripts/check-output.mjs` —— 产物级校验：canonical/title/sitemap/
  未来日期/manifest 图标/SW 版本号是否真的被 bump。
* `scripts/check-budget.mjs` —— 首屏体积预算，超出即失败。
* `.github/workflows/ci.yml` —— typecheck → lint → test → build → 预算 →
  产物自检 → Lighthouse → 部署。
* `npm run typecheck` / `test` / `verify` / `budget` 脚本。

合计 **65 个测试全部通过**。

> 副产品：`check-output.mjs` 立刻抓到一个真实故障模式 ——
> 若 `next build` 成功但 `bump-sw-version.mjs` 未执行，
> 产物里的 SW 缓存版本号仍是 `v1`，部署后旧缓存永不失效，而**构建不会报错**。

---

## 二、建议下一步 🔶

### 1. 章节页首屏减重 —— 性能上最大的一块

实测（gzip）：

| 路由 | HTML | JS | 合计 |
| --- | --- | --- | --- |
| `/chapters/02-qiwu-lun` | 247 KB | 213 KB | **471 KB** |
| `/chapters/33-tianxia` | 150 KB | 213 KB | 374 KB |
| `/`（首页） | 20 KB | 213 KB | 244 KB |

`02-qiwu-lun` 未压缩 HTML 达 **1.03 MB**，其中 **43.5%（33.7 万字符）**
是 `self.__next_f.push(...)` 的 RSC hydration 载荷 ——
正文、译文、逐字注、考据被**序列化了两遍**（一遍渲染成 HTML，一遍供客户端 hydrate）。

根因：`PassageView` 是 `"use client"`，却接收整篇 `kaoju` 数组
加 `passage`、`passageKaoju`、`passageKaojuFang` 作为 props，
因为 `findKaoju()` 的查找在客户端进行。

建议做法：

1. **把考据查找移到构建期**。服务端已经有全部数据，直接算出每个注释词
   对应的条目，只把命中的结果传下去，而不是整篇 `kaoju` 数组。
2. **拆分 `PassageView`**：正文/译文/注疏/考据折叠区本质是静态内容，
   可作为 server component 直出；只把工具条、拼音开关、批注面板、
   收藏按钮这些真正需要状态的部分留作小型客户端岛。
   `<details>` 元素本身就能做折叠，不需要 JS。
3. 预期收益：章节页 HTML 可去掉约 40% 的重复载荷，
   并显著降低 hydration 的主线程开销。

另：`d3`（292 KB）、`leaflet`（151 KB）、`fuse.js`、`pinyin-pro`
**已正确做了懒加载**，不在首屏 —— 这部分现状是好的。

### 2. 共享 JS 基线 193 KB（gzip）偏高

全站 51 个 `"use client"` 文件、`src/components/` 下 **35 个组件无一是 server component**。
对一个以静态长文为主的站点，导航、页脚、TOC、概念标签、相关阅读等
大多是展示型组件，可去客户端化。建议按「交互岛」思路重划边界。

### 3. 给「服务端专用」加硬约束

`src/lib/kaoju.ts` 静态 import 约 5MB JSON，"仅供服务端" **只靠一行注释**。
51 个客户端文件里任何一个误引，5MB 就进浏览器 bundle，且无任何编译/lint 报错。

```ts
// src/lib/kaoju.ts 首行
import "server-only";
```

并在 ESLint 加 `no-restricted-imports` 禁止 `src/**` 引用
`@/lib/kaoju` 与四个考据 JSON。这是投入产出比最高的一条防线。

### 4. 剩余无障碍缺口

**本轮已补（第二批）✅**

* **「问庄子」浮窗补齐对话框语义**：`role="dialog"` + `aria-labelledby`、
  Escape 关闭（先关设置面板再关浮窗）、Tab 在浮窗内循环、
  打开聚焦输入框 / 关闭归还焦点给触发按钮（WCAG 2.4.3）。
* **流式回复接入 live region**：对话区 `role="log" aria-live="polite"`，
  加载与「已保存」状态另置 `role="status"`。此前整段 AI 回答对读屏用户完全静默
  （WCAG 4.1.3）。
* **图标按钮全部具名**：聊天球、关闭、设置此前只有 `title`
  （不是可靠的可访问名称来源），现补 `aria-label` + `aria-expanded`，
  装饰性 SVG 加 `aria-hidden="true" focusable="false"`。
* **注释浮层不再被裁切**：宽度改 `min(18rem, 100vw - 1rem)`，
  并把居中点夹紧到「半宽 + 8px」区间 —— 此前 375px 屏幕上靠边的注释词
  会把 288px 浮层推出视口。
* **iOS 输入框自动放大**：全站输入控件在 ≤640px 统一 16px。
  此前搜索框/问庄子/批注框都是 12–14px，聚焦即强制放大且不自动还原。
* **刘海屏安全区**：聊天球改用 `env(safe-area-inset-*)`，
  竖排阅读区 `80vh → 80dvh`（避免地址栏收展时高度抖动）。
* **跳转链接真正生效**：`#main-content` 补 `tabIndex={-1}`，
  否则焦点送不进主内容区，"跳到主要内容" 形同虚设。
* **键盘快捷键三处修正**：
  ① 竖排模式下不再抢占方向键 —— `.vertical-content` 靠横向滚动阅读，
  原实现按方向键会直接翻篇；
  ② 要求「无任何修饰键」才响应，并跳过 `contentEditable` / `<select>`，
  减少与读屏软件单字母快速导航、输入法快捷键的冲突；
  ③ 翻篇改用 `router.push` 而非 `window.location.href`，不再整页刷新。

**仍待处理 🔶**

* 搜索结果数量、「已复制/已保存」等提示仍无 `aria-live`
  （聊天已补，其余页面未覆盖）。
* 8 处 `onClick` 挂在 `<div>`/`<span>` 上，缺 `role` 与键盘处理。
* 导航下拉写了 `aria-haspopup="menu"` 但没有 `role="menu"` 与方向键支持；
  移动端菜单无焦点陷阱。
* 标题层级跳级（`<h4>` 用了 7 次，部分直接跟在 `<h2>` 之后）。
* 44 处 `text-[10px]` / `text-[11px]` 元信息，古籍长阅读建议下限提到 12px。
* `⌘K` 在非搜索页无效，但首页明确提示了该快捷键。
* 沉浸模式的退出入口藏在 hover 才出现的工具条里，触屏与键盘用户难以发现。
* `ReadingSettings.tsx`（字号/行距控制）**已实现但从未被引用** ——
  接进阅读设置入口即可，是现成的可访问性收益。
  同样未被引用的还有 `ChapterNav`、`CrossReferencePanel`、`InkWashEffect`、
  `ShareCard`（合计约 20 KB 死代码，要么接上要么删除）。
  注：审计报告提到 `CrossReferencePanel`/`ShareCard` 的模态框缺少 dialog 语义，
  但这两个组件目前是死代码，接入时需一并补上焦点管理。
* `.stat-number` 用 `-webkit-text-fill-color: transparent` 做渐变文字，
  渐变失效时文字不可见，且对比度不可控。

### 5. 字体：古籍生僻字的渲染一致性

当前刻意不加载 web font（`next/font` 会在构建期联网，CI 会失败），
字体栈为 `"Noto Serif SC", "Source Han Serif SC", "Songti SC", "SimSun", serif`。
多数 Windows 用户不装前两者 → 回退到宋体；Android 回退到系统默认。
《庄子》含大量生僻字（鲲、鹏、罔两、瞿鹊子、藐姑射…），
跨平台字形与字重差异明显。

建议：自托管**子集化**的思源宋体（按全站实际用字生成子集，
含考据引文用字），`font-display: swap`，并把字体文件纳入
`_headers` 的不可变缓存与 SW 预缓存。这是主流古籍站的标准做法。

### 6. 每页独立 OG 图

33 篇 + 27 概念共用一张 `og-image.png`。静态导出没有运行时，
但可在构建期用脚本从 SVG 模板批量生成（篇名 + 题解 + 篇序），
社交分享点击率提升明显。

### 7. 产物体积：`out/` 41 MB，其中 19 MB 是 `.txt`

Next.js 16 静态导出为客户端路由生成 RSC 载荷 `.txt`。
实测 `index.txt` 与 `__next._full.txt` **逐字节相同**，各 6.34 MB，
即约 6.3 MB 纯重复。虽不影响首屏，但拖慢部署与 CDN 冷启动。
可在 `deploy` 前加一步清理重复文件（需验证客户端导航不受影响）。

### 8. 内容与合规

* **`src/data/` 大量引述陈鼓应《庄子今注今译》、方勇《庄子纂要》等
  现代学术著作**，受著作权保护。公开运营前需确认授权，
  并建立「引用与致谢」页逐条标注来源。
* 仓库**无 LICENSE**。建议代码用 MIT/Apache-2.0，并明确排除 `src/data/`。
* 无隐私说明。地图瓦片走高德（第三方，会拿到用户 IP），
  localStorage 保存阅读记录/收藏/批注/API Key，建议补一页隐私说明。

---

## 三、中长期 🔷

### 1. 重构 AI 架构

BYOK（用户密钥经本站转发）的结构性问题：密钥途经第三方、
无法做站点级配额、`script-src 'unsafe-inline'` 下一旦出现 XSS 即可窃取
localStorage 里的明文密钥。

三个可选方向：

| 方案 | 优点 | 代价 |
| --- | --- | --- |
| 服务端自持密钥 + 站点配额 | 用户零配置，体验最好 | 需承担成本、要做滥用防护 |
| 浏览器直连 DeepSeek（不经代理） | 密钥不经第三方 | 暴露于 CSP `connect-src`，无法限流 |
| 边缘鉴权 + 短期令牌 | 兼顾安全与配额 | 实现复杂度最高 |

### 2. CSP 收紧

现为 `script-src 'self' 'unsafe-inline'`。第二轮已补齐其余指令
（`worker-src`/`manifest-src`/`frame-src`/`upgrade-insecure-requests`）
并合并了重复的 `/*` 区块，但 `'unsafe-inline'` **仍无法移除**，原因是：

* 防闪烁主题脚本必须**同步内联**执行，否则首帧会闪出默认配色；
* 各页 JSON-LD 必须内联（`application/ld+json` 不支持外链 `src`），
  而其内容**每页不同** → hash 无法穷举；
* `_headers` 是静态文件，Cloudflare Pages 无法按请求下发 nonce。

可行的收紧路径（按代价排序）：

1. 把主题脚本改为**外部文件** + 其 sha256 hash 入 CSP，
   JSON-LD 则改由构建期为每个页面目录生成独立 `_headers` 规则
   （Cloudflare `_headers` 支持按路径匹配，可为每个路由写各自的 hash）。
2. 或改用 Cloudflare Workers（而非纯静态 Pages）下发 per-request nonce。
3. 现阶段的缓解措施：全站进入 `dangerouslySetInnerHTML` 的内容
   统一走 `src/lib/markup.ts` 的 `renderEmphasis()`（先转义再还原粗体），
   已消除唯一的未转义注入通道。

另可考虑 `style-src` 去掉 `'unsafe-inline'`（Next.js 的 hydration 内联样式
是主要障碍，需实测），以及加 CSP report 端点收集违规。

### 3. 检索质量

`fuse.js` + `threshold: 0.4` 对中文（尤其单字与文言虚词）召回与排序都不理想，
现有单字 `includes` 兜底是权宜之计。
建议改为构建期生成倒排索引（按字/双字切分），或引入
`minisearch`/`orama` 并做中文分词；同时把索引拆成按篇加载的分片，
避免首次搜索一次性拉全量数据。

### 4. 数据管线可复现性

`scripts/data/` 下 9 个近乎重复的一次性 Python 脚本，
硬编码绝对路径 `C:/Users/Administrator/...`，无法在其他机器或 CI 运行。
`generate_metadata.py` **不输出 `passageIds`**，而 `passageNumber()` 依赖它 ——
按现有脚本重跑会破坏「第 N 节」显示（现已被测试拦住）。
考据 JSON（35k+ 行）在仓库里**完全没有生成脚本**。

建议：收敛为一个可复现管线 + `scripts/data/README.md` 说明来源，
并在 CI 加「重新生成 metadata → 与提交版本 diff → 不一致则失败」。

### 5. 其他工程收敛

* `tsconfig` 已开 `strict`，建议追加 `noUncheckedIndexedAccess`、
  `exactOptionalPropertyTypes`（代码里大量索引访问，如
  `chaptersMeta[index - 1]`、`kaojuData[key]`）。
* ESLint 加 `jsx-a11y`（本站自定义交互多，收益直接）、
  `@typescript-eslint/no-floating-promises`、import 排序。
* 无 Prettier / editorconfig，51 个组件风格已在漂移。
* 无 `error.tsx` / `global-error.tsx`：数据形状类错误发生在**服务端渲染**，
  而唯一的 `ErrorBoundary` 只能捕获客户端错误。
* 仓库根有已被 git 跟踪的散落数据文件（`_qiwu_data.json`、
  `_updates_02..07.json`、`updates_json/`）；`.gitignore` 的
  `_updates_*.json` 规则对已跟踪文件无效，需 `git rm --cached`。

---

## 四、一句话结论

**内容质量远高于工程外壳。** 33 篇正文、1049 条逐字注、约 5MB 考据训诂
是扎实的长期投入；而外壳停留在 `create-next-app` 默认状态 ——
无测试、无 CI、边界靠注释、canonical 配置反而让 22 个页面自我除名。

本轮修复了收录、无障碍、文本正确性、安全与 PWA 五类实质缺陷，
并补上测试与 CI 防线（65 个测试 + 2 个产物级守卫）。
下一步性价比最高的是**章节页减重**（首屏 471 KB → 目标 300 KB 以内）
与**给服务端专用数据加硬约束**。
