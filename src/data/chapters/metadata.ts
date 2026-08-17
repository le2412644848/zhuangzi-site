/**
 * Lightweight chapter metadata — id, title, category, order, summary, passage count.
 * ~7KB total vs ~656KB for full data. Import this in pages that only need listing info.
 */
import metadata from "./metadata.json";

export interface ChapterMeta {
  id: string;
  title: string;
  category: string;
  order: number;
  summary: string;
  conclusion?: string;
  passageCount: number;
  /** 各 passage 的 id 列表（按序），用于把 passageId 映射为「第 N 节」 */
  passageIds?: string[];
}

/** 计算某 passage 在篇内的节号（1-based），查不到返回 null */
export function passageNumber(chapterId: string, passageId: string): number | null {
  const meta = chaptersMeta.find((m) => m.id === chapterId);
  const idx = meta?.passageIds?.indexOf(passageId) ?? -1;
  return idx >= 0 ? idx + 1 : null;
}

export const chaptersMeta: ChapterMeta[] = metadata;
