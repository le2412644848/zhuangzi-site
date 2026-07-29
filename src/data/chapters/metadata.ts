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
}

export const chaptersMeta: ChapterMeta[] = metadata;
