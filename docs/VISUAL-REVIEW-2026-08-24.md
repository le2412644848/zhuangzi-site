# 庄子数位典藏 · 全站视觉/功能复审报告（2026-08-24）

> 本轮为**视觉实测复审**：headless Chrome（CDP）对本地 `out/` 构建产物逐页截图
> （桌面 1600×900、移动 390×844，含夜读/竖排/工具条/菜单等交互态，共 30+ 张，
> 存于审计方 `D:\DSH\shots\`），同时抓取每页网络请求与控制台错误，并与源码核对。
> 与 2026-08-21/22 两轮审计（`IMPROVEMENT-ROADMAP.md` / `TODO.md`）**不重复**，
> 以下均为新发现或新角度建议。已修项（夜读主题、404 页、书斋、名句标记等）实测表现良好，不再赘述。

图例：🔴 P0（应尽快修）· 🟠 P1（值得修）· 🔵 P2（打磨项）

---

## 🔴 N1. Next 16 静态导出 RSC 预取载荷 404（上游已知 bug，全站每页复现）

**现象**（每页必现，本地与生产同构，因生产部署同一 `out/` 且 Cloudflare Pages 不做路径重写）：

```
404 /chapters/__next.chapters.__PAGE__.txt
404 /search/__next.search.__PAGE__.txt
404 /chapters/01-xiaoyao-you/__next.chapters.$d$id.txt
404 /chapters/01-xiaoyao-you/__next.chapters.$d$id.__PAGE__.txt
...（每个视口内链接 2 条，首页约 4-8 条/页）
```

**根因**：构建产物把页载荷写成**目录式** `out/chapters/__next.chapters/__PAGE__.txt`，
而 Next 16.2.10 客户端运行时请求**点分式** `__next.chapters.__PAGE__.txt`。
这是上游 bug：[vercel/next.js#85374 "Next.js 16: Mismatch in RSC file paths
causes 404 errors in static exports"](https://github.com/vercel/next.js/issues/85374)
（另见 [blog.axiorema.com 的分析与 build-adapter 思路](https://blog.axiorema.com/engineering/uncurious-case-broken-static-exports-404s-nextjs-16/)）。

**实测影响**：

1. 预取（prefetch）永远失败 → 悬停/视口预取完全无效，点击导航时退化为
   `?_rsc=` 拉**整页 HTML**（章节页 333KB）而非更小的 txt 载荷——
   客户端导航「能用但比设计更重」，且每页控制台一片 404 噪音。
2. `out/` 里约 19MB 的 `.txt` 载荷树**基本是死重**：客户端按点分名请求不到，
   只有 `_tree/_head/_index/段级 .txt` 等少数文件真正被用上。部署 813 文件、
   CDN 冷启动都被它拖慢。
3. 导航本身经实测**仍是 SPA**（performance navigation 条目不新增），
   靠 `?_rsc=` HTML 回退成功——所以旧审计「客户端导航正常」的结论没错，
   但 prefetch 这一层一直是坏的，之前没人抓网络日志所以没看见。

**建议（按代价排序）**：

1. **升级 Next**：跟踪 #85374 的修复版本（issue 内 Vercel 给出的 workaround/fix 版本），
   升级后用本报告的抓包脚本复测，404 清零即修好。
2. **过渡期缓解 A**：给导航 `Link` 设 `prefetch={false}`（issue 推荐 workaround），
   消除 404 噪音与无效请求；点击导航仍走 `?_rsc=` 回退，体验不变。
3. **过渡期缓解 B（推荐同时做）**：构建后脚本把目录式载荷**复制/改名**为点分式
   （`__next.chapters/__PAGE__.txt` → `__next.chapters.__PAGE__.txt`，含 `$d$id` 层），
   让 prefetch 真正生效，拿回「点导航秒开」的收益。
4. 若接受 `?_rsc=` HTML 回退为常态，可反向操作：**删除全部 `.txt` 载荷树**
   （`__next._tree/_head/_index` 除外，需复测），`out/` 立省约 19MB、部署文件数大减。

验证工具：`D:\DSH\wshot.js`（本轮新写的通用截图+网络抓包器，可复用）。

---

## 🟠 N2. 「问庄子」进入即自动滚屏（`scrollIntoView` 挂在 mount 上）

`src/app/ask-zhuangzi/page.tsx` L44-46：`useEffect(..., [messages])` 在**初始消息**
时就执行 `bottomRef.scrollIntoView({behavior:"smooth"})`。
实测：打开页面即平滑下滚约 300px（标题与 API Key 卡被滚出视口、
sticky 导航悬在半页——本轮两张截图复现一致，非截图假象）。

**建议**：首次挂载不滚（用 `useRef` 记录「是否已有用户消息」），
仅在 `messages.length` 增加且最后一条非初始问候时再滚；
`behavior` 用 `"auto"` 或尊重 `prefers-reduced-motion`。

---

## 🟠 N3. 搜索页 `?q=` 只触发结果、不回显输入框

`src/app/search/page.tsx`：`initialQuery` 只喂给 `search()`，`SearchBar` 内部状态
独立初始化为空。实测 `/search/?q=逍遥`：结果正常但输入框显示占位符。
分享链接打开后用户**看不到当前词、无法直接改词**。

**建议**：把 `initialQuery` 作为 `SearchBar` 的 `defaultValue`/受控初值；
路由参数变化时同步（`useEffect` on `initialQuery`）。

顺带（代码卫生）：`highlightMatch` 用**全局正则** `regex.test(part)` 判断是否包裹
`<mark>`（L58）。当前因「非匹配片段会把 lastIndex 复位」而碰巧正确，
但属经典 lastIndex 陷阱；split 带捕获组时匹配项必在**奇数下标**，
直接 `i % 2 === 1` 更稳。

---

## 🟠 N4. 目录（ChapterTOC）编号重复：「1. 1. 北冥有鱼…」

截图实测：TOC 每条显示 `N. N. 标题`——组件自己加了序号，而短标签本身已带「N.」。
**建议**：渲染时去掉标签自带的前缀（`label.replace(/^\d+\.\s*/, "")`）或去掉组件序号。

---

## 🟠 N5. 移动端三处布局碰撞/拥挤（390px 实测）

1. **右下 FAB 叠压**：章节页「回顶」圆钮与聊天悬浮球重叠（m-ch01 截图），
   回顶钮几乎被遮。建议：回顶钮在 `ChatFab` 存在时上移（`bottom: calc(FAB高度 + 16px)`）
   或两者合并进一个悬浮列。
2. **品牌字换行**：header 里「莊子」被挤成两行竖叠。建议移动端缩短右侧控件或
   给品牌 `white-space: nowrap`。
3. **控件过密**：390px 一行塞 品牌+繁+竖排+5 主题色板+横排+汉堡，共 10 个可点元素，
   主题色板图标小到难按（<24px 命中区）。建议移动端把 5 个主题色板收进
   一个「主题」按钮的弹层（桌面也可考虑，见 V3）。

---

## 🟠 N6. 概念页两张关系图功能重叠，第二张视觉失控

`/concepts` 同时有「思想脉络」（气泡分布，有卡片容器）与「概念图谱」
（力导向图，**无容器**）：后者连线冲出区块、箭头悬空、标签与节点相撞
（「无待」「坐忘」处），且两图信息高度重复。

**建议**：二选一保留交互力导向图（加容器、约束布局边界、标签避让、
节点拖拽/悬停高亮邻接）；另一张降级为静态缩略示意或直接移除，页面可短 1/3。

---

## 🟠 N7. 段落工具条 8 个纯图标按钮无可视提示

toolbar-ch01 截图：☆ ✎ ⧉ 🔗 拼 👁 ▤ 🔊 一字排开，无文字、无可见 tooltip
（aria-label 已有，但 sighted 用户首次无法理解）。
**建议**：CSS-only tooltip（`::after` + `attr(aria-label)`，hover/focus-visible 显示），
成本约 20 行 CSS；同时对触屏长按显示。

---

## 🔵 V1. 首页/枢纽页宽屏首屏过空、整页过长

- 首页 1600×900 首屏只有居中标题+搜索框，上下大片空白；整页 5799px。
- `/chapters` 单列宽卡 5593px；章节页正文列 ~700px 居中，1600 屏**左半全空**。

**建议**：
1. 首屏加一个低饱和水墨/云气背景纹样或《逍遥游》意象插画（server 直出 SVG，零 JS），
   把统计卡上移进首屏，让 900px 视口「有画面」。
2. `/chapters` 桌面改 2 列紧凑卡（现在单列每卡只占 60% 宽度却整行独占）。
3. 章节页宽屏利用左侧空栏做**笺注栏**（仿刻本「眉批/夹注」版式：
   ≥1280px 时把「逐字注/训诂」移入左栏，正文更沉浸）——这是古籍站独有的差异化机会。

---

## 🔵 V2. 彩色 emoji 侵入水墨设计语言

`/dream`（🦋🌲）、`/compare` 话题 chip（🌗🏛️…）、`/ask-zhuangzi` chip、
`/cards` 按钮（🎲💾）使用系统彩色 emoji，与全站赭石/宣纸/衬线的克制语言冲突，
且跨平台渲染不一。
**建议**：换成一组单色 line-icon（inline SVG，`currentColor` 随主题），
6-8 个图标一次画完可全站复用。

---

## 🔵 V3. 导航右翼 9 控件一字排开，语义难辨

桌面 header 右翼：繁 / 竖排图标 / 5 个主题色板 / 横排按钮。色板是 5 个微型彩色图标，
不认识就不知道是主题切换。
**建议**：主题收进一个弹层（当前主题显示为一个小圆点），右翼收敛为
「繁 / 主题 / 版式（横竖排）/ 阅读设置」4 个带 tooltip 的按钮；与 N5-3 合并实施。

---

## 🔵 V4. 名句高亮（quote-mark）观感像「误选中」

章节页内嵌名句标记为灰米色块连片（ch01-s1 截图），首看像 selection。
**建议**：改为更「有意」的标记语言——如文字下方 2px 赭石渐隐下划线 + 句首小引号图标，
hover 才浮背景；与 WordTooltip 的虚线下划线做层级区分（名句=实线下划线，注词=虚线）。

---

## 🔵 V5. 地图页视觉出戏

默认蓝色 Leaflet 大头针 + 高德现代路网瓦片，与全站色调冲突。
**建议**：① 瓦片层加 CSS 滤镜 `sepia(0.35) saturate(0.6) contrast(0.95)` 一键做旧；
② 自定义 `L.divIcon` 用主题赭石圆点/印章样式替换蓝针；
③ 地图下方补一份**文字版地点清单**（无 JS/瓦片被墙时也有内容，利于 SEO 与无障碍）。

---

## 🔵 V6. 时间线配色与节奏

蓝（战国事件）/绿（人物）饱和度过高，跳出调色板；行距过大导致 24 条事件拉到 3069px。
**建议**：三色统一进主题变量（事件=靛灰、人物=竹绿降饱和、生平=赭石），
行距压缩 40%（交错布局本身已够呼吸）。

---

## 🔵 V7. 杂项打磨

1. `/heatmap` 的「显示前 N 个高频词」是原生 `<select>`，未样式化——换成与背诵页一致的分段按钮或自绘下拉。
2. `/cards` 预览卡固定近正方形，短句时下半全空——画布高度随内容自适应。
3. 章节页「第 N 节」分隔线与下一段原文之间偶发 ~150px 空档（ch01-s1），检查 margin 折叠。
4. SW 接管时的「安全重载」会让回访用户**偶发多刷一次**（本轮 nav-test2 捕到 `type:"reload"`）。
   可改为仅当在途请求/缓存清单版本不一致时才重载。
5. 竖排模式已生效（页高 13787→3420），但切换按钮文案「横排/竖排」指代「目标态」，
   与常见「描述当前态」习惯相反，建议加 aria-pressed 与 tooltip 说明。

---

## 架构层小结

- 51 个 `"use client"` 与共享 JS 196.8KB 基线维持旧审计结论，本轮无新证据需要改动。
- 唯一新架构项即 **N1**：它同时是性能项（prefetch 失效+19MB 死重）与工程项（上游 bug 跟踪）。
- 建议把 N1–N7 并入 `TODO.md` 新起一节「2026-08-24 视觉复审」，V1–V7 作为 P2 池。

## 附：本轮截图清单（`D:\DSH\shots\`）

home-desktop / chapters / ch01-s0..s3 / concepts / quotes-s0,s1 / fables / timeline /
map / concordance / heatmap / recite / ask(+reshoot) / compare / dream / translate /
bookmarks / cards / search / notfound / zhuangzi / m-home-split-a,b / m-ch01 / m-menu /
night-home / vert-ch01 / toolbar-ch01 / nav-test2。

---

## 实施状态（2026-08-24 当日，视觉闭环批次）

多模态闭环（设计→改→截图确认）已完成 **V1/V2/V4/V5/V6 五项**，`npm run verify`
全绿（typecheck/lint/Zod/79 测试）。改动文件：

| 项 | 改动 | 验证截图 |
| --- | --- | --- |
| V4 | `globals.css`：`.quote-mark` 底色块→金箔下划线（hover 浮底），`.quote-halo` 去底色改金线叠虚线 | `v4-after2.png` |
| V5 | `ZhuangziMap.tsx` 自绘 `divIcon` 印章圆点；`globals.css` 瓦片 sepia 做旧（夜读压暗）+ 弹层主题化 | `v5-after3.png` |
| V6 | `Timeline.tsx` 蓝绿→靛灰 `#6E7F92`/竹绿 `#7C8B6F`，`space-y-8→4` | `v6-after.png` |
| V2 | 新增 `.seal-char`/`.seal-char-lg`「印章字」系统；替换 dream/compare/ask/cards/bookmarks/AnnotationPanel/ThemeSwitcher（主题图标改 宣/竹/墨/青/夜）全部 emoji；`ai.ts` 提示去 ⚙️ | `v2-dream.png` `v2-compare.png` `v2-nav.png` |
| V1 | `page.tsx` hero：断笔禅圆 SVG + 巨字「遊」水印（~5% 不透明度、aria-hidden），hero 纵向 padding 收紧使统计卡入首屏 | `v1-light.png` `v1-night.png` |

