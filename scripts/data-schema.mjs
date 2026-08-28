/**
 * 数据形状的 Zod 校验 Schema（构建期专用，仅 scripts/ 使用）。
 *
 * 背景（见 TODO 3.10）：全部 JSON 此前经 `as Chapter` / `as KaojuMap`
 * 这类**未校验断言**进入应用 —— 数据形状变化不会有编译错误，只会静默
 * 少内容。本 Schema 由 scripts/validate-data.mjs 在构建期 safeParse，
 * 零客户端成本（zod 只存在于 devDependencies，不进任何 bundle）。
 *
 * 注意：Schema 只校验「形状」（键、类型、必填），语义完整性
 * （顺序唯一、引用可达、编码损坏等）由 tests/data-integrity.test.ts 覆盖。
 */
import { z } from "zod";

export const WordAnnotation = z.object({
  term: z.string().min(1),
  text: z.string().min(1),
});

export const TranslationEntry = z.object({
  translator: z.string().min(1),
  text: z.string().min(1),
});

export const Passage = z.object({
  id: z.string().min(1),
  original: z.string().min(1),
  translation: z.string().min(1),
  commentary: z.string().optional(),
  annotations: z.array(WordAnnotation).optional(),
  concepts: z.array(z.string()),
  translations: z.array(TranslationEntry).optional(),
});

export const Chapter = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  order: z.number().int().positive(),
  summary: z.string().min(1),
  intro: z.string().optional(),
  conclusion: z.string().optional(),
  passages: z.array(Passage).min(1),
});

export const Concept = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().optional(),
  relatedChapters: z.array(z.string()),
  relatedConcepts: z.array(z.string()),
});

export const KaojuCitation = z.object({
  author: z.string().min(1),
  quote: z.string().min(1),
  source: z.string(),
});

export const KaojuEntry = z.object({
  seq: z.number().int().nonnegative(),
  seg: z.number().int().nonnegative(),
  // 允许空串：既有数据中存在未整理的空 term 条目（语义完整性由
  // tests/data-integrity.test.ts 校验，这里只保证形状）
  term: z.string(),
  explanation: z.string(),
  citations: z.array(KaojuCitation),
});

export const KaojuMap = z.record(z.string(), z.array(KaojuEntry));
export const PassageKaojuMap = z.record(z.string(), z.record(z.string(), z.array(KaojuEntry)));

export const Quote = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  chapter: z.string().min(1),
  chapterId: z.string().min(1),
  passageId: z.string().min(1),
  theme: z.string(),
  explanation: z.string(),
  // 2026-08-22 起为必填（scripts/enrich-quotes.mjs 已全量补齐 44 条）
  translation: z.string().min(1),
  usage: z.string().min(1),
});

export const Fable = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  chapter: z.string().min(1),
  chapterId: z.string().min(1),
  passageId: z.string(),
  summary: z.string(),
  moral: z.string(),
  keywords: z.array(z.string()),
});

export const RelatedPassage = z.object({
  chapterId: z.string().min(1),
  chapterTitle: z.string().min(1),
  passageId: z.string().min(1),
  original: z.string().min(1),
});

export const ConcordanceWord = z.object({
  word: z.string().min(1),
  count: z.number().int().nonnegative(),
  occurrences: z.array(
    z.object({
      chapterId: z.string(),
      passageId: z.string(),
    })
  ),
});

export const TimelineEntry = z.object({
  year: z.string(),
  yearSort: z.number(),
  event: z.string().min(1),
  description: z.string(),
  category: z.string(),
});

export const MapLocation = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  desc: z.string(),
  chapter: z.string(),
  event: z.string(),
});

export const ReadingRoute = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  chapters: z.array(z.string()),
  color: z.string(),
});
