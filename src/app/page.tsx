import type { Metadata } from "next";
import Link from "next/link";

import DailyPassage, { type DailySnippet } from "@/components/DailyPassage";
import ReadingHistoryWidget from "@/components/ReadingHistory";
import SearchBar from "@/components/SearchBar";
import { chapters } from "@/data/chapters";
import { chaptersMeta } from "@/data/chapters/metadata";
import { concepts } from "@/data/concepts";
import { STARTER_CHAPTER_IDS } from "@/lib/chapters";
import { canonicalUrl } from "@/lib/site";

// 首页自指 canonical。标题/描述/OG 继承根布局即可，
// 但 canonical 必须每页各自声明（根布局若声明会被所有子路由继承，
// 导致 22 个页面自称首页副本 —— 见 src/app/layout.tsx 注释）。
export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/") },
};

const categories = [
  {
    key: "内篇",
    seal: "内",
    description: "庄子亲著，七篇核心",
    gradient: "bg-gradient-to-br from-[var(--color-accent)]/12 via-transparent to-transparent",
  },
  {
    key: "外篇",
    seal: "外",
    description: "庄子后学，演绎发挥",
    gradient: "bg-gradient-to-br from-[var(--color-accent-bamboo)]/12 via-transparent to-transparent",
  },
  {
    key: "杂篇",
    seal: "杂",
    description: "杂纂汇编，博采众长",
    gradient: "bg-gradient-to-br from-stone-600/12 via-transparent to-transparent",
  },
];

// Featured chapters for the highlight section
const featuredSlugs = ["01-xiaoyao-you", "02-qiwu-lun", "06-dazong-shi"];

