import Link from "next/link";

import type { Passage, WordAnnotation } from "@/lib/chapters";
import { findKaoju, type KaojuEntry } from "@/lib/kaoju-utils";
import { renderEmphasis } from "@/lib/markup";

import AnnotationPanel from "./AnnotationPanel";
import ConceptTag from "./ConceptTag";
import KaojuSection from "./KaojuSection";
import PassageToolbar from "./PassageToolbar";
import PinyinSlot from "./PinyinSlot";
import TranslationCompare from "./TranslationCompare";
import WordTooltip from "./WordTooltip";

/** 原文内嵌名句标记（数据来自 quotes.json，章节页服务端构建期注入） */
export interface PassageQuote {
  id: string;
  text: string;
  theme: string;
  explanation: string;
}

/**
 * 名句在原文中的定位：返回应在原文中标记（includes 可命中）的切片。
 *
 * 两级匹配：
 * 1. 去句末标点后直接 includes —— 名句数据以句号收尾、原文常为逗号接续；
 * 2. 去全部标点的规范化匹配 —— 原文常用『』「」与异体断句
 *   （如「臣之所好者，道也；」vs 引文「臣之所好者道也，」），
 *    命中后回映射为原文切片，标记渲染保持原文原貌。
 * 两级都失败（引文系节述而非原文连续片段）返回 null，该句不做内嵌标记。
 */
const PUNCT_ALL = /[。？！，、；：．''""「」『』（）()《》〈〉…—\-\.!\?,;:?\s]/;

export function locateQuoteInOriginal(quoteText: string, original: string): string | null {
  const trimmed = quoteText.replace(/[。？！，、；：．.!?,;:]+$/u, "");
  if (trimmed && original.includes(trimmed)) return trimmed;

  const normKey = Array.from(trimmed).filter((c) => !PUNCT_ALL.test(c)).join("");
  if (!normKey) return null;

  let norm = "";
  const map: number[] = [];
  for (let i = 0; i < original.length; i++) {
    const c = original[i];
    if (c === undefined || PUNCT_ALL.test(c)) continue;
    norm += c;
    map.push(i);
  }
  const idx = norm.indexOf(normKey);
  if (idx < 0) return null;
  const start = map[idx];
  const end = map[idx + normKey.length - 1];
  if (start === undefined || end === undefined) return null;
  return original.slice(start, end + 1);
}

interface PassageViewProps {
  passage: Passage;
  chapterId: string;
  /** 篇名（收藏列表展示用；缺省回退 chapterId） */
  chapterTitle?: string;
  /** 段落序号（从 1 开始） */
  passageNum?: number | undefined;
  defaultExpanded?: boolean;
  /** 本篇陈鼓应考据数据（可选） */
  kaoju?: KaojuEntry[];
  /** 当前 passage 的段落级考据（陈鼓应注，可选） */
  passageKaoju?: KaojuEntry[];
  /** 当前 passage 的段落级考据（方勇注，可选） */
  passageKaojuFang?: KaojuEntry[];
  /** 当前 passage 的名句（仅含 text 能在 original 中定位的条目） */
  quotes?: PassageQuote[] | undefined;
}

/**
 * 把原文切成「普通文本 / 可加注词」的片段序列，并分离出**无法内联**的注释。
 *
 * 背景：原实现只做内联匹配，`original.indexOf(term)` 找不到就直接丢弃。
 * 实测 1049 条注释中有 29 条属于此类 —— 它们是主题性词条
 * （庖丁解牛、庄周梦蝶、朝三暮四、游刃有余、浑沌之死…）或与原文标点
 * 不完全一致的引句，并非错误数据，但在页面上永远不显示，
 * 等于 2.8% 的人工整理成果被静默丢掉。
 * 现在把它们回收到段落下方的「要义」区展示。
 */
export function splitAnnotations(original: string, annotations?: WordAnnotation[]) {
  type Segment = { text: string; annotated: boolean; ann?: WordAnnotation };
  if (!annotations || annotations.length === 0) {
    return { segments: [{ text: original, annotated: false }] as Segment[], unmatched: [] as WordAnnotation[] };
  }

  const inlineable = annotations.filter((a) => original.includes(a.term));
  const unmatched = annotations.filter((a) => !original.includes(a.term));

  const sorted = [...inlineable].sort((a, b) => b.term.length - a.term.length);
  const segments: Segment[] = [];
  let remaining = original;

  while (remaining.length > 0) {
    let bestIdx = -1;
    let best: WordAnnotation | undefined;
    // 取「最靠前」的匹配，避免长词优先导致前面的短词被跳过
    for (const ann of sorted) {
      const idx = remaining.indexOf(ann.term);
      if (idx >= 0 && (bestIdx === -1 || idx < bestIdx)) {
        bestIdx = idx;
        best = ann;
      }
    }
    if (bestIdx === -1 || !best) {
      segments.push({ text: remaining, annotated: false });
      break;
    }
    if (bestIdx > 0) segments.push({ text: remaining.slice(0, bestIdx), annotated: false });
    segments.push({ text: best.term, annotated: true, ann: best });
    remaining = remaining.slice(bestIdx + best.term.length);
  }

  return { segments, unmatched };
}

