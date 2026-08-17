/**
 * kaoju 纯函数与类型（无数据 import，客户端安全）
 * 数据查询请用 @/lib/kaoju（仅服务端组件使用）
 */

export interface KaojuCitation {
  author: string;
  quote: string;
  source: string;
}

export interface KaojuEntry {
  seq: number;
  seg: number;
  term: string;
  explanation: string;
  citations: KaojuCitation[];
}

export type KaojuMap = Record<string, KaojuEntry[]>;
export type PassageKaojuMap = Record<string, Record<string, KaojuEntry[]>>;

/** 归一化词条：去注音括号、标点、空白 */
export function normalizeTerm(s: string): string {
  return s
    .replace(/[（(][^）)]*[）)]/g, "")
    .replace(/[\s　，。、；：！？·—…""''“”‘’〈〉《》「」『』『』（）]/g, "");
}

/** 在篇目考据列表中查找与 term 匹配的条目（先精确、后包含） */
export function findKaoju(list: KaojuEntry[] | undefined, term: string): KaojuEntry | null {
  if (!list || !term) return null;
  const nt = normalizeTerm(term);
  if (!nt) return null;
  const exact = list.find((e) => normalizeTerm(e.term) === nt);
  if (exact) return exact;
  const cand = list.find((e) => {
    const et = normalizeTerm(e.term);
    return !!et && et.length >= 2 && (et.includes(nt) || nt.includes(et));
  });
  return cand || null;
}