export default function Home() {
  const totalPassages = chaptersMeta.reduce((a, c) => a + c.passageCount, 0);
  const totalConcepts = concepts.length;
  const featuredChapters = chaptersMeta.filter((ch) => featuredSlugs.includes(ch.id));
  const dailyPool: DailySnippet[] = chapters.map((ch, idx) => {
    const pIdx = idx % ch.passages.length;
    const p = ch.passages[pIdx]!;
    return {
      chapterId: ch.id,
      chapterTitle: ch.title,
      passageNum: pIdx + 1,
      original: p.original.length > 120 ? `${p.original.slice(0, 120)}…` : p.original,
      translation: p.translation.length > 140 ? `${p.translation.slice(0, 140)}…` : p.translation,
    };
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* ============================================
          Hero Section — Ink Wash Gradient
          ============================================ */}
      <section className="hero-gradient relative overflow-hidden px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        {/* Decorative background elements（移除高开销高斯模糊层 blur-3xl，改由 .hero-gradient 径向渐变承担） */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* 水墨视觉锚（2026-08-24 视觉复审）：
              巨字「遊」水印 + 断笔禅圆（ensō），约 5% 不透明度，
              宽屏为首屏提供画面感与典籍气，不参与阅读、不进无障碍树 */}
          <svg
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] text-[var(--text-accent)] opacity-[0.06] hero-breathe"
            viewBox="0 0 100 100"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeDasharray="252 37"
              transform="rotate(-60 50 50)"
            />
          </svg>
          <span
            className="hidden lg:block absolute -right-8 bottom-0 font-serif text-[20rem] leading-[0.9] text-[var(--text-accent)] opacity-[0.045] select-none hero-breathe"
            aria-hidden="true"
          >
            遊
          </span>
        </div>

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          {/* Kicker */}
          <p className="text-xs font-medium tracking-[0.2em] text-[var(--text-muted)] uppercase mb-6">
            戰國 · 宋國蒙人
          </p>

          {/* Main title */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-[0.04em] text-[var(--text-accent)] mb-6 leading-[1.08]">
            莊子
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto mb-4">
            以无待之心，游无穷之境
          </p>
          <p className="text-sm text-[var(--text-muted)] max-w-lg mx-auto mb-10">
            乘天地之正，而御六气之辩，以游无穷者
          </p>

          {/* Search bar */}
          <div className="flex justify-center mb-6">
            <SearchBar compact />
          </div>

          {/* Shortcut hint */}
          <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)]">
            <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border border-[var(--border-color)] bg-[var(--bg-card)]">
              ⌘K
            </kbd>
            <span>快捷搜索全文</span>
          </p>
        </div>
      </section>

      {/* ============================================
          Stats Row
          ============================================ */}
      <section className="px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 mb-12 sm:mb-14">
        <div className="max-w-lg mx-auto">
          <div className="card p-6 sm:p-8 flex items-center justify-around">
            {[
              { num: "33", label: "篇章", sub: "内·外·杂" },
              { num: String(totalPassages), label: "段落", sub: "逐字注解" },
              { num: `${totalConcepts}+`, label: "核心概念", sub: "知识图谱" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <span className="stat-number text-2xl sm:text-3xl">{stat.num}</span>
                <span className="text-sm font-medium text-[var(--text-primary)] tracking-wide">
                  {stat.label}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {stat.sub}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          Daily Passage
          ============================================ */}
      <DailyPassage pool={dailyPool} />

      {/* ============================================
          Featured Chapters — Highlights
          ============================================ */}
      <section className="cv-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="section-heading mb-3">名篇精粹</h2>
          <p className="section-subheading">逍遥物外 · 齐一万物 · 大宗师法</p>
          <div className="ink-divider" />
        </div>

        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {featuredChapters.map((ch) => (
            <Link
              key={ch.id}
              href={`/chapters/${ch.id}`}
              prefetch={false}
              className="card-interactive group p-5 flex flex-col items-center text-center gap-3"
            >
              <span className="chapter-badge">
                {ch.order.toString().padStart(2, "0")}
              </span>
              <h3 className="text-base font-semibold text-[var(--text-accent)] tracking-wide">
                {ch.title}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                {ch.summary}
              </p>
              <span className="text-[11px] text-[var(--text-muted)] mt-auto pt-1 group-hover:text-[var(--text-accent)] transition-colors">
                {ch.passageCount} 节 →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================
          All Chapters — Category Tabs
          ============================================ */}
      <section className="cv-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="section-heading mb-3">篇章总览</h2>
          <p className="section-subheading">三十三篇，千古文章</p>
          <div className="ink-divider" />
        </div>

        <div className="max-w-4xl mx-auto space-y-14">
          {categories.map((cat) => {
            const catChapters = chaptersMeta.filter((c) => c.category === cat.key);
            return (
              <div key={cat.key}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="seal-char-lg" aria-hidden="true">
                    {cat.seal}
                  </span>
                  <h3 className="text-lg font-semibold text-[var(--text-accent)] tracking-[0.06em]">
                    {cat.key}
                  </h3>
                  <span className="h-px flex-1 bg-[var(--border-light)]" />
                  <span className="text-xs text-[var(--text-muted)]">
                    {cat.description}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catChapters.map((ch) => (
                    <Link
                      key={ch.id}
                      href={`/chapters/${ch.id}`}
                      prefetch={false}
                      className="card-interactive group relative p-4 overflow-hidden"
                    >
                      <div
                        className={`absolute inset-0 pointer-events-none ${cat.gradient}`}
                        aria-hidden="true"
                      />
                      <div className="relative z-10 flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                          <span className="chapter-badge">
                            {ch.order.toString().padStart(2, "0")}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {STARTER_CHAPTER_IDS.has(ch.id) && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--color-accent-gold)]/15 text-[var(--text-accent)] border border-[var(--color-accent-gold)]/35">
                                ★ 入门首选
                              </span>
                            )}
                            <span className="tag">
                              {cat.key}
                            </span>
                          </div>
                        </div>
                        <h3 className="text-sm font-semibold text-[var(--text-accent)] tracking-wide group-hover:text-[var(--color-accent-deep)] transition-colors">
                          {ch.title}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                          {ch.summary}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mt-auto">
                          <span>{ch.passageCount} 段落</span>
                          <span className="opacity-30">·</span>
                          <span className="group-hover:text-[var(--text-accent)] transition-colors">
                            阅读 →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================
          Quick Links — Navigation Hub
          ============================================ */}
      <section className="cv-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/concepts", label: "核心概念", desc: "25+ 哲学概念" },
              { href: "/quotes", label: "名句精选", desc: "十类主题" },
              { href: "/fables", label: "寓言故事", desc: "庄子寓言集" },
              { href: "/reading-routes", label: "主题路线", desc: "引导式阅读" },
              { href: "/timeline", label: "时间线", desc: "生平与时代" },
              { href: "/map", label: "地理图", desc: "庄子足迹" },
              { href: "/concordance", label: "词语索引", desc: "全文检索" },
              { href: "/heatmap", label: "词频热图", desc: "数据可视化" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="card-interactive group p-4 flex flex-col items-center text-center gap-1.5"
              >
                <span className="text-sm font-medium text-[var(--text-primary)] tracking-wide group-hover:text-[var(--text-accent)] transition-colors">
                  {item.label}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {item.desc}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          Interactive Features — AI 与沉浸体验
          ============================================ */}
      <section className="cv-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="section-heading mb-3">深度互动</h2>
          <p className="section-subheading">与庄子对话 · 同诸子辩论 · 为你指路</p>
          <div className="ink-divider" />
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              href: "/ask-zhuangzi",
              label: "问庄子",
              desc: "与庄子 AI 对话，千年智慧为你答疑",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              ),
            },
            {
              href: "/compare",
              label: "诸子对谈",
              desc: "庄子与孔子、老子隔空辩难，观点交锋",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              ),
            },
            {
              href: "/translate-challenge",
              label: "翻译挑战",
              desc: "试译古文，与名家译文一较高下",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487 18.549 6.174m0 0L20.236 7.86m-1.687-1.687L14.5 10.5l-2-2m-4.35 6.85-1.325 1.325a1.5 1.5 0 0 1-2.122-2.12l1.326-1.327m4.35 4.351-4.35-4.35m0 0L3 15m9.067 4.936a49.151 49.151 0 0 1 4.408-3.653m2.325-1.796a48.62 48.62 0 0 1 3.8-2.342M6 12h.01M4.5 7.5h.01M12 3h.01M19.5 7.5h.01M19.5 12h.01M12 21h.01M4.5 16.5h.01" />
              ),
            },
            {
              href: "/recite",
              label: "名句背诵",
              desc: "挖空填字，把名句刻进记忆",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
              ),
            },
            {
              href: "/dream",
              label: "庄周梦蝶",
              desc: "沉浸式交互，体验物我两忘之境",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              ),
            },
            {
              href: "/reading-path",
              label: "定制阅读路径",
              desc: "回答五个问题，AI 为你规划读法",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0v-6m0 0 2.25-2.25M12 15l-2.25-2.25M12 3v2.25m6.364.614-1.591 1.591M5.636 5.864l1.591 1.591" />
              ),
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="card-interactive group p-5 flex items-start gap-4"
            >
              <span className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-[var(--hover-bg)] text-[var(--text-accent)] group-hover:bg-[var(--hover-bg-strong)] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  {item.icon}
                </svg>
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-[var(--text-primary)] tracking-wide group-hover:text-[var(--text-accent)] transition-colors">
                  {item.label}
                </span>
                <span className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {item.desc}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================
          About Zhuangzi
          ============================================ */}
      <section className="cv-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="section-heading mb-3">关于庄子</h2>
            <div className="ink-divider" />
          </div>

          <div className="card p-6 sm:p-8 space-y-4 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            <p>
              庄子（约公元前369—前286年），名周，战国时期宋国蒙人。
              他是道家思想的集大成者，继承老子学说而加以发扬光大。
            </p>
            <p>
              庄子以汪洋恣肆的寓言、天马行空的想象、冷峻犀利的批判，
              构建了一个追求精神绝对自由的哲学世界。
              他的思想影响了中国两千年的文学、艺术与人生哲学。
            </p>
            <p>
              今本《庄子》共三十三篇，分内篇、外篇、杂篇三部分。
              内篇七篇公认为庄子亲著，外篇与杂篇多为庄子后学所作。
            </p>
            <div className="pt-3">
              <Link
                href="/zhuangzi"
                prefetch={false}
                className="inline-flex items-center gap-1.5 text-sm text-[var(--text-accent)] hover:text-[var(--color-accent-deep)] transition-colors font-medium"
              >
                了解更多关于庄子
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Reading History */}
      <ReadingHistoryWidget />

      {/* Bottom spacing */}
      <div className="h-16" />
    </div>
  );
}
