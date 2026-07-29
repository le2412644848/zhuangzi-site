import Link from "next/link";
import { chaptersMeta } from "@/data/chapters";
import SearchBar from "@/components/SearchBar";
import DailyPassage from "@/components/DailyPassage";
import ReadingHistoryWidget from "@/components/ReadingHistory";

const categories = [
  { key: "内篇", description: "庄子亲著，七篇核心", color: "from-amber-700/5 to-amber-600/5" },
  { key: "外篇", description: "庄子后学，演绎发挥", color: "from-stone-600/5 to-stone-500/5" },
  { key: "杂篇", description: "杂纂汇编，博采众长", color: "from-teal-700/5 to-teal-600/5" },
];

// Featured chapters for the highlight section
const featuredSlugs = ["01-xiaoyao-you", "02-qiwu-lun", "06-dazong-shi"];

export default function Home() {
  const totalPassages = chaptersMeta.reduce((a, c) => a + c.passageCount, 0);
  const totalConcepts = 25;
  const featuredChapters = chaptersMeta.filter((ch) => featuredSlugs.includes(ch.id));

  return (
    <div className="max-w-6xl mx-auto">
      {/* ============================================
          Hero Section — Ink Wash Gradient
          ============================================ */}
      <section className="hero-gradient relative overflow-hidden px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-[10%] w-64 h-64 rounded-full bg-[var(--text-accent)]/3 blur-3xl" />
          <div className="absolute bottom-1/4 right-[10%] w-48 h-48 rounded-full bg-[var(--color-accent-gold)]/4 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] rounded-full bg-gradient-to-b from-transparent via-[var(--text-accent)]/[0.015] to-transparent" />
        </div>

        <div className="relative z-10 stagger-children text-center max-w-3xl mx-auto">
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
      <section className="px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="max-w-lg mx-auto">
          <div className="card p-6 sm:p-8 flex items-center justify-around">
            {[
              { num: "33", label: "篇章", sub: "内·外·杂" },
              { num: String(totalPassages), label: "段落", sub: "逐字注解" },
              { num: `${totalConcepts}+`, label: "核心概念", sub: "知识图谱" },
            ].map((stat, i) => (
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
      <DailyPassage />

      {/* ============================================
          Featured Chapters — Highlights
          ============================================ */}
      <section className="px-4 sm:px-6 lg:px-8 mb-20">
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
      <section className="px-4 sm:px-6 lg:px-8 mb-20">
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
                      className="card-interactive group p-4 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between">
                        <span className="chapter-badge">
                          {ch.order.toString().padStart(2, "0")}
                        </span>
                        <span className="tag">
                          {cat.key}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-[var(--text-accent)] tracking-wide group-hover:text-[var(--color-accent-deep)] transition-colors">
                        {ch.title}
                      </h4>
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
      <section className="px-4 sm:px-6 lg:px-8 mb-20">
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
          About Zhuangzi
          ============================================ */}
      <section className="px-4 sm:px-6 lg:px-8 mb-20">
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