/** 收集段落内全部需要查考据的词：内联注释词 + 注疏「逐字注」里的『…』引词 */
function collectKaojuTerms(passage: Passage): string[] {
  const terms = (passage.annotations ?? []).map((a) => a.term);
  if (passage.commentary) {
    for (const m of passage.commentary.matchAll(/『([^』]+)』/g)) {
      const term = m[1];
      if (term) terms.push(term);
    }
  }
  return terms;
}

/**
 * 构建期把「词 → 命中考据条目」查好，只把命中的结果传进客户端岛，
 * 而不是整篇考据数组（对齐物论这类长篇，数组约 5 MB，命中条目通常只有
 * 几十条，这是章节页 RSC 载荷减重的关键一步）。
 */
function buildKaojuLookup(kaoju: KaojuEntry[] | undefined, terms: string[]): Record<string, KaojuEntry> {
  const lookup: Record<string, KaojuEntry> = {};
  if (!kaoju) return lookup;
  for (const t of terms) {
    if (lookup[t]) continue;
    const hit = findKaoju(kaoju, t);
    if (hit) lookup[t] = hit;
  }
  return lookup;
}

/** 名句区间标记：名句在原文里常含被注释的词（鲲、鹏、冥灵…），
 * splitAnnotations 会把这些词切成 WordTooltip 片段，名句因此
 * 不在任何单个普通片段内连续 —— 不能按「片段内 indexOf」匹配。
 * 正确做法：先算名句在全文中的 [start, end) 区间，再对每个普通片段
 * 求交集分段标记（被注释词打断的部分自然分成多段，各自可点跳转）。
 * 不少注释词条本身就是整句名句 —— 这种词条由 WordTooltip 的
 * quoteHalo 叠加高亮，保证每条可定位名句都有可见标记。
 */
const HAN_IN_PART = /[\u4E00-\u9FFF]/;

function quoteRangesOf(original: string, quotes: PassageQuote[] | undefined) {
  const ranges: { start: number; end: number; quote: PassageQuote }[] = [];
  if (!quotes) return ranges;
  for (const q of quotes) {
    const idx = original.indexOf(q.text);
    if (idx >= 0) ranges.push({ start: idx, end: idx + q.text.length, quote: q });
  }
  return ranges;
}

/** 把普通片段按名句区间切成「命中 / 未命中」子段 */
function intersectQuotes(
  text: string,
  segStart: number,
  ranges: { start: number; end: number; quote: PassageQuote }[]
) {
  type Part = { text: string; quote?: PassageQuote };
  const parts: Part[] = [];
  let pos = 0;
  while (pos < text.length) {
    const abs = segStart + pos;
    const hit = ranges
      .filter((r) => abs >= r.start && abs < r.end)
      .sort((a, b) => a.start - b.start)[0];
    if (hit) {
      const take = Math.min(hit.end - abs, text.length - pos);
      parts.push({ text: text.slice(pos, pos + take), quote: hit.quote });
      pos += take;
    } else {
      const nextStart = ranges.find((r) => r.start > abs)?.start ?? text.length + segStart;
      const take = Math.min(nextStart - abs, text.length - pos);
      parts.push({ text: text.slice(pos, pos + take) });
      pos += take;
    }
  }
  return parts;
}

