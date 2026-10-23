"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

interface ScholarMarginNotesProps {
  chapterId: string;
  chapterTitle: string;
  passageCount: number;
}

interface Citation {
  author: string;
  quote: string;
  source?: string;
}

interface KaojuItem {
  seq?: number;
  term: string;
  explanation: string;
  citations?: Citation[];
  seg?: number;
}

interface KaojuData {
  entries?: {
    chen?: KaojuItem[];
    fang?: KaojuItem[];
  };
}

interface RelatedPassage {
  chapterId: string;
  chapterTitle: string;
  passageId: string;
  original: string;
  concept?: string;
}

type TabKey = "meipi" | "hecan" | "huzheng";

/** 篇级考据缓存，避免切节或重渲染时重复 fetch */
const chapterKaojuMap = new Map<string, Promise<KaojuData | null>>();

function fetchChapterKaoju(chapterId: string): Promise<KaojuData | null> {
  let p = chapterKaojuMap.get(chapterId);
  if (!p) {
    p = fetch(`/data/kaoju/${chapterId}.json`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
    chapterKaojuMap.set(chapterId, p);
  }
  return p;
}

// 缓存全局 related 数据
let cachedRelatedPromise: Promise<Record<string, RelatedPassage[]>> | null = null;
function loadRelatedData(): Promise<Record<string, RelatedPassage[]>> {
  if (!cachedRelatedPromise) {
    cachedRelatedPromise = import("@/data/related.json").then(
      (m) => (m.default as { conceptMap: Record<string, RelatedPassage[]> }).conceptMap
    );
  }
  return cachedRelatedPromise;
}

export default function ScholarMarginNotes({
  chapterId,
  passageCount,
}: ScholarMarginNotesProps) {
  // 当前处于视口中的段落索引（1-indexed）
  const [activePassageIndex, setActivePassageIndex] = useState<number>(1);
  const [kaojuData, setKaojuData] = useState<KaojuData | null>(null);
  const [focusedTerm, setFocusedTerm] = useState<string | null>(null);
  const [quoteExcerpts, setQuoteExcerpts] = useState<{ text: string; theme: string }[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("meipi");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [relatedPassages, setRelatedPassages] = useState<RelatedPassage[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // 1. 懒加载本篇考据 JSON
  useEffect(() => {
    let cancelled = false;
    fetchChapterKaoju(chapterId).then((data) => {
      if (!cancelled && data) {
        setKaojuData(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [chapterId]);

  // 2. 视口交叉观察：跟踪读者阅读到的段落位置并提取本节名句
  useEffect(() => {
    const passageElements = document.querySelectorAll<HTMLElement>('[id^="passage-"]');
    if (!passageElements.length) return;

    const extractQuotes = (el: HTMLElement) => {
      const quotes: { text: string; theme: string }[] = [];
      const quoteMarks = el.querySelectorAll<HTMLElement>(".quote-mark");
      quoteMarks.forEach((mark) => {
        const text = mark.textContent?.trim();
        const title = mark.getAttribute("title") || "";
        const themeMatch = title.match(/名句 · ([^：]+)/);
        const theme = themeMatch?.[1] ?? "名言";
        if (text && !quotes.some((q) => q.text === text)) {
          quotes.push({ text, theme });
        }
      });
      return quotes.slice(0, 2);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const matchedPassages = Array.from(passageElements);
            const index = matchedPassages.findIndex((el) => el.id === id);
            if (index !== -1) {
              setActivePassageIndex(index + 1);
              setQuoteExcerpts(extractQuotes(entry.target as HTMLElement));
            }
            break;
          }
        }
      },
      {
        rootMargin: "-15% 0px -55% 0px",
        threshold: 0,
      }
    );

    passageElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [passageCount]);

  // 3. 监听注词聚焦事件
  useEffect(() => {
    const handleCustomFocus = (e: Event) => {
      const customEvent = e as CustomEvent<{ term?: string }>;
      if (customEvent.detail?.term) {
        setFocusedTerm(customEvent.detail.term);
      }
    };

    const handlePointerOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest<HTMLButtonElement>('button[aria-label*="— 查看注释"]');
      if (btn) {
        const label = btn.getAttribute("aria-label");
        const term = label ? label.split(" — ")[0] : btn.textContent?.trim();
        if (term) setFocusedTerm(term);
      }
    };

    window.addEventListener("zhuangzi:focus-term", handleCustomFocus);
    document.addEventListener("mouseover", handlePointerOver, { passive: true });

    return () => {
      window.removeEventListener("zhuangzi:focus-term", handleCustomFocus);
      document.removeEventListener("mouseover", handlePointerOver);
    };
  }, []);

  // 4. 懒加载跨篇互证数据（严格排除 chapterId 本身）
  useEffect(() => {
    let cancelled = false;
    loadRelatedData().then((conceptMap) => {
      if (cancelled) return;
      const found: RelatedPassage[] = [];
      const seen = new Set<string>();

      for (const [conceptKey, passages] of Object.entries(conceptMap)) {
        // 如果该概念包含当前篇章
        const hasCurrentChapter = passages.some((p) => p.chapterId === chapterId);
        if (hasCurrentChapter) {
          for (const p of passages) {
            // 严格排除本篇自身
            if (p.chapterId === chapterId) continue;
            const key = `${p.chapterId}-${p.passageId}`;
            if (!seen.has(key)) {
              seen.add(key);
              found.push({ ...p, concept: conceptKey });
            }
          }
        }
      }
      setRelatedPassages(found.slice(0, 12));
    });

    return () => {
      cancelled = true;
    };
  }, [chapterId]);

  // 抽屉 Escape 关闭
  useEffect(() => {
    if (!drawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  // 当前节对应的考据词条列表
  const currentSeg = activePassageIndex - 1;
  const chenEntries = useMemo(() => kaojuData?.entries?.chen ?? [], [kaojuData]);
  const fangEntries = useMemo(() => kaojuData?.entries?.fang ?? [], [kaojuData]);

  // 本节陈鼓应考据条目
  const segChenEntries = useMemo(
    () => chenEntries.filter((entry) => entry.seg === currentSeg),
    [chenEntries, currentSeg]
  );

  // 本节方勇考据条目
  const segFangEntries = useMemo(
    () => fangEntries.filter((entry) => entry.seg === currentSeg),
    [fangEntries, currentSeg]
  );

  // 查找聚焦词的考据条目
  const activeDetail = useMemo(() => {
    if (!focusedTerm) return null;
    return (
      chenEntries.find(
        (e) => e.term === focusedTerm || e.term.includes(focusedTerm) || focusedTerm.includes(e.term)
      ) ||
      fangEntries.find(
        (e) => e.term === focusedTerm || e.term.includes(focusedTerm) || focusedTerm.includes(e.term)
      ) ||
      null
    );
  }, [focusedTerm, chenEntries, fangEntries]);

  // 四家合参词条对照列表（将陈、方按词条聚合）
  const pairedHecanEntries = useMemo(() => {
    const terms = new Set<string>();
    segChenEntries.forEach((e) => terms.add(e.term));
    segFangEntries.forEach((e) => terms.add(e.term));

    return Array.from(terms).map((term) => ({
      term,
      chen: segChenEntries.find((e) => e.term === term),
      fang: segFangEntries.find((e) => e.term === term),
    }));
  }, [segChenEntries, segFangEntries]);

  const renderContent = useCallback(() => {
    return (
      <div className="space-y-3.5 text-xs text-[var(--text-primary)]">
        {/* 顶部标题与小节指示 */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--color-accent-vermilion)]/25">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold tracking-widest text-[var(--color-accent-vermilion)] border border-[var(--color-accent-vermilion)] rounded-sm select-none">
              朱批合参
            </span>
            <span className="font-serif font-medium text-[var(--text-accent)] text-xs">
              第 {activePassageIndex} 节
            </span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] tracking-wider">
            共 {passageCount} 节
          </span>
        </div>

        {/* 三栏 Tab 导航枢杻 */}
        <div className="flex items-center border-b border-[var(--border-light)] gap-1 text-[11px] font-serif">
          <button
            type="button"
            onClick={() => setActiveTab("meipi")}
            className={`pb-1 px-2.5 transition-colors border-b-2 ${
              activeTab === "meipi"
                ? "border-[var(--color-accent-vermilion)] text-[var(--color-accent-vermilion)] font-medium"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            眉批
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("hecan")}
            className={`pb-1 px-2.5 transition-colors border-b-2 flex items-center gap-1 ${
              activeTab === "hecan"
                ? "border-[var(--color-accent-vermilion)] text-[var(--color-accent-vermilion)] font-medium"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>合参</span>
            {pairedHecanEntries.length > 0 && (
              <span className="text-[9px] px-1 py-0.2 rounded-full bg-[var(--color-accent-vermilion)]/10 text-[var(--color-accent-vermilion)]">
                {pairedHecanEntries.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("huzheng")}
            className={`pb-1 px-2.5 transition-colors border-b-2 flex items-center gap-1 ${
              activeTab === "huzheng"
                ? "border-[var(--color-accent-vermilion)] text-[var(--color-accent-vermilion)] font-medium"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>互证</span>
            {relatedPassages.length > 0 && (
              <span className="text-[9px] px-1 py-0.2 rounded-full bg-[var(--text-accent)]/10 text-[var(--text-accent)]">
                {relatedPassages.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: 眉批 */}
        {activeTab === "meipi" && (
          <div className="space-y-3 animate-fade-in">
            {/* 重点词训诂聚焦卡片 */}
            {activeDetail ? (
              <div className="p-2.5 rounded-lg border border-[var(--color-accent-vermilion)]/50 bg-[var(--color-accent-vermilion)]/5 space-y-1.5 transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--color-accent-vermilion)] tracking-wide">
                    「{activeDetail.term}」
                  </span>
                  <button
                    type="button"
                    onClick={() => setFocusedTerm(null)}
                    className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-accent)] px-1 rounded"
                    title="返回本节概览"
                  >
                    ✕ 清除
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-primary)] leading-relaxed">
                  {activeDetail.explanation}
                </p>
                {activeDetail.citations && activeDetail.citations.length > 0 && (
                  <div className="mt-1 pt-1.5 border-t border-[var(--color-accent-vermilion)]/20 text-[10px] text-[var(--text-secondary)] space-y-1">
                    <div className="font-medium text-[var(--text-accent)]">古注参考：</div>
                    {activeDetail.citations.slice(0, 2).map((cite, idx) => (
                      <div key={idx} className="leading-snug">
                        <span className="font-semibold">{cite.author}：</span>
                        <span>
                          {cite.quote.length > 45 ? `${cite.quote.slice(0, 45)}…` : cite.quote}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* 本节名句眉批 */}
            {quoteExcerpts.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold text-[var(--text-accent)] tracking-wider flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent-vermilion)]" />
                  <span>名句眉批</span>
                </div>
                <div className="space-y-1">
                  {quoteExcerpts.map((quote, idx) => (
                    <div
                      key={idx}
                      className="pl-2 border-l-2 border-[var(--color-accent-vermilion)] text-[11px] italic text-[var(--text-secondary)] leading-relaxed"
                    >
                      「{quote.text}」
                      <span className="block not-italic text-[10px] text-[var(--text-muted)] mt-0.5">
                        — {quote.theme}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 本节陈鼓应要词 */}
            <div className="space-y-2">
              <div className="text-[10px] font-semibold text-[var(--text-muted)] tracking-wider">
                本节要词集解（陈鼓应）
              </div>
              {segChenEntries.length > 0 ? (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {segChenEntries.map((item, idx) => {
                    const isSelected = focusedTerm === item.term;
                    return (
                      <div
                        key={idx}
                        onClick={() => setFocusedTerm(item.term)}
                        className={`p-1.5 rounded cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[var(--color-accent-vermilion)]/10 text-[var(--color-accent-vermilion)] font-medium"
                            : "hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="font-medium text-[11px] text-[var(--text-accent)]">
                            {item.term}
                          </span>
                          <span className="text-[9px] text-[var(--text-muted)] font-mono">
                            #{item.seq ?? idx + 1}
                          </span>
                        </div>
                        <div className="text-[10px] line-clamp-2 leading-relaxed opacity-90">
                          {item.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-2 text-center text-[10px] text-[var(--text-muted)]">
                  本节无独立字词考据
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: 合参（陈鼓应今注 vs 方勇纂要训诂） */}
        {activeTab === "hecan" && (
          <div className="space-y-2.5 animate-fade-in max-h-80 overflow-y-auto pr-1">
            <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between pb-1">
              <span>四家合参 · 陈鼓应今注 ∥ 方勇纂要</span>
              <span>{pairedHecanEntries.length} 词条</span>
            </div>

            {pairedHecanEntries.length > 0 ? (
              pairedHecanEntries.map((pair, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)]/30 space-y-1.5"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-1">
                    <span className="font-bold font-serif text-[12px] text-[var(--color-accent-vermilion)]">
                      「{pair.term}」
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFocusedTerm(pair.term);
                        setActiveTab("meipi");
                      }}
                      className="text-[9px] text-[var(--text-muted)] hover:text-[var(--text-accent)]"
                    >
                      眉批聚焦 →
                    </button>
                  </div>

                  {/* 陈鼓应注 */}
                  {pair.chen ? (
                    <div className="text-[10px] leading-relaxed">
                      <span className="font-semibold text-[var(--text-accent)]">【陈鼓应今注】：</span>
                      <span className="text-[var(--text-primary)]">{pair.chen.explanation}</span>
                    </div>
                  ) : null}

                  {/* 方勇纂要注 */}
                  {pair.fang ? (
                    <div className="text-[10px] leading-relaxed pt-1 border-t border-dashed border-[var(--border-light)]">
                      <span className="font-semibold text-[var(--accent-bamboo,#3A6B56)]">【方勇纂要】：</span>
                      <span className="text-[var(--text-primary)]">{pair.fang.explanation}</span>
                    </div>
                  ) : null}

                  {/* 重点古注援引 */}
                  {pair.chen?.citations && pair.chen.citations.length > 0 && (
                    <div className="text-[9px] text-[var(--text-muted)] pt-1 italic">
                      古注：{pair.chen.citations[0]?.author}「{pair.chen.citations[0]?.quote.slice(0, 32)}…」
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-[11px] text-[var(--text-muted)]">
                当前节无两家训诂对照条目
              </div>
            )}
          </div>
        )}

        {/* Tab 3: 互证（以庄解庄 · 他篇互证） */}
        {activeTab === "huzheng" && (
          <div className="space-y-2.5 animate-fade-in max-h-80 overflow-y-auto pr-1">
            <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between pb-1">
              <span>以庄解庄 · 跨篇哲学互证</span>
              <span>{relatedPassages.length} 段落</span>
            </div>

            {relatedPassages.length > 0 ? (
              <div className="space-y-2">
                {relatedPassages.map((p, idx) => (
                  <Link
                    key={idx}
                    href={`/chapters/${p.chapterId}#passage-${p.passageId}`}
                    className="block p-2 rounded border border-[var(--border-light)] hover:border-[var(--color-accent-vermilion)]/40 hover:bg-[var(--hover-bg)] transition-colors group"
                  >
                    <div className="flex items-center justify-between text-[11px] font-medium text-[var(--text-accent)]">
                      <span>《{p.chapterTitle}》</span>
                      <span className="text-[9px] text-[var(--color-accent-vermilion)] group-hover:underline">
                        跨篇互证 ↗
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--text-primary)] mt-1 line-clamp-2 leading-relaxed">
                      {p.original}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-[11px] text-[var(--text-muted)]">
                暂无其他关联篇章互证
              </div>
            )}
          </div>
        )}

        {/* 底部善本钤记 */}
        <div className="pt-2 border-t border-[var(--border-light)] flex items-center justify-between text-[10px] text-[var(--text-muted)]">
          <span className="font-serif">南华考镜 · 随文析义</span>
          <span className="text-[9px] opacity-75">点击词条置顶聚焦</span>
        </div>
      </div>
    );
  }, [
    activePassageIndex,
    passageCount,
    activeTab,
    pairedHecanEntries,
    relatedPassages,
    activeDetail,
    quoteExcerpts,
    segChenEntries,
    focusedTerm,
  ]);

  return (
    <>
      {/* 1. 中小屏 (<2xl) 左侧悬浮朱印按钮 */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="fixed left-0 top-1/3 z-30 2xl:hidden bg-[var(--bg-card)] border-y border-r border-[var(--color-accent-vermilion)]/40 rounded-r-lg shadow-md px-1.5 py-3 text-xs font-serif text-[var(--color-accent-vermilion)] hover:bg-[var(--hover-bg)] transition-all flex flex-col items-center gap-1 cursor-pointer select-none"
        aria-label="打开朱批合参伴读抽屉"
        title="朱批合参"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-vermilion)]" />
        <span style={{ writingMode: "vertical-rl" }} className="tracking-widest">
          朱批合参
        </span>
      </button>

      {/* 2. 中小屏 (<2xl) 伴读抽屉与遮罩 */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-50 2xl:hidden flex select-none"
        >
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* 抽屉主体 */}
          <div
            ref={drawerRef}
            className="relative w-80 sm:w-96 max-w-[85vw] h-full bg-[var(--bg-card)] border-r border-[var(--border-color)] shadow-2xl p-4 overflow-y-auto z-10 animate-slide-right flex flex-col"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-light)]">
              <span id={titleId} className="font-serif text-sm font-semibold text-[var(--text-accent)]">
                宋刻眉批 & 四家合参
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
                aria-label="关闭抽屉"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderContent()}</div>
          </div>
        </div>
      )}

      {/* 3. 宽屏 (2xl+) 左侧悬浮固定栏 */}
      <aside
        ref={containerRef}
        aria-label="宋刻朱批笺注栏"
        className="scholar-margin-notes hidden 2xl:block fixed left-6 top-24 w-80 max-h-[calc(100vh-8rem)] overflow-y-auto z-20 transition-all duration-300"
      >
        <div className="rounded-xl border border-[var(--color-accent-vermilion)]/40 bg-[var(--bg-card)]/95 backdrop-blur-md shadow-md p-3.5">
          {renderContent()}
        </div>
      </aside>
    </>
  );
}