### 交接给另一位 AI 的清单（非多模态可完成，**本批次未动**）

- **N1** RSC prefetch 404：升级 Next 或 `prefetch={false}` 或构建后改名点分式（详见上文 N1 节）。
- **N2** `ask-zhuangzi/page.tsx` L44-46 mount 即 `scrollIntoView` → 仅用户消息后滚。
- **N3** `search/page.tsx` `initialQuery` 回显 SearchBar；顺带 `highlightMatch` 用 `i%2===1` 替代全局正则 `test`。
- **N4** `ChapterTOC.tsx` 去重复编号前缀。
- **N5** 移动端 FAB/回顶叠压、品牌折行、控件过密（与 V3 一并：主题收弹层）。
- **N6/N7** 概念页双图取舍、工具条 CSS tooltip。
- **V3/V7** 导航右翼收敛；heatmap select 样式化；cards 画布自适应；SW 接管重载条件化；竖排按钮文案。

⚠️ 交接注意：V2 已把 emoji 清零（`src` 内仅余注释与 ★/✓/☰ 等单色字形），
接手 N5/V3 时导航右翼的 ThemeSwitcher 已是印章字形态，收弹层时保留 `role=radiogroup` 语义。

---

## 合并状态（2026-08-25）

两路改动已合入同一工作区并整体提交：

- **视觉批（多模态闭环）**：V1/V2/V4/V5/V6 如上文。
- **工程批（另一位 AI）**：N1 由 `scripts/fix-rsc-payload-paths.mjs` 解决
  （构建后把目录式载荷展平为点分式，已接入 `npm run build`；实测展平 144 文件、
  清 84 目录，4173 复测 prefetch **0 个 404**）；N2 自动滚屏、N3 搜索回显、
  N4 TOC 编号、N6 概念页双图收敛（KnowledgeGraph 组件删除）等一并落地。
- 合并后 `npm run verify` 全绿（79 测试），降载构建 89 路由通过，SW 版本已 bump。
- 预览：http://127.0.0.1:4173（静态服务按请求读盘，重建即生效；Ctrl+F5 一次接管新 SW）。
