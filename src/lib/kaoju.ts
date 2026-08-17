/**
 * 考据/训诂数据查询（含 4 个 JSON 数据 import，约 5MB）
 * ⚠️ 仅供服务端组件使用 —— 客户端组件请用 @/lib/kaoju-utils
 */
import kaojuData from "@/data/kaoju.json";
import kaojuFangData from "@/data/kaoju_fang.json";
import passageKaojuData from "@/data/passage_kaoju.json";
import passageKaojuFangData from "@/data/passage_kaoju_fang.json";
import type { KaojuEntry, KaojuMap, PassageKaojuMap } from "@/lib/kaoju-utils";

export type { KaojuEntry, KaojuCitation, KaojuMap, PassageKaojuMap } from "@/lib/kaoju-utils";
export { normalizeTerm, findKaoju } from "@/lib/kaoju-utils";

/** 按篇取考据列表（陈鼓应版） */
export function getKaojuByChapter(chapterId: string): KaojuEntry[] {
  const key = chapterId.split("-")[0];
  return (kaojuData as KaojuMap)[key] ?? [];
}

/** 按篇取训诂列表（方勇版） */
export function getKaojuFangByChapter(chapterId: string): KaojuEntry[] {
  const key = chapterId.split("-")[0];
  return (kaojuFangData as KaojuMap)[key] ?? [];
}

/** 取某个 passage 的段落级考据（陈鼓应注，覆盖全部段落） */
export function getPassageKaoju(chapterId: string, passageId: string): KaojuEntry[] {
  const key = chapterId.split("-")[0];
  const byPassage = (passageKaojuData as PassageKaojuMap)[key];
  return byPassage?.[passageId] ?? [];
}

/** 取整篇的 passage→考据 映射（陈鼓应版） */
export function getPassageKaojuMap(chapterId: string): Record<string, KaojuEntry[]> {
  const key = chapterId.split("-")[0];
  return (passageKaojuData as PassageKaojuMap)[key] ?? {};
}

/** 取整篇的 passage→考据 映射（方勇版） */
export function getPassageKaojuFangMap(chapterId: string): Record<string, KaojuEntry[]> {
  const key = chapterId.split("-")[0];
  return (passageKaojuFangData as PassageKaojuMap)[key] ?? {};
}
