"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { getAnnotation, saveAnnotation } from "@/lib/annotations";

interface SelectionPopoverProps {
  chapterId: string;
  chapterTitle: string;
}

interface SelectionState {
  text: string;
  passageId: string;
  top: number;
  left: number;
}

const emptySubscribe = () => () => {};

export default function SelectionPopover({ chapterId, chapterTitle }: SelectionPopoverProps) {
  const router = useRouter();
  const [selectionState, setSelectionState] = useState<SelectionState | null>(null);
  const [highlighted, setHighlighted] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const handleSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectionState(null);
      return;
    }

    const text = sel.toString().trim();
    if (text.length < 2 || text.length > 140) {
      setSelectionState(null);
      return;
    }

    // 检查选区是否在 [data-passage-root] 内的 .original-text 或 .translation-text
    const anchorNode = sel.anchorNode;
    const focusNode = sel.focusNode;
    if (!anchorNode || !focusNode) {
      setSelectionState(null);
      return;
    }

    const anchorEl = (anchorNode instanceof HTMLElement ? anchorNode : anchorNode.parentElement);
    const focusEl = (focusNode instanceof HTMLElement ? focusNode : focusNode.parentElement);
    if (!anchorEl || !focusEl) {
      setSelectionState(null);
      return;
    }

    const passageTarget = anchorEl.closest(".original-text, .translation-text");
    if (!passageTarget || !focusEl.closest(".original-text, .translation-text")) {
      setSelectionState(null);
      return;
    }

    const passageAnchor = anchorEl.closest('[id^="passage-"]');
    if (!passageAnchor) {
      setSelectionState(null);
      return;
    }

    const passageId = passageAnchor.id.replace(/^passage-/, "");
    if (!passageId) {
      setSelectionState(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setSelectionState(null);
      return;
    }

    // 视口边界计算：选区上方 48px，若靠近顶部（< 65px）则翻转至下方
    const isNearTop = rect.top < 65;
    const top = isNearTop ? rect.bottom + 8 : rect.top - 46;
    const rawLeft = rect.left + rect.width / 2;
    // 左右防溢出 clamp (视口左右留至少 140px 半宽)
    const left = Math.max(150, Math.min(window.innerWidth - 150, rawLeft));

    setSelectionState({
      text,
      passageId,
      top,
      left,
    });
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    const onSelectionEnd = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(handleSelection, 30);
    };

    const onMouseDown = (e: MouseEvent) => {
      // 如果点击在胶囊内，阻止关闭
      if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
        return;
      }
      // 点击外部若选区已折叠，关闭胶囊
      window.setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          setSelectionState(null);
        }
      }, 50);
    };

    document.addEventListener("mouseup", onSelectionEnd);
    document.addEventListener("touchend", onSelectionEnd);
    document.addEventListener("keyup", onSelectionEnd);
    document.addEventListener("selectionchange", onSelectionEnd);
    document.addEventListener("mousedown", onMouseDown);

    return () => {
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("mouseup", onSelectionEnd);
      document.removeEventListener("touchend", onSelectionEnd);
      document.removeEventListener("keyup", onSelectionEnd);
      document.removeEventListener("selectionchange", onSelectionEnd);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [handleSelection]);

  // 1. 朱笔圈点
  const handleHighlight = () => {
    if (!selectionState) return;
    const { text, passageId } = selectionState;

    // 持久化到 localStorage "zhuangzi-highlights"
    try {
      const raw = localStorage.getItem("zhuangzi-highlights");
      const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
      const key = `${chapterId}::${passageId}`;
      const list = map[key] || [];
      if (!list.includes(text)) {
        list.push(text);
        map[key] = list;
        localStorage.setItem("zhuangzi-highlights", JSON.stringify(map));
      }
    } catch {}

    // 联动批注 @/lib/annotations
    const existing = getAnnotation(chapterId, passageId);
    const highlightNote = `【朱笔圈点】「${text}」`;
    let nextAnnotation = highlightNote;
    if (existing && existing.text) {
      if (!existing.text.includes(highlightNote)) {
        nextAnnotation = `${existing.text}\n${highlightNote}`;
      } else {
        nextAnnotation = existing.text;
      }
    }
    saveAnnotation(chapterId, passageId, nextAnnotation);

    // 触发全局事件
    window.dispatchEvent(new CustomEvent("zhuangzi:highlights-updated"));

    setHighlighted(true);
    setTimeout(() => {
      setHighlighted(false);
      setSelectionState(null);
    }, 1200);
  };

  // 2. 制笺海报
  const handleMakeCard = () => {
    if (!selectionState) return;
    const { text } = selectionState;
    router.push(`/cards?text=${encodeURIComponent(text)}&chapter=${encodeURIComponent(chapterTitle)}`);
    setSelectionState(null);
  };

  // 3. 问庄子
  const handleAsk = () => {
    if (!selectionState) return;
    const { text } = selectionState;
    window.dispatchEvent(
      new CustomEvent("zhuangzi:ask-selection", {
        detail: { text, chapterTitle },
      })
    );
    setSelectionState(null);
  };

  // 4. 引证复制
  const handleCopyCite = async () => {
    if (!selectionState) return;
    const { text, passageId } = selectionState;
    const cite = `「${text}」\n——《庄子·${chapterTitle}》 ${window.location.origin}/chapters/${chapterId}#passage-${passageId}`;
    try {
      await navigator.clipboard.writeText(cite);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setSelectionState(null);
      }, 1200);
    } catch {}
  };

  if (!mounted || !selectionState) return null;

  const popover = (
    <div
      ref={popoverRef}
      role="toolbar"
      aria-label="划词工具栏"
      className="fixed z-[9999] -translate-x-1/2 flex items-center gap-1 px-1.5 py-1 rounded-full border border-[var(--border-strong)] bg-[var(--bg-card)]/95 text-[var(--text-primary)] shadow-xl backdrop-blur-md transition-all duration-150 animate-fade-in"
      style={{
        top: `${selectionState.top}px`,
        left: `${selectionState.left}px`,
      }}
      onMouseDown={(e) => {
        // 阻止默认行为以防选区被立刻消除
        e.preventDefault();
      }}
    >
      {/* 1. 朱笔圈点 */}
      <button
        type="button"
        onClick={handleHighlight}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-serif rounded-full hover:bg-[var(--hover-bg)] text-[var(--color-accent-vermilion)] transition-colors"
        title="朱笔圈点并记入批注"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-vermilion)]" />
        <span>{highlighted ? "已圈点 ✓" : "朱笔圈点"}</span>
      </button>

      <span className="w-px h-3 bg-[var(--border-light)]" />

      {/* 2. 制笺海报 */}
      <button
        type="button"
        onClick={handleMakeCard}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-serif rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors"
        title="制作文笺书签海报"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <span>制笺海报</span>
      </button>

      <span className="w-px h-3 bg-[var(--border-light)]" />

      {/* 3. 问庄子 */}
      <button
        type="button"
        onClick={handleAsk}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-serif rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors"
        title="向庄子 AI 发起提问"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
        <span>问庄子</span>
      </button>

      <span className="w-px h-3 bg-[var(--border-light)]" />

      {/* 4. 引证复制 */}
      <button
        type="button"
        onClick={handleCopyCite}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-serif rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors"
        title="复制标准学术引证格式"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
        </svg>
        <span>{copied ? "已复制 ✓" : "引证复制"}</span>
      </button>
    </div>
  );

  return createPortal(popover, document.body);
}
