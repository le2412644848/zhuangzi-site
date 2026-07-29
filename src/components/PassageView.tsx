"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import type { Passage, WordAnnotation } from "@/lib/chapters";
import ConceptTag from "./ConceptTag";
import AnnotationPanel from "./AnnotationPanel";
import WordTooltip from "./WordTooltip";
import { useReadingMode } from "./ReadingModeProvider";
import { toggleBookmark, isBookmarked } from "@/lib/annotations";
import TranslationCompare from "./TranslationCompare";

const PinyinAnnotator = dynamic(() => import("./PinyinAnnotator"), { ssr: false });

interface PassageViewProps {
  passage: Passage;
  chapterId: string;
  defaultExpanded?: boolean;
}

/** Render original text with annotation tooltips embedded */
function AnnotatedText({ original, annotations }: { original: string; annotations?: WordAnnotation[] }) {
  const segments = useMemo(() => {
    if (!annotations || annotations.length === 0) return [{ text: original, annotated: false }];
    const sorted = [...annotations].sort((a, b) => b.term.length - a.term.length);
    const result: { text: string; annotated: boolean; ann?: WordAnnotation }[] = [];
    let remaining = original;
    while (remaining.length > 0) {
      let found = false;
      for (const ann of sorted) {
        const idx = remaining.indexOf(ann.term);
        if (idx >= 0) {
          if (idx > 0) result.push({ text: remaining.slice(0, idx), annotated: false });
          result.push({ text: ann.term, annotated: true, ann });
          remaining = remaining.slice(idx + ann.term.length);
          found = true;
          break;
        }
      }
      if (!found) { result.push({ text: remaining, annotated: false }); break; }
    }
    return result;
  }, [original, annotations]);

  return (
    <>
      {segments.map((seg, i) =>
        seg.annotated && seg.ann ? (
          <WordTooltip key={i} term={seg.ann.term} text={seg.ann.text}>{seg.text}</WordTooltip>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}

/** Format commentary with 逐字注/章旨 split */
function CommentaryBlock({ commentary }: { commentary?: string }) {
  if (!commentary) return null;

  const renderHtml = (text: string) => text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  const parts = useMemo(() => {
    const zhuzi = commentary.match(/\u3010逐字注\u3011\n\n([\s\S]*?)(?:\n\n\u3010章旨\u3011|$)/);
    const zhangzhi = commentary.match(/\u3010章旨\u3011\n\n([\s\S]*?)$/);
    return {
      zhuzi: zhuzi ? zhuzi[1].trim() : null,
      zhangzhi: zhangzhi ? zhangzhi[1].trim() : null,
      rest: (!zhuzi && !zhangzhi) ? commentary : null,
    };
  }, [commentary]);

  return (
    <div className="space-y-4 commentary-text">
      {parts.rest && <p className="reading-prose" dangerouslySetInnerHTML={{ __html: renderHtml(parts.rest) }} />}
      {parts.zhuzi && (
        <div>
          <h4 className="text-xs font-semibold text-[var(--text-accent)] mb-2 tracking-[0.08em]">逐字注</h4>
          <div className="text-sm text-[var(--text-primary)] leading-relaxed space-y-2">
            {parts.zhuzi.split(/\n\n/).map((block, i) => (<p key={i} dangerouslySetInnerHTML={{ __html: renderHtml(block) }} />))}
          </div>
        </div>
      )}
      {parts.zhangzhi && (
        <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
          <h4 className="text-xs font-semibold text-[var(--text-accent)] mb-2 tracking-[0.08em]">章旨</h4>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed" dangerouslySetInnerHTML={{ __html: renderHtml(parts.zhangzhi) }} />
        </div>
      )}
    </div>
  );
}

export default function PassageView({ passage, chapterId, defaultExpanded = true }: PassageViewProps) {
  const [showTools, setShowTools] = useState(false);
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { immersive, toggle: toggleImmersive } = useReadingMode();

  const togglePinyin = () => setShowPinyin(!showPinyin);

  useEffect(() => { setBookmarked(isBookmarked(chapterId, passage.id)); }, [chapterId, passage.id]);

  const handleBookmark = useCallback(() => {
    const added = toggleBookmark(chapterId, passage.id, chapterId, passage.original);
    setBookmarked(added);
  }, [chapterId, passage.id, passage.original]);

  const handleSpeak = useCallback(() => {
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(passage.original);
    utterance.lang = "zh-CN";
    utterance.rate = 0.7;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [speaking, passage.original]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => { speechSynthesis.cancel(); };
  }, []);

  return (
    <div className="group/passage" onMouseEnter={() => setShowTools(true)} onMouseLeave={() => setShowTools(false)}>
      {/* Floating toolbar — appears on hover */}
      <div className={`sticky top-14 z-30 flex justify-end mb-1 transition-opacity duration-200 ${showTools ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center gap-0.5 bg-[var(--bg-card)]/90 backdrop-blur-sm rounded-lg border border-[var(--border-light)] shadow-sm px-1 py-0.5">
          {/* Bookmark */}
          <button onClick={handleBookmark}
            className={`p-1.5 rounded hover:bg-[var(--hover-bg)] transition-colors ${bookmarked ? "text-[var(--text-accent)]" : "text-[var(--text-muted)]"}`}
            title={bookmarked ? "取消收藏" : "收藏"}>
            <svg className="w-3.5 h-3.5" fill={bookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </button>
          {/* Annotate */}
          <button onClick={() => setShowAnnotation(!showAnnotation)}
            className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-accent)] transition-colors" title="批注">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </button>
          {/* Copy */}
          <button onClick={() => { navigator.clipboard.writeText(passage.original); }}
            className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-accent)] transition-colors" title="复制原文">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
          </button>
          {/* Permalink */}
          <button onClick={() => {
            const url = `${window.location.origin}/chapters/${chapterId}#passage-${passage.id}`;
            navigator.clipboard.writeText(url);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 1500);
          }}
            className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-accent)] transition-colors"
            title={linkCopied ? "已复制链接" : "复制段落链接"}>
            {linkCopied ? (
              <svg className="w-3.5 h-3.5 text-[var(--text-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            )}
          </button>
          {/* Pinyin toggle */}
          <button onClick={togglePinyin}
            className={`p-1.5 rounded hover:bg-[var(--hover-bg)] transition-colors ${showPinyin ? "text-[var(--text-accent)]" : "text-[var(--text-muted)]"}`}
            title={showPinyin ? "隐藏拼音" : "显示拼音"}>
            <span className="text-[11px] font-medium tracking-tight">拼</span>
          </button>
          {/* Immersive reading toggle */}
          <button onClick={toggleImmersive}
            className={`p-1.5 rounded hover:bg-[var(--hover-bg)] transition-colors ${immersive ? "text-[var(--text-accent)]" : "text-[var(--text-muted)]"}`}
            title={immersive ? "退出沉浸阅读" : "沉浸阅读"}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          </button>
          {/* Split view toggle */}
          <button onClick={() => setSplitView(!splitView)}
            className={`p-1.5 rounded hover:bg-[var(--hover-bg)] transition-colors ${splitView ? "text-[var(--text-accent)]" : "text-[var(--text-muted)]"}`}
            title={splitView ? "上下排列" : "分栏对照"}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </button>
          {/* TTS — read aloud */}
          <button onClick={handleSpeak}
            className={`p-1.5 rounded hover:bg-[var(--hover-bg)] transition-colors ${speaking ? "text-[var(--text-accent)]" : "text-[var(--text-muted)]"}`}
            title={speaking ? "停止朗读" : "朗读原文"}>
            {speaking ? (
              <svg className="w-3.5 h-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Content — split view or stacked */}
      {splitView ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-6">
          {/* Left: Original */}
          <div className="min-w-0">
            <div className="text-[10px] font-medium text-[var(--text-muted)] tracking-[0.1em] uppercase mb-2">原文</div>
            <p className="original-text reading-prose leading-loose tracking-wide text-lg">
              {showPinyin ? (
                <PinyinAnnotator text={passage.original} enabled={true} />
              ) : (
                <AnnotatedText original={passage.original} annotations={passage.annotations} />
              )}
            </p>
          </div>
          {/* Right: Translation */}
          <div className="min-w-0 border-l-2 border-[var(--border-light)] pl-4 sm:pl-6">
            <div className="text-[10px] font-medium text-[var(--text-muted)] tracking-[0.1em] uppercase mb-2">译文</div>
            <p className="translation-text reading-prose">
              {passage.translation}
            </p>
            <TranslationCompare translations={passage.translations} defaultTranslation={passage.translation} />
          </div>
        </div>
      ) : (
        <>
          {/* Original text — stacked */}
          <div className="mb-6">
            <p className="original-text reading-prose leading-loose tracking-wide text-lg sm:text-xl">
              {showPinyin ? (
                <PinyinAnnotator text={passage.original} enabled={true} />
              ) : (
                <AnnotatedText original={passage.original} annotations={passage.annotations} />
              )}
            </p>
          </div>
          {/* Translation — stacked */}
          <div className="mb-5 pl-4 border-l-2 border-[var(--border-light)]">
            <p className="translation-text reading-prose">
              {passage.translation}
            </p>
            <TranslationCompare translations={passage.translations} defaultTranslation={passage.translation} />
          </div>
        </>
      )}

      {/* Commentary */}
      {passage.commentary && (
        <div className="mb-5">
          <CommentaryBlock commentary={passage.commentary} />
        </div>
      )}

      {/* Concept tags */}
      {passage.concepts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {passage.concepts.map((cid) => (
            <ConceptTag key={`${passage.id}-${cid}`} conceptId={cid} size="sm" />
          ))}
        </div>
      )}

      {/* Annotation panel */}
      {showAnnotation && (
        <div className="mb-5">
          <AnnotationPanel chapterId={chapterId} passageId={passage.id} onClose={() => setShowAnnotation(false)} />
        </div>
      )}
    </div>
  );
}
