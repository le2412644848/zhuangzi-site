"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { chaptersMeta, passageNumber } from "@/data/chapters/metadata";
import type { Chapter, Passage } from "@/lib/chapters";

// 显式按章映射，避免模板字符串动态 import（会让 Turbopack 把 33 章全文
// 打成一个 ~1MB chunk，首页即全量下载）。显式映射 → 每章独立分包，
// 运行时只拉取当天命中的那一章（约 20~60KB）。
const chapterLoaders: Record<string, () => Promise<{ default: Chapter }>> = {
  "01-xiaoyao-you": () => import("@/data/chapters/01-xiaoyao-you.json"),
  "02-qiwu-lun": () => import("@/data/chapters/02-qiwu-lun.json"),
  "03-yangsheng-zhu": () => import("@/data/chapters/03-yangsheng-zhu.json"),
  "04-renjian-shi": () => import("@/data/chapters/04-renjian-shi.json"),
  "05-dechong-fu": () => import("@/data/chapters/05-dechong-fu.json"),
  "06-dazong-shi": () => import("@/data/chapters/06-dazong-shi.json"),
  "07-yingdi-wang": () => import("@/data/chapters/07-yingdi-wang.json"),
  "08-pianmu": () => import("@/data/chapters/08-pianmu.json"),
  "09-mati": () => import("@/data/chapters/09-mati.json"),
  "10-quqie": () => import("@/data/chapters/10-quqie.json"),
  "11-zaiyou": () => import("@/data/chapters/11-zaiyou.json"),
  "12-tiandi": () => import("@/data/chapters/12-tiandi.json"),
  "13-tiandao": () => import("@/data/chapters/13-tiandao.json"),
  "14-tianyun": () => import("@/data/chapters/14-tianyun.json"),
  "15-keyi": () => import("@/data/chapters/15-keyi.json"),
  "16-shanxing": () => import("@/data/chapters/16-shanxing.json"),
  "17-qiushui": () => import("@/data/chapters/17-qiushui.json"),
  "18-zhile": () => import("@/data/chapters/18-zhile.json"),
  "19-dasheng": () => import("@/data/chapters/19-dasheng.json"),
  "20-shanmu": () => import("@/data/chapters/20-shanmu.json"),
  "21-tianzifang": () => import("@/data/chapters/21-tianzifang.json"),
  "22-zhibeiyou": () => import("@/data/chapters/22-zhibeiyou.json"),
  "23-gengsangchu": () => import("@/data/chapters/23-gengsangchu.json"),
  "24-xuwugui": () => import("@/data/chapters/24-xuwugui.json"),
  "25-zeyang": () => import("@/data/chapters/25-zeyang.json"),
  "26-waiwu": () => import("@/data/chapters/26-waiwu.json"),
  "27-yuyan": () => import("@/data/chapters/27-yuyan.json"),
  "28-rangwang": () => import("@/data/chapters/28-rangwang.json"),
  "29-daozhi": () => import("@/data/chapters/29-daozhi.json"),
  "30-shuojian": () => import("@/data/chapters/30-shuojian.json"),
  "31-yufu": () => import("@/data/chapters/31-yufu.json"),
  "32-lieyukou": () => import("@/data/chapters/32-lieyukou.json"),
  "33-tianxia": () => import("@/data/chapters/33-tianxia.json"),
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function todaySeed(): number {
  const today = new Date().toISOString().slice(0, 10);
  let seed = 0;
  for (let i = 0; i < today.length; i++) {
    seed = ((seed << 5) - seed) + today.charCodeAt(i);
    seed = seed & seed;
  }
  return Math.abs(seed);
}

export default function DailyPassage() {
  const [daily, setDaily] = useState<{ chapterTitle: string; chapterId: string; passage: Passage } | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const rng = seededRandom(todaySeed());

      // Pick chapter deterministically, then a passage within it
      const chapterMeta = chaptersMeta[Math.floor(rng() * chaptersMeta.length)]!;
      const loader = chapterLoaders[chapterMeta.id];
      if (!loader) return;

      // 只按需加载命中章节（JSON 动态 import 返回 { default: ... }）
      const mod = await loader();
      const fullChapter = (mod.default ?? (mod as unknown as Chapter)) as Chapter;

      if (cancelled) return;

      const passage = fullChapter.passages[Math.floor(rng() * fullChapter.passages.length)]!;

      setDaily({
        chapterTitle: fullChapter.title,
        chapterId: fullChapter.id,
        passage,
      });
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (!daily) return null;

  const pNum = passageNumber(daily.chapterId, daily.passage.id);

  return (
    <section
      className="px-4 sm:px-6 lg:px-8 mb-20 animate-fade-in-up"
      style={{ animationDelay: "0.15s" }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="daily-passage-book">
          {/* 缎带书签 */}
          <span className="ribbon-bookmark" aria-hidden="true">
            每日一庄
          </span>

          {/* 移动端精致横向线装书签头（篇名 + 节号 + 日期 + 装饰虚线分割） */}
          <div className="sm:hidden flex items-center justify-between pb-3 mb-4 border-b border-dashed border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--text-accent)] tracking-[0.12em]">
                {daily.chapterTitle}
              </span>
              {pNum && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--hover-bg)] text-[var(--text-muted)] font-serif">
                  第{pNum}节
                </span>
              )}
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              {new Date().toLocaleDateString("zh-CN", {
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          {/* 桌面端页眉：篇名 + 日期 */}
          <div className="hidden sm:flex items-center justify-between mb-5">
            <span className="text-xs font-semibold text-[var(--text-accent)] tracking-[0.12em]">
              {daily.chapterTitle}{pNum ? ` · 第${pNum}节` : ""}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              {new Date().toLocaleDateString("zh-CN", {
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          {/* 书页主体：移动端纵向全宽，桌面端左竖排古典提字 + 右展开正文 */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-7">
            {/* 桌面端左竖排古典提字 */}
            <div className="hidden sm:block vertical-extract flex-none" aria-hidden="true">
              <p className="font-serif">
                {(() => {
                  // 竖排取 4 的倍数（列高 6 字 × 4 列 = 24 字），避免末列孤字悬挂
                  const n = Math.min(24, Math.floor(daily.passage.original.length / 4) * 4);
                  return daily.passage.original.slice(0, n) + (daily.passage.original.length > n ? "…" : "");
                })()}
              </p>
            </div>

            <div className="flex-1 min-w-0">
              <blockquote className="text-sm sm:text-base text-[var(--text-primary)] leading-[1.9] tracking-wide font-serif">
                &ldquo;{daily.passage.original.slice(0, 120)}
                {daily.passage.original.length > 120 ? "…" : ""}&rdquo;
              </blockquote>

              {showTranslation && (
                <div className="mt-4 p-3.5 sm:p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-light)]">
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] italic leading-relaxed">
                    {daily.passage.translation.slice(0, 140)}
                    {daily.passage.translation.length > 140 ? "…" : ""}
                  </p>
                </div>
              )}

              {/* 底部操作栏：响应式换行排布 */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className="text-xs font-medium text-[var(--text-accent)] hover:text-[var(--color-accent-deep)] transition-colors"
                >
                  {showTranslation ? "收起译文" : "查看白话译文"}
                </button>
                <Link
                  href={`/chapters/${daily.chapterId}`}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-accent)] transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>{daily.chapterTitle}{pNum ? ` · 第${pNum}节` : ""} · 阅读全文</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
