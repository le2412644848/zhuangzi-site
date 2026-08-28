"use client";

import { useEffect,useRef, useState } from "react";

const SHORTCUTS: { keys: string; desc: string; scope: string }[] = [
  { keys: "⌘K / Ctrl+K", desc: "聚焦搜索框", scope: "全站" },
  { keys: "？", desc: "打开本帮助面板", scope: "全站" },
  { keys: "Esc", desc: "关闭弹层 / 下拉菜单", scope: "全站" },
  { keys: "← / →", desc: "上一篇 / 下一篇", scope: "章节页" },
  { keys: "/", desc: "聚焦页内搜索框", scope: "章节页" },
  { keys: "b", desc: "收藏当前段落", scope: "章节页" },
  { keys: "m", desc: "切换竖排 / 横排", scope: "全站" },
];

/**
 * 快捷键帮助面板（按 ？ 唤出，GitHub/Gmail 式）。
 *
 * 站内已有 ⌘K、←/→、b、m、/ 等快捷键，但没有任何地方列出 —— 用户
 * 无从得知。本组件是挂在根布局的叶子客户端岛（不包裹任何正文，
 * 见 TODO「正文不得进入 client 祖先」约束）。
 */
export default function ShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;
      // 无修饰键的 ？ 切换面板；输入状态下不触发
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey && !typing) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-help-title"
    >
      {/* 遮罩 */}
      <button
        aria-label="关闭快捷键帮助"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] cursor-default"
        tabIndex={-1}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xl p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 id="shortcuts-help-title" className="text-base font-semibold text-[var(--text-accent)] tracking-[0.06em]">
            键盘快捷键
          </h2>
          <button
            ref={closeRef}
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="关闭"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <dl className="space-y-2.5">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2">
                <kbd className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] whitespace-nowrap">
                  {s.keys}
                </kbd>
              </dt>
              <dd className="text-right">
                <span className="block text-sm text-[var(--text-primary)] leading-tight">{s.desc}</span>
                <span className="block text-xs text-[var(--text-muted)]">{s.scope}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
