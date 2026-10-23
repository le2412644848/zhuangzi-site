"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getReadingHistory } from "@/components/ReadingHistory";
import { chaptersMeta } from "@/data/chapters/metadata";
import { getAnnotations, getBookmarks } from "@/lib/annotations";

interface Stats {
  totalChapters: number;
  readChapters: string[];
  totalPassages: number;
  bookmarkedCount: number;
  annotatedCount: number;
  streak: number;
  lastReadDate: string | null;
  chapterLastReadMap: Record<string, string>;
}

const CATEGORY_SECTIONS = [
  {
    key: "内篇",
    title: "内篇七篇 · 逍遥本源",
    desc: "庄子自定核心篇目 · 探究道与齐物真意",
  },
  {
    key: "外篇",
    title: "外篇十五篇 · 叩问世变",
    desc: "门人学派弘阐 · 观照世间百态与治理之思",
  },
  {
    key: "杂篇",
    title: "杂篇十一篇 · 汪洋博衍",
    desc: "后学汇流之作 · 极尽言辞奥妙与精神飞升",
  },
];

export default function ReportPage() {
  const [stats, setStats] = useState<Stats>({
    totalChapters: chaptersMeta.length,
    readChapters: [],
    totalPassages: chaptersMeta.reduce((a, c) => a + c.passageCount, 0),
    bookmarkedCount: 0,
    annotatedCount: 0,
    streak: 0,
    lastReadDate: null,
    chapterLastReadMap: {},
  });

  useEffect(() => {
    const history = getReadingHistory();
    const readIds = new Set(history.map((h) => h.chapterId));

    const chapterLastReadMap: Record<string, string> = {};
    for (const h of history) {
      if (!chapterLastReadMap[h.chapterId]) {
        chapterLastReadMap[h.chapterId] = new Date(h.timestamp).toLocaleDateString("zh-CN");
      }
    }

    let bmCount = 0;
    try {
      bmCount = getBookmarks().length;
    } catch {}

    let annCount = 0;
    try {
      annCount = Object.keys(getAnnotations()).length;
    } catch {}

    // 修复连续阅读天数（streak）计算
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const oneDayMs = 86400000;

    const timestamps = history.map((h) => {
      const d = new Date(h.timestamp);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });

    const uniqueDays = Array.from(new Set(timestamps)).sort((a, b) => b - a);

    let streak = 0;
    if (uniqueDays.length > 0) {
      const latestDay = uniqueDays[0]!;
      // 只要最近阅读记录在今天或昨天，便处于连贯研读期，逐日倒推累加
      if (latestDay === todayMs || latestDay === todayMs - oneDayMs) {
        let expectedDay = latestDay;
        for (const day of uniqueDays) {
          if (day === expectedDay) {
            streak++;
            expectedDay -= oneDayMs;
          } else {
            break;
          }
        }
      }
    }

    // 挂载后安全同步客户端状态（hydration-safe）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats({
      totalChapters: chaptersMeta.length,
      readChapters: [...readIds],
      totalPassages: chaptersMeta.reduce((a, c) => a + c.passageCount, 0),
      bookmarkedCount: bmCount,
      annotatedCount: annCount,
      streak,
      lastReadDate: history[0]
        ? new Date(history[0].timestamp).toLocaleDateString("zh-CN")
        : null,
      chapterLastReadMap,
    });
  }, []);

  const readPercent = Math.round(
    (stats.readChapters.length / stats.totalChapters) * 100
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* 卷首标题 */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-serif bg-[var(--text-accent)]/10 text-[var(--text-accent)] mb-3">
          <span className="seal-char" aria-hidden="true">卷</span>
          书斋研读卷轴
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-[0.06em] text-[var(--text-primary)] mb-2">
          庄子三十三篇 · 研读印谱
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          墨痕初定，展卷有时。记取每一回于濠梁之上的相逢。
        </p>
        <div className="ink-divider max-w-xs mx-auto mt-4" />
      </div>

      {/* 四项雅致书签统计 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          {
            seal: "覽",
            label: "已阅篇章",
            value: `${stats.readChapters.length} / ${stats.totalChapters}`,
            sub: `研读覆盖 ${readPercent}%`,
          },
          {
            seal: "籤",
            label: "藏书书签",
            value: String(stats.bookmarkedCount),
            sub: "珍藏金句节录",
          },
          {
            seal: "註",
            label: "眉批札记",
            value: String(stats.annotatedCount),
            sub: "字里心会领悟",
          },
          {
            seal: "恆",
            label: "连日研读",
            value: `${stats.streak}`,
            sub: stats.streak > 0 ? "日省不辍" : "今日宜展卷",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-serif text-[var(--text-secondary)]">
                {item.label}
              </span>
              <span className="seal-char" aria-hidden="true">
                {item.seal}
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold font-serif text-[var(--text-primary)]">
                {item.value}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                {item.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 研读进度长卷条 */}
      <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] mb-10 shadow-xs">
        <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] mb-2.5 font-serif">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--text-accent)]" />
            南华全书研习总览
          </span>
          <span className="font-bold text-[var(--text-accent)]">{readPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--text-accent)] to-[var(--color-accent-gold,#d49b6a)] transition-all duration-700"
            style={{ width: `${readPercent}%` }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
          {chaptersMeta.map((ch) => {
            const isRead = stats.readChapters.includes(ch.id);
            return (
              <Link
                key={ch.id}
                href={`/chapters/${ch.id}`}
                title={`${ch.title}（${isRead ? "已阅" : "未阅"}）`}
                className={`w-3.5 h-3.5 rounded-xs transition-transform hover:scale-125 ${
                  isRead
                    ? "bg-[var(--text-accent)] ring-1 ring-[var(--text-accent)]/50"
                    : "bg-[var(--border-light)] hover:bg-[var(--border-strong)]"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* 三十三篇藏书印谱 */}
      <div className="space-y-10">
        {CATEGORY_SECTIONS.map((sec) => {
          const chapters = chaptersMeta.filter((c) => c.category === sec.key);
          const readInSec = chapters.filter((c) => stats.readChapters.includes(c.id)).length;

          return (
            <div key={sec.key} className="space-y-4">
              {/* 分组题头 */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-2 border-b border-[var(--border-color)] gap-1">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-base sm:text-lg font-bold font-serif text-[var(--text-primary)]">
                    {sec.title}
                  </h2>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {sec.desc}
                  </span>
                </div>
                <div className="text-xs font-serif text-[var(--text-muted)]">
                  研读进度：{readInSec} / {chapters.length} 篇
                </div>
              </div>

              {/* 篇章印谱网格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {chapters.map((ch) => {
                  const isRead = stats.readChapters.includes(ch.id);
                  const lastRead = stats.chapterLastReadMap[ch.id];

                  if (isRead) {
                    return (
                      <Link
                        key={ch.id}
                        href={`/chapters/${ch.id}`}
                        className="group relative p-3.5 rounded-xl border border-[var(--text-accent)]/40 bg-[var(--bg-card)] hover:border-[var(--text-accent)] hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-[var(--text-muted)] font-serif block">
                              第 {ch.order} 篇 · {ch.passageCount} 节
                            </span>
                            <div className="font-serif font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--text-accent)] transition-colors mt-0.5">
                              {ch.title}
                            </div>
                          </div>
                          {/* 右上角朱砂印章 */}
                          <span
                            className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-serif font-bold border border-[var(--accent-vermilion,#b83b2e)] text-[var(--accent-vermilion,#b83b2e)] bg-[var(--accent-vermilion,#b83b2e)]/5 shadow-xs shrink-0"
                            aria-label="已阅"
                          >
                            已阅
                          </span>
                        </div>

                        <div className="mt-3 pt-2 border-t border-[var(--border-light)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                          <span>最后研读：{lastRead ?? "已记录"}</span>
                          <span className="text-[var(--text-accent)] font-serif group-hover:translate-x-0.5 transition-transform">
                            重温 →
                          </span>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={ch.id}
                      href={`/chapters/${ch.id}`}
                      className="group relative p-3.5 rounded-xl border border-dashed border-[var(--border-strong)]/60 bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-card)] hover:border-[var(--text-accent)]/80 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] font-serif block">
                          第 {ch.order} 篇 · {ch.passageCount} 节
                        </span>
                        <div className="font-serif font-medium text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors mt-0.5">
                          {ch.title}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] mt-1.5 line-clamp-1">
                          {ch.summary}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[var(--border-light)]/60 flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-muted)] font-serif">虚位以待</span>
                        <span className="text-[var(--text-accent)] font-serif font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          展卷 →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 卷末题跋 */}
      {stats.lastReadDate && (
        <div className="mt-12 text-center text-xs text-[var(--text-muted)] font-serif">
          最近一次展卷于{" "}
          <span className="text-[var(--text-accent)] font-medium">
            {stats.lastReadDate}
          </span>
          ，学而不已，阖棺乃止。
        </div>
      )}
    </div>
  );
}
