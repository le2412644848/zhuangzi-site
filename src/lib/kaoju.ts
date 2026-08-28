/**
 * 考据/训诂数据查询（含 4 个 JSON 数据 import，约 5MB）
 * ⚠️ 仅供服务端组件使用 —— 客户端组件请用 @/lib/kaoju-utils
 * 硬约束：import "server-only" 会在客户端 bundle 引入本模块时报构建错误；
 * ESLint no-restricted-imports 同时禁止 src/** 引用本模块与考据 JSON。
 */
import "server-only";

import kaojuData from "@/data/kaoju.json";
import kaojuFangData from "@/data/kaoju_fang.json";
import passageKaojuData from "@/data/passage_kaoju.json";
import passageKaojuFangData from "@/data/passage_kaoju_fang.json";
import type { KaojuEntry, KaojuMap, PassageKaojuMap } from "@/lib/kaoju-utils";

export type { KaojuCitation, KaojuEntry, KaojuMap, PassageKaojuMap } from "@/lib/kaoju-utils";
export { findKaoju,normalizeTerm } from "@/lib/kaoju-utils";

/** 按篇取考据列表（陈鼓应版） */
export function getKaojuByChapter(chapterId: string): KaojuEntry[] {
  const key = chapterId.split("-")[0] ?? chapterId;
  return (kaojuData as KaojuMap)[key] ?? [];
}

/** 按篇取训诂列表（方勇版） */
export function getKaojuFangByChapter(chapterId: string): KaojuEntry[] {
  const key = chapterId.split("-")[0] ?? chapterId;
  return (kaojuFangData as KaojuMap)[key] ?? [];
}

/** 取某个 passage 的段落级考据（陈鼓应注，覆盖全部段落） */
export function getPassageKaoju(chapterId: string, passageId: string): KaojuEntry[] {
  const key = chapterId.split("-")[0] ?? chapterId;
  const byPassage = (passageKaojuData as PassageKaojuMap)[key];
  return byPassage?.[passageId] ?? [];
}

/** 取整篇的 passage→考据 映射（陈鼓应版） */
export function getPassageKaojuMap(chapterId: string): Record<string, KaojuEntry[]> {
  const key = chapterId.split("-")[0] ?? chapterId;
  return (passageKaojuData as PassageKaojuMap)[key] ?? {};
}

/** 取整篇的 passage→考据 映射（方勇版） */
export function getPassageKaojuFangMap(chapterId: string): Record<string, KaojuEntry[]> {
  const key = chapterId.split("-")[0] ?? chapterId;
  return (passageKaojuFangData as PassageKaojuMap)[key] ?? {};
}
