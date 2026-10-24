"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { useTheme } from "./ThemeProvider";

interface ChapterItem {
  id: string;
  title: string;
  category: string;
  summary: string;
}

interface ConceptItem {
  id: string;
  name: string;
  summary: string;
}

interface FableItem {
  id: string;
  name: string;
  chapter: string;
  chapterId: string;
  passageId: string;
  summary: string;
  moral: string;
  keywords?: string[];
}

interface QuoteItem {
  id: string;
  text: string;
  chapter: string;
  chapterId: string;
  passageId: string;
  theme: string;
  explanation?: string;
}

interface LazyData {
  chapters: ChapterItem[];
  concepts: ConceptItem[];
  fables: FableItem[];
  quotes: QuoteItem[];
}

// 模块级缓存：避免多次打开重复加载
let cachedData: LazyData | null = null;
let dataLoadingPromise: Promise<LazyData> | null = null;

function loadCorpusData(): Promise<LazyData> {
  if (cachedData) {
    return Promise.resolve(cachedData);
  }
  if (!dataLoadingPromise) {
    dataLoadingPromise = Promise.all([
      import("@/data/chapters/metadata"),
      import("@/data/concepts"),
      import("@/data/fables.json"),
      import("@/data/quotes.json"),
    ]).then(([metaModule, conceptsModule, fablesModule, quotesModule]) => {
      const data: LazyData = {
        chapters: metaModule.chaptersMeta.map((c) => ({
          id: c.id,
          title: c.title,
          category: c.category,
          summary: c.summary,
        })),
        concepts: conceptsModule.concepts.map((c) => ({
          id: c.id,
          name: c.name,
          summary: c.summary,
        })),
        fables: (fablesModule.default as { fables: FableItem[] }).fables,
        quotes: (quotesModule.default as { quotes: QuoteItem[] }).quotes,
      };
      cachedData = data;
      return data;
    });
  }
  return dataLoadingPromise;
}

interface PaletteActionItem {
  id: string;
  group: "指令" | "篇章" | "哲学概念" | "寓言典故" | "名句" | "全文检索";
  title: string;
  subtitle?: string;
  badge?: string;
  perform: () => void;
}

