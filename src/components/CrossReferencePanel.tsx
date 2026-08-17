"use client";

import { useState, useEffect, useRef } from "react";
import { chat as deepseekChat } from "@/lib/ai";

interface CrossReferencePanelProps {
  selectedText: string;
  chapterTitle: string;
  chapterId: string;
  onClose: () => void;
}

export default function CrossReferencePanel({
  selectedText,
  chapterTitle,
  chapterId,
  onClose,
}: CrossReferencePanelProps) {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuotes, setShowQuotes] = useState(false);
  const [originalQuotes, setOriginalQuotes] = useState<{ quote: string; source: string }[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    async function fetchExplanation() {
      try {
        setLoading(true);
        const response = await deepseekChat({
          systemPrompt: `你是庄子研究专家。用户选中《庄子》中的一段文字，请你：
1. 用白话解释这段话的意思（100字以内）
2. 从《庄子》其他篇章中找出与此段思想相通、相呼应的 2-3 处原文，并说明关联
3. 格式要求：先解释，然后列出"【互证段落】"，每条含：(1) 原文引用 (2) 出自哪一篇 (3) 如何呼应
4. 如果找不到明显呼应，诚实地说明
5. 保持学术性但不失可读性`,
          userMessage: `我在读《庄子·${chapterTitle}》，读到这段：
---
${selectedText}
---
请帮助解析并找出其他篇章中的呼应段落。`,
          temperature: 0.5,
          maxTokens: 800,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setResult(response);
          // Try to extract quoted passages
          const quoted: { quote: string; source: string }[] = [];
          const quoteRegex = /[""「『]([^""」』]{8,})[""」』][\s\S]*?[（(]([^)）]+)[)）]/g;
          let match;
          while ((match = quoteRegex.exec(response)) !== null) {
            quoted.push({ quote: match[1], source: match[2] });
          }
          if (quoted.length > 0) setOriginalQuotes(quoted);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "未知错误");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchExplanation();

    return () => controller.abort();
  }, [selectedText, chapterTitle]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)] bg-[var(--bg-card)] rounded-t-xl">
          <h3 className="text-sm font-medium text-[var(--text-accent)] tracking-wider">
            🔗 以庄解庄
          </h3>
          <button onClick={onClose}
            className="p-1 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] text-xs">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          {/* Selected text */}
          <div className="mb-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-light)]">
            <div className="text-[10px] text-[var(--text-secondary)] mb-1 tracking-wider">选中原文</div>
            <p className="text-xs text-[var(--text-primary)] leading-relaxed">{selectedText}</p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] py-4">
              <span className="animate-pulse">⏳</span>
              <span>正在遍览庄子篇章，寻找呼应…</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
              {result}
            </div>
          )}

          {/* Quick chapter links extracted from result */}
          {originalQuotes.length > 0 && !loading && (
            <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
              <button
                onClick={() => setShowQuotes(!showQuotes)}
                className="text-xs text-[var(--text-accent)] hover:underline"
              >
                引用段落 ({originalQuotes.length}) {showQuotes ? "▲" : "▼"}
              </button>
              {showQuotes && (
                <div className="mt-2 space-y-2">
                  {originalQuotes.map((q, i) => (
                    <div key={i} className="p-2 rounded border border-[var(--border-light)]">
                      <p className="text-xs text-[var(--text-primary)] leading-relaxed">"{q.quote}"</p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1">— {q.source}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
