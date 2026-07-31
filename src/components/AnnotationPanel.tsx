"use client";

import { useState, useEffect } from "react";
import { useAnnotation } from "@/lib/annotations";

interface AnnotationPanelProps {
  chapterId: string;
  passageId: string;
  onClose: () => void;
}

export default function AnnotationPanel({
  chapterId,
  passageId,
  onClose,
}: AnnotationPanelProps) {
  const { annotation, save, remove } = useAnnotation(chapterId, passageId);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  // useAnnotation 的 annotation 是异步 set（初始 null），挂载后同步一次，
  // 否则已有批注不预填，用户保存会覆盖原批注
  useEffect(() => {
    setText(annotation?.text ?? "");
  }, [annotation]);

  const handleSave = () => {
    if (text.trim()) {
      save(text.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      remove();
    }
  };

  const handleDelete = () => {
    remove();
    setText("");
    onClose();
  };

  return (
    <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          ✍️ 批注
        </span>
        <button
          onClick={onClose}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="写下你的感悟…"
        rows={3}
        className="w-full text-sm bg-transparent border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-accent)] resize-none"
      />

      <div className="flex items-center justify-end gap-2 mt-2">
        {annotation && (
          <button
            onClick={handleDelete}
            className="text-xs text-red-500/70 hover:text-red-500 transition-colors"
          >
            删除
          </button>
        )}
        <button
          onClick={handleSave}
          className={`text-xs px-3 py-1 rounded transition-colors ${
            saved
              ? "bg-green-500/20 text-green-600"
              : "bg-[var(--text-accent)]/10 text-[var(--text-accent)] hover:bg-[var(--text-accent)]/20"
          }`}
        >
          {saved ? "已保存 ✓" : "保存"}
        </button>
      </div>
    </div>
  );
}