export default function CommandPalette({
  initialOpen = false,
}: {
  initialOpen?: boolean | undefined;
} = {}) {
  const [open, setOpen] = useState(initialOpen);
  const [query, setQuery] = useState("");
  const [corpus, setCorpus] = useState<LazyData | null>(cachedData);
  const [activeIndex, setActiveIndex] = useState(0);

  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const paletteId = useId();

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const closeAndNavigate = useCallback(
    (url: string) => {
      closePalette();
      router.push(url);
    },
    [closePalette, router]
  );

  const handleRandomChapter = useCallback(() => {
    const chapters = corpus?.chapters;
    if (chapters && chapters.length > 0) {
      const randomIndex = Math.floor(Math.random() * chapters.length);
      const target = chapters[randomIndex];
      if (target) {
        closeAndNavigate(`/chapters/${target.id}`);
        return;
      }
    }
    closeAndNavigate("/chapters/01-xiaoyao-you");
  }, [corpus, closeAndNavigate]);

  // 1. 全局快捷键与事件监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => {
          if (prev) {
            setQuery("");
            setActiveIndex(0);
            return false;
          }
          return true;
        });
      }
    };

    const handleCustomOpen = () => {
      setOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("zhuangzi:open-command-palette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("zhuangzi:open-command-palette", handleCustomOpen);
    };
  }, []);

  // 2. 打开时懒加载语料数据并聚焦输入框
  useEffect(() => {
    if (!open) return;

    if (!corpus) {
      void loadCorpusData().then((data) => {
        setCorpus(data);
      });
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [open, corpus]);

  // 3. 模态框打开时禁止背景滚动，Escape 键关闭
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePalette();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closePalette]);

  // 4. 构建操作与结果项
  const items = useMemo<PaletteActionItem[]>(() => {
    const q = query.trim().toLowerCase();
    const result: PaletteActionItem[] = [];

    // 快捷指令组
    const allCommands: PaletteActionItem[] = [
      {
        id: "cmd-vertical",
        group: "指令",
        title: "切换横排 / 宋刻竖排",
        subtitle: "切换现代横版阅读与宋元雕版立轴竖排",
        badge: "版式",
        perform: () => {
          const isVert = document.documentElement.classList.toggle("vertical-mode");
          try {
            localStorage.setItem("verticalMode", isVert ? "true" : "false");
          } catch {}
          closePalette();
        },
      },
      {
        id: "cmd-theme",
        group: "指令",
        title: "切换夜读墨色 / 宣纸白昼",
        subtitle: `当前：${theme === "yedu" ? "夜读墨色" : "宣纸白昼"}，点击切换`,
        badge: "色彩",
        perform: () => {
          const next = theme === "yedu" ? "xuanzhi" : "yedu";
          setTheme(next);
          try {
            localStorage.setItem("zhuangzi-theme", next);
            document.documentElement.setAttribute("data-theme", next);
          } catch {}
          closePalette();
        },
      },
      {
        id: "cmd-jiazhu",
        group: "指令",
        title: "切换宋刻双行夹注版式",
        subtitle: "切换宋刻古法双行小字夹注排印",
        badge: "训诂",
        perform: () => {
          const isJiazhu = document.documentElement.classList.toggle("jiazhu-mode");
          try {
            localStorage.setItem("jiazhuMode", isJiazhu ? "true" : "false");
          } catch {}
          closePalette();
        },
      },
      {
        id: "cmd-random",
        group: "指令",
        title: "逍遥漫游 · 随机展卷一篇",
        subtitle: "泛若不系之舟，随机沉浸研读三十三篇之一",
        badge: "雅集",
        perform: handleRandomChapter,
      },
      {
        id: "cmd-cards",
        group: "指令",
        title: "前往「文人笺纸海报工坊」",
        subtitle: "雅致木版水印名言笺纸生成器",
        badge: "工坊",
        perform: () => closeAndNavigate("/cards"),
      },
      {
        id: "cmd-report",
        group: "指令",
        title: "前往「庄子三十三篇研读印谱」",
        subtitle: "研读进度、概念罗盘与研精覃思总览",
        badge: "印谱",
        perform: () => closeAndNavigate("/report"),
      },
      {
        id: "cmd-bookmarks",
        group: "指令",
        title: "前往「我的书斋（收藏·批注·同步）」",
        subtitle: "查看个人南华藏本批注与收藏",
        badge: "书斋",
        perform: () => closeAndNavigate("/bookmarks"),
      },
    ];

    if (!q) {
      // 默认空状态：展示快捷指令
      result.push(...allCommands);

      // 若已加载语料，附带展示四大名篇与核心概念
      if (corpus) {
        const topChapters = corpus.chapters.filter((c) =>
          ["01-xiaoyao-you", "02-qiwu-lun", "03-yangsheng-zhu", "17-qiushui"].includes(c.id)
        );
        for (const ch of topChapters) {
          result.push({
            id: `top-ch-${ch.id}`,
            group: "篇章",
            title: `《庄子·${ch.title}》`,
            subtitle: `${ch.category} · ${ch.summary}`,
            badge: "名篇推荐",
            perform: () => closeAndNavigate(`/chapters/${ch.id}`),
          });
        }

        const topConcepts = corpus.concepts.slice(0, 4);
        for (const c of topConcepts) {
          result.push({
            id: `top-conc-${c.id}`,
            group: "哲学概念",
            title: `概念 · ${c.name}`,
            subtitle: c.summary,
            badge: "核心哲学",
            perform: () => closeAndNavigate(`/concepts#${c.id}`),
          });
        }
      }

      return result;
    }

    // 搜索过滤指令
    const matchedCommands = allCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q))
    );
    result.push(...matchedCommands);

    if (corpus) {
      // 篇章匹配 (至多 4 条)
      let chapterCount = 0;
      for (const ch of corpus.chapters) {
        if (
          ch.title.toLowerCase().includes(q) ||
          ch.summary.toLowerCase().includes(q) ||
          ch.category.toLowerCase().includes(q)
        ) {
          result.push({
            id: `ch-${ch.id}`,
            group: "篇章",
            title: `《庄子·${ch.title}》`,
            subtitle: `${ch.category} · ${ch.summary}`,
            badge: ch.category,
            perform: () => closeAndNavigate(`/chapters/${ch.id}`),
          });
          chapterCount++;
          if (chapterCount >= 4) break;
        }
      }

      // 哲学概念匹配 (至多 4 条)
      let conceptCount = 0;
      for (const c of corpus.concepts) {
        if (c.name.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q)) {
          result.push({
            id: `conc-${c.id}`,
            group: "哲学概念",
            title: `概念 · ${c.name}`,
            subtitle: c.summary,
            badge: "概念",
            perform: () => closeAndNavigate(`/concepts#${c.id}`),
          });
          conceptCount++;
          if (conceptCount >= 4) break;
        }
      }

      // 寓言典故匹配 (至多 4 条)
      let fableCount = 0;
      for (const f of corpus.fables) {
        const matchKeyword = f.keywords ? f.keywords.some((k) => k.toLowerCase().includes(q)) : false;
        if (
          f.name.toLowerCase().includes(q) ||
          f.summary.toLowerCase().includes(q) ||
          f.moral.toLowerCase().includes(q) ||
          matchKeyword
        ) {
          result.push({
            id: `fable-${f.id}`,
            group: "寓言典故",
            title: `寓言 · ${f.name}`,
            subtitle: `《${f.chapter}》：${f.summary}`,
            badge: "寓言",
            perform: () => closeAndNavigate(`/chapters/${f.chapterId}#passage-${f.passageId}`),
          });
          fableCount++;
          if (fableCount >= 4) break;
        }
      }

      // 名句精选匹配 (至多 4 条)
      let quoteCount = 0;
      for (const qt of corpus.quotes) {
        if (
          qt.text.toLowerCase().includes(q) ||
          qt.theme.toLowerCase().includes(q) ||
          (qt.explanation && qt.explanation.toLowerCase().includes(q))
        ) {
          result.push({
            id: `quote-${qt.id}`,
            group: "名句",
            title: `「${qt.text}」`,
            subtitle: `《${qt.chapter}》· 旨归：${qt.theme}`,
            badge: "名句",
            perform: () => closeAndNavigate(`/chapters/${qt.chapterId}#passage-${qt.passageId}`),
          });
          quoteCount++;
          if (quoteCount >= 4) break;
        }
      }
    }

    // 兜底全文检索项
    result.push({
      id: "search-fallback",
      group: "全文检索",
      title: `全文检索「${query.trim()}」`,
      subtitle: "检索全部三十三篇原文、注译与各家训诂考据",
      badge: "全文",
      perform: () => closeAndNavigate(`/search?q=${encodeURIComponent(query.trim())}`),
    });

    return result;
  }, [query, corpus, theme, setTheme, closePalette, closeAndNavigate, handleRandomChapter]);

  // 自动滚动到可视区域
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = items[activeIndex];
      if (current) {
        current.perform();
      }
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${paletteId}-title`}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 sm:px-6 select-none"
    >
      {/* 毛玻璃背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={closePalette}
        aria-hidden="true"
      />

      {/* 居中宋刻宣纸命令台模态框 */}
      <div className="relative w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-[0_25px_60px_-15px_rgba(35,28,20,0.35)] overflow-hidden transition-all z-10 flex flex-col max-h-[75vh]">
        {/* 顶部搜索输入框 */}
        <div className="flex items-center px-4 py-3.5 border-b border-[var(--border-light)] bg-[var(--bg-card)]">
          <svg
            className="w-5 h-5 text-[var(--color-accent-vermilion)] shrink-0 mr-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>

          <input
            ref={inputRef}
            id={`${paletteId}-title`}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={`${paletteId}-list`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="搜篇章、名句、典故、概念，或输入指令…"
            className="flex-1 bg-transparent text-sm sm:text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none font-serif tracking-wide"
          />

          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
            ESC
          </kbd>
        </div>

        {/* 列表项 */}
        <ul
          id={`${paletteId}-list`}
          ref={listRef}
          role="listbox"
          className="flex-1 overflow-y-auto px-2 py-2 space-y-1"
        >
          {items.map((item, index) => {
            const isSelected = index === activeIndex;
            return (
              <li
                key={item.id}
                role="option"
                data-index={index}
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => item.perform()}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[var(--text-accent)]/10 text-[var(--text-primary)] border border-[var(--text-accent)]/30"
                    : "hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={`shrink-0 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium tracking-widest ${
                      item.group === "指令"
                        ? "bg-[var(--color-accent-vermilion)]/15 text-[var(--color-accent-vermilion)] border border-[var(--color-accent-vermilion)]/30"
                        : item.group === "篇章"
                        ? "bg-[var(--text-accent)]/15 text-[var(--text-accent)]"
                        : item.group === "哲学概念"
                        ? "bg-[var(--color-accent-gold)]/15 text-[var(--color-accent-gold)]"
                        : item.group === "寓言典故"
                        ? "bg-[var(--accent-bamboo,#3A6B56)]/15 text-[var(--accent-bamboo,#3A6B56)]"
                        : item.group === "名句"
                        ? "bg-[var(--color-accent-vermilion)]/10 text-[var(--color-accent-vermilion)]"
                        : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                    }`}
                  >
                    {item.group}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-serif truncate ${isSelected ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-primary)]"}`}>
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {item.badge && (
                  <span className="shrink-0 text-[10px] text-[var(--text-muted)] ml-2 hidden sm:inline-block">
                    {item.badge}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {/* 底部键盘操作提示栏 */}
        <div className="px-4 py-2 border-t border-[var(--border-light)] bg-[var(--bg-secondary)]/50 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <div className="flex items-center gap-3">
            <span>↑↓ 移动</span>
            <span>·</span>
            <span>↵ 直达</span>
            <span>·</span>
            <span>ESC 关闭</span>
          </div>
          <div className="font-serif tracking-widest text-[var(--text-secondary)] opacity-85">
            庄子典藏 · 萬象參同
          </div>
        </div>
      </div>
    </div>
  );
}
