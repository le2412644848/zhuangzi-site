import Link from "next/link";

/**
 * 站点页脚 —— 纯服务端组件。
 * 沉浸模式下由 CSS 隐藏（html.immersive-mode footer.site-footer），
 * 不依赖客户端状态，避免进入任何 client 包裹树。
 */
export default function Footer() {
  return (
    <footer className="site-footer bg-[var(--bg-secondary)] no-print mt-auto text-center">
      {/* 顶部水墨渐隐边线（设计升级规范五.4）：取代原硬 border-t，
          两端渐隐入底色，如宣纸上洇开的一道墨痕 */}
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(to right, transparent, var(--color-accent) 12%, var(--color-accent) 88%, transparent)",
          opacity: 0.28,
        }}
        aria-hidden
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 text-center">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="text-lg font-semibold tracking-[0.08em] text-[var(--text-accent)] font-serif">
              莊子
            </Link>
            <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
              三十三篇，千古文章。<br />
              以无为之姿，游无穷之境。
            </p>
          </div>
          <div className="sm:border-l sm:border-[var(--border-color)] sm:pl-6">
            <p className="text-xs font-semibold text-[var(--text-primary)] tracking-[0.1em] uppercase mb-3">阅读</p>
            <div className="space-y-2">
              {[
                { href: "/chapters", label: "篇章" }, { href: "/concepts", label: "核心概念" },
                { href: "/quotes", label: "名句精选" }, { href: "/fables", label: "寓言故事" },
                { href: "/reading-routes", label: "主题路线" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="block text-xs text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="sm:border-l sm:border-[var(--border-color)] sm:pl-6">
            <p className="text-xs font-semibold text-[var(--text-primary)] tracking-[0.1em] uppercase mb-3">探索</p>
            <div className="space-y-2">
              {[
                { href: "/search", label: "全文搜索" }, { href: "/timeline", label: "时间线" },
                { href: "/map", label: "庄子地理" }, { href: "/concordance", label: "词语索引" },
                { href: "/heatmap", label: "词频热图" }, { href: "/zhuangzi", label: "庄子生平" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="block text-xs text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="sm:border-l sm:border-[var(--border-color)] sm:pl-6">
            <p className="text-xs font-semibold text-[var(--text-primary)] tracking-[0.1em] uppercase mb-3">互动</p>
            <div className="space-y-2">
              {[
                { href: "/ask-zhuangzi", label: "问庄子" }, { href: "/compare", label: "诸子对谈" },
                { href: "/translate-challenge", label: "翻译挑战" }, { href: "/recite", label: "名句背诵" },
                { href: "/dream", label: "庄周梦蝶" }, { href: "/reading-path", label: "定制阅读路径" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="block text-xs text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="sm:border-l sm:border-[var(--border-color)] sm:pl-6">
            <p className="text-xs font-semibold text-[var(--text-primary)] tracking-[0.1em] uppercase mb-3">工具</p>
            <div className="space-y-2">
              {[
                { href: "/bookmarks", label: "我的书斋（收藏·批注）" }, { href: "/report", label: "阅读报告" },
                { href: "/cards", label: "名言卡片" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="block text-xs text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-[var(--border-light)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[var(--text-muted)] tracking-wide flex items-center gap-2">
            {/* 朱砂小印章微标（设计升级规范五.4）：版权旁钤「逍遥」方印 */}
            <span
              className="inline-flex items-center justify-center text-[10px] font-serif leading-none"
              style={{
                width: "1.5em",
                height: "1.5em",
                border: "1.5px solid var(--color-accent-vermilion)",
                color: "var(--color-accent-vermilion)",
                borderRadius: "3px",
                letterSpacing: 0,
              }}
              aria-hidden
            >
              遊
            </span>
            &copy; {new Date().getFullYear()} 莊子數位典藏 · 逍遥游于无何有之乡
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors"
            >
              隐私说明
            </Link>
            <Link
              href="/attributions"
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors"
            >
              引用与致谢
            </Link>
            <p className="text-xs text-[var(--text-muted)]">
              按 <kbd className="px-1 py-0.5 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[10px]">?</kbd> 查看快捷键
            </p>
            <p className="text-xs text-[var(--text-muted)] hidden sm:inline">以无为之姿，游无穷之境</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