/** Render original text with annotation tooltips embedded（服务端直出） */
function AnnotatedText({ original, annotations, chapterId, quotes }: { original: string; annotations?: WordAnnotation[] | undefined; chapterId: string; quotes?: PassageQuote[] | undefined }) {
  const { segments } = splitAnnotations(original, annotations);
  const quoteRanges = quoteRangesOf(original, quotes);

  // 各片段在 original 中的起始偏移（splitAnnotations 按序连续切分；
  // 用 reduce 而非循环内重赋值 —— react-hooks/immutability 禁止渲染后重赋）
  const segWithOffset = segments.reduce<{ seg: (typeof segments)[number]; start: number }[]>(
    (acc, seg) => {
      const prev = acc[acc.length - 1];
      const start = prev ? prev.start + prev.seg.text.length : 0;
      acc.push({ seg, start });
      return acc;
    },
    []
  );

  return (
    <>
      {segWithOffset.map(({ seg, start }, i) => {
        if (seg.annotated && seg.ann) {
          // 词条与名句区间重叠（含汉字）→ 加光晕底色。
          // 不少注释词条本身就是整句名句（如「小知不及大知，小年不及大年」），
          // 若不在此判定，这些名句会因整句被切成 tooltip 而完全无标记。
          const halo =
            quoteRanges.length > 0 &&
            intersectQuotes(seg.text, start, quoteRanges).some((p) => p.quote && HAN_IN_PART.test(p.text));
          return (
            <WordTooltip key={i} term={seg.ann.term} text={seg.ann.text} chapterId={chapterId} quoteHalo={halo}>{seg.text}</WordTooltip>
          );
        }
        if (quoteRanges.length === 0) {
          return <span key={i}>{seg.text}</span>;
        }
        return intersectQuotes(seg.text, start, quoteRanges).map((p, j) =>
          // 名句被逐字注切断后，剩余片段可能只剩标点（如「，」夹在两个
          // WordTooltip 之间）——纯标点不做标记，否则出现「标点高亮」的怪相
          p.quote && HAN_IN_PART.test(p.text) ? (
            <Link
              key={`${i}-${j}`}
              href={`/quotes#${p.quote.id}`}
              prefetch={false}
              className="quote-mark"
              title={`名句 · ${p.quote.theme}：${p.quote.explanation}`}
            >
              {p.text}
            </Link>
          ) : (
            <span key={`${i}-${j}`}>{p.text}</span>
          )
        );
      })}
    </>
  );
}

