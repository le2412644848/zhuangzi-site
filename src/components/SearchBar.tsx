"use client";

import { useRouter } from "next/navigation";
import { useEffect,useMemo,useRef, useState } from "react";

interface ChapterMetaLite {
  id: string;
  title: string;
  category: string;
  passageCount: number;
}

interface QuoteLite {
  id: string;
  text: string;
  chapter: string;
  theme: string;
}

interface Suggestion {
  id: string;
  type: "chapter" | "quote";
  label: string;
  sub: string;
  href: string;
}

/**
 * 搜索框 —— 带即时联想（对标古诗文网：输入即出篇名/名句建议）。
 *
 * 联想数据（33 篇元数据 + 44 条名句）刻意做成**聚焦/输入时才动态
 * import 的异步 chunk**：曾尝试静态引入，把共享 JS 基线从 195KB
 * 抬到 220KB —— 本组件出现在首页/404/搜索页，静态数据会被并进
 * 共享包。回车仍走 /search 全文检索。
 *
 * `initialValue`：/search?q=… 打开时把词回显进输入框（视觉复审 N3），
 * 分享链接打开后用户能看到当前词、可直接改词。
 */
export default function SearchBar({ compact = false, initialValue = "" }: { compact?: boolean; initialValue?: string }) {
  const [query, setQuery] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [chapters, setChapters] = useState<ChapterMetaLite[]>([]);
  const [quotes, setQuotes] = useState<QuoteLite[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dataRequested = useRef(false);
  const listId = "search-suggestions";



  const prevInitRef = useRef(initialValue);

  // URL 参数变化时同步输入框（首帧初值已一致，不重复 setState）
  useEffect(() => {
    if (prevInitRef.current !== initialValue) {
      prevInitRef.current = initialValue;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery(initialValue);
    }
  }, [initialValue]);

  /** 首次聚焦/输入时才拉取联想数据（异步 chunk，不进首屏包） */
  const ensureData = () => {
    if (dataRequested.current) return;
    dataRequested.current = true;
    void Promise.all([
      import("@/data/chapters/metadata"),
      import("@/data/quotes.json"),
    ]).then(([meta, q]) => {
      setChapters(
        meta.chaptersMeta.map((c) => ({
          id: c.id,
          title: c.title,
          category: c.category,
          passageCount: c.passageCount,
        }))
      );
      setQuotes((q.default as { quotes: QuoteLite[] }).quotes);
    }).catch(() => {
      // 联想失败不阻塞搜索
      dataRequested.current = false;
    });
  };

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = query.trim();
    if (!q || chapters.length === 0) return [];
    const out: Suggestion[] = [];

    for (const ch of chapters) {
      if (ch.title.includes(q)) {
        out.push({
          id: `ch-${ch.id}`,
          type: "chapter",
          label: ch.title,
          sub: `${ch.category} · ${ch.passageCount} 节`,
          href: `/chapters/${ch.id}`,
        });
      }
      if (out.filter((s) => s.type === "chapter").length >= 3) break;
    }

    for (const q2 of quotes) {
      if (out.length >= 6) break;
      if (q2.text.includes(q) || q2.theme.includes(q)) {
        out.push({
          id: `qt-${q2.id}`,
          type: "quote",
          label: q2.text.length > 22 ? `${q2.text.slice(0, 22)}…` : q2.text,
          sub: `《${q2.chapter}》 · ${q2.theme}`,
          href: `/quotes#${q2.id}`,
        });
      }
    }

    return out;
  }, [query, chapters, quotes]);

  const go = (href: string) => {
    setOpen(false);
    setActiveIndex(-1);
    router.push(href);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const picked = activeIndex >= 0 ? suggestions[activeIndex] : undefined;
    if (picked) {
      go(picked.href);
    } else if (query.trim()) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const showList = open && suggestions.length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative ${compact ? "w-full max-w-sm" : "w-full max-w-lg"}`}
    >
      <div className="relative">
        {/* Search icon */}
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] z-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? suggestions[activeIndex]?.id : undefined}
          onChange={(e) => {
            setQuery(e.target.value);
            ensureData();
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            ensureData();
            setOpen(true);
          }}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          placeholder="搜索《庄子》原文…"
          aria-label="搜索《庄子》原文"
          className="w-full pl-11 pr-12 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]/90 backdrop-blur-md text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)]/20 focus:border-[var(--text-accent)]/40 transition-all shadow-[0_8px_30px_rgba(35,28,20,0.06)]"
        />

        {/* Cmd+K badge */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("zhuangzi:open-command-palette"))}
          aria-label="打开万能命令台 (⌘K)"
          title="打开万能命令台 (⌘K)"
          className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-accent)] hover:border-[var(--text-accent)]/40 hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
        >
          ⌘K
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="搜索建议"
          className="absolute left-0 right-0 top-full mt-2 z-50 max-h-80 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-lg py-1.5 text-left"
        >
          {suggestions.map((s, i) => (
            <li key={s.id} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                // mousedown 先于 input blur，保证点击选项时不被 onBlur 关闭
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(s.href)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${
                  i === activeIndex ? "bg-[var(--hover-bg)]" : "hover:bg-[var(--hover-bg)]"
                }`}
              >
                <span
                  className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wider ${
                    s.type === "chapter"
                      ? "bg-[var(--text-accent)]/10 text-[var(--text-accent)]"
                      : "bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)]"
                  }`}
                >
                  {s.type === "chapter" ? "篇" : "句"}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-[var(--text-primary)] font-serif truncate">
                    {s.label}
                  </span>
                  <span className="block text-xs text-[var(--text-muted)] truncate">
                    {s.sub}
                  </span>
                </span>
              </button>
            </li>
          ))}
          <li className="px-4 pt-1.5 pb-0.5 border-t border-[var(--border-light)] mt-1">
            <span className="text-xs text-[var(--text-muted)]">
              回车查看「{query.trim()}」全文检索结果 →
            </span>
          </li>
        </ul>
      )}
    </form>
  );
}
