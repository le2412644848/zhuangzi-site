"use client";

import { useState } from "react";

type CitationStyle = "apa" | "mla" | "chicago";

interface CitationExportProps {
  chapterTitle: string;
  passageText: string;
  onClose: () => void;
}

function formatCitation(style: CitationStyle, chapterTitle: string, passageText: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const shortText = passageText.length > 80 ? passageText.slice(0, 80) + "…" : passageText;

  switch (style) {
    case "apa":
      return `庄周. (约公元前3世纪). 《庄子·${chapterTitle}》. 引自 庄子数位典藏 (https://zhuangzi-site.pages.dev). 检索日期: ${today}.`;
    case "mla":
      return `庄周. "庄子·${chapterTitle}." 庄子数位典藏, zhuangzi-site.pages.dev, 检索于 ${today}.`;
    case "chicago":
      return `庄周. 《庄子·${chapterTitle}》. 庄子数位典藏. https://zhuangzi-site.pages.dev. 检索于 ${today}.`;
  }
}

export default function CitationExport({ chapterTitle, passageText, onClose }: CitationExportProps) {
  const [style, setStyle] = useState<CitationStyle>("apa");
  const [copied, setCopied] = useState(false);

  const citation = formatCitation(style, chapterTitle, passageText);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("复制引用：", citation);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
          <h3 className="text-sm font-medium text-[var(--text-accent)]">📋 引用导出</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]">✕</button>
        </div>
        <div className="px-4 py-3 space-y-3">
          {/* Style selector */}
          <div className="flex gap-1 text-xs">
            {(["apa", "mla", "chicago"] as const).map((s) => (
              <button key={s} onClick={() => setStyle(s)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  style === s ? "bg-[var(--text-accent)] text-white" : "border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
          {/* Citation output */}
          <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-light)]">
            <p className="text-xs text-[var(--text-primary)] leading-relaxed">{citation}</p>
          </div>
          {/* Copy button */}
          <button onClick={handleCopy}
            className="w-full py-2 text-sm rounded-lg bg-[var(--text-accent)] text-white transition-opacity">
            {copied ? "✓ 已复制" : "复制引用"}
          </button>
        </div>
      </div>
    </div>
  );
}