/** 无法内联的主题性词条 —— 以「要义」列表呈现，避免内容被丢弃 */
function ThematicNotes({ notes }: { notes: WordAnnotation[] }) {
  if (notes.length === 0) return null;
  return (
    <div className="mb-5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)]/50 p-3">
      <h3 className="text-xs font-semibold text-[var(--text-accent)] tracking-[0.08em] mb-2">
        要义
      </h3>
      <dl className="space-y-1.5">
        {notes.map((n, i) => (
          <div key={i} className="text-xs leading-relaxed">
            <dt className="inline font-medium text-[var(--text-accent)]">「{n.term}」</dt>
            <dd className="inline text-[var(--text-primary)]"> {n.text.replace(/\*\*/g, "")}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Format commentary with 逐字注/章旨 split（服务端直出） */
function CommentaryBlock({ commentary, kaojuLookup }: { commentary?: string; kaojuLookup: Record<string, KaojuEntry> }) {
  // 注疏正文经 renderEmphasis 转义后再还原 **粗体**，不再直接注入原串
  const renderHtml = renderEmphasis;

  if (!commentary) return null;

  const parts = (() => {
    const zhuzi = commentary.match(/\u3010逐字注\u3011\n\n([\s\S]*?)(?:\n\n\u3010章旨\u3011|$)/);
    const zhangzhi = commentary.match(/\u3010章旨\u3011\n\n([\s\S]*?)$/);
    return {
      // 正则组在 match 成功时必然存在（`!` 断言）
      zhuzi: zhuzi ? zhuzi[1]!.trim() : null,
      zhangzhi: zhangzhi ? zhangzhi[1]!.trim() : null,
      rest: (!zhuzi && !zhangzhi) ? commentary : null,
    };
  })();

  return (
    <div className="space-y-4 commentary-text">
      {parts.rest && <p className="reading-prose" dangerouslySetInnerHTML={{ __html: renderHtml(parts.rest) }} />}
      {parts.zhuzi && (
        <div>
          <h3 className="text-xs font-semibold text-[var(--text-accent)] mb-2 tracking-[0.08em]">逐字注</h3>
          <div className="text-sm text-[var(--text-primary)] leading-relaxed space-y-2">
            {parts.zhuzi.split(/\n\n/).map((block, i) => {
              const term = block.match(/^『([^』]+)』/)?.[1];
              const kj = term ? kaojuLookup[term] ?? null : null;
              return (
                <div key={i}>
                  <p dangerouslySetInnerHTML={{ __html: renderHtml(block) }} />
                  {kj && (kj.explanation || kj.citations.length > 0) && (
                    <p className="mt-0.5 pl-3 border-l-2 border-[var(--border-light)] text-xs text-[var(--text-muted)] leading-relaxed">
                      <span className="font-medium text-[var(--text-secondary)]">训诂：</span>
                      {kj.explanation}
                      {kj.citations.length > 0 && (
                        <span className="text-[var(--text-muted)]">（{kj.citations.map((c) => c.author).slice(0, 2).join("、")}
                          {kj.citations.length > 2 ? `等${kj.citations.length}家` : ""}）</span>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {parts.zhangzhi && (
        <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
          <h3 className="text-xs font-semibold text-[var(--text-accent)] mb-2 tracking-[0.08em]">章旨</h3>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed" dangerouslySetInnerHTML={{ __html: renderHtml(parts.zhangzhi) }} />
        </div>
      )}
    </div>
  );
}

/**
 * 段落视图 —— 服务端组件（章节页首屏减重 v3）。
 *
 * 本组件不持有任何状态、**不经过任何 client 祖先**：原文/译文/注疏
 * 在服务端直出为 HTML；只有叶子位置的客户端岛（工具条 PassageToolbar、
 * 逐字注浮层 WordTooltip、拼音槽 PinyinSlot、多译本对照、段落级考据
 * KaojuSection、批注面板、概念标签）携带各自标量 props。
 * 译本对照与考据全文由构建脚本拆成按篇 JSON（/data/…），用户展开折叠区
 * 时才 fetch —— 首屏不再传输这两类大体积内容。
 * 分栏/拼音/批注的显示切换由工具条在 [data-passage-root] 上切 CSS 类实现。
 */
export default function PassageView({ passage, chapterId, chapterTitle, passageNum, kaoju, passageKaoju, passageKaojuFang, quotes }: PassageViewProps) {
  // 构建期：把「注释词 → 命中考据」查好，只用于注疏区训诂行的服务端直出
  // （WordTooltip 的训诂改由客户端按篇懒加载，不再进载荷）
  const kaojuLookup = buildKaojuLookup(kaoju, collectKaojuTerms(passage));

  // 分离出无法内联到原文的主题性注释，单独在「要义」区展示
  const thematicNotes = splitAnnotations(passage.original, passage.annotations).unmatched;

  const translationCount = (passage.translations?.length ?? 0) + 1;

  return (
    // 附加字面 group 类：globals.css 的 .group:hover > .passage-toolbar
    // 靠它显示工具条 —— Tailwind 命名分组 group/passage 是另一个 token，
    // CSS 的 .group 匹配不到它（存量 bug：桌面端 hover 工具条从不出现，
    // 仅触屏常驻与 focus-within 可救）
    <section className="group/passage group" data-passage-root>
      {/* 客户端岛：工具条（只接收标量 props，不包裹正文） */}
      <PassageToolbar
        chapterId={chapterId}
        passageId={passage.id}
        chapterTitle={chapterTitle}
        passageNum={passageNum}
      />

      <div className="passage-content">
        <div className="passage-grid">
          {/* Original */}
          <div className="original-block min-w-0">
            <div className="original-label text-[10px] font-medium text-[var(--text-muted)] tracking-[0.1em] uppercase mb-2">原文</div>
            <div className="annotated-original">
              <p className="original-text reading-prose leading-loose tracking-wide text-lg sm:text-xl">
                <AnnotatedText original={passage.original} annotations={passage.annotations} chapterId={chapterId} quotes={quotes} />
              </p>
            </div>
            {/* 拼音版原文（默认隐藏；切到 pinyin-on 时经 MutationObserver 挂载） */}
            <PinyinSlot />
          </div>
          {/* Translation */}
          <div className="translation-block min-w-0 border-l-2 border-[var(--border-light)] pl-4 sm:pl-6">
            <div className="translation-label text-[10px] font-medium text-[var(--text-muted)] tracking-[0.1em] uppercase mb-2">译文</div>
            <p className="translation-text reading-prose">
              {passage.translation}
            </p>
            <TranslationCompare chapterId={chapterId} passageId={passage.id} count={translationCount} />
          </div>
        </div>

        {/* Commentary */}
        {passage.commentary && (
          <div className="mb-5">
            <CommentaryBlock commentary={passage.commentary} kaojuLookup={kaojuLookup} />
          </div>
        )}

        {/* 无法内联的主题性注释（庖丁解牛、朝三暮四之类） */}
        <ThematicNotes notes={thematicNotes} />

        {/* 段落级注（陈鼓应 + 方勇，懒加载） */}
        <div className="mb-5">
          {passageKaoju && passageKaoju.length > 0 && (
            <KaojuSection title="陈鼓应注" chapterId={chapterId} passageId={passage.id} count={passageKaoju.length} kind="chen" />
          )}
          {passageKaojuFang && passageKaojuFang.length > 0 && (
            <KaojuSection title="方勇训诂" chapterId={chapterId} passageId={passage.id} count={passageKaojuFang.length} kind="fang" />
          )}
        </div>

        {/* Concept tags */}
        {passage.concepts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {passage.concepts.map((cid) => (
              <ConceptTag key={`${passage.id}-${cid}`} conceptId={cid} size="sm" />
            ))}
          </div>
        )}

        {/* 批注面板（默认隐藏；切到 annotation-on 时经 CSS 显示） */}
        <div className="annotation-panel">
          <AnnotationPanel chapterId={chapterId} passageId={passage.id} />
        </div>
      </div>
    </section>
  );
}
