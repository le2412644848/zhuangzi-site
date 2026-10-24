"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// 聊天面板真正按需加载：ChatWithZhuangzi 内部静态引用 search → 全量章节索引，
// 仅在用户点击右下角「问庄子」悬浮球或触发划词提问时才动态挂载拉取该 chunk，
// 首屏零聊天引擎与零检索语料开销。
const ChatWithZhuangzi = dynamic(() => import("./ChatWithZhuangzi"), {
  ssr: false,
  loading: () => null,
});

/** 聊天球挂载点（client 叶子组件，首次激活前仅渲染轻量悬浮按钮） */
export default function ChatFab() {
  const [activated, setActivated] = useState(false);
  const [initialQuestion, setInitialQuestion] = useState<string | undefined>(undefined);
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    const handleAskSelection = (e: Event) => {
      const customEvent = e as CustomEvent<{ text: string; chapterTitle: string }>;
      if (customEvent.detail?.text) {
        const { text, chapterTitle } = customEvent.detail;
        const q = chapterTitle
          ? `请结合《庄子·${chapterTitle}》的语境，为我深入解读这句原文的微言大义：「${text}」`
          : `请结合《庄子》的语境，为我深入解读这句原文的微言大义：「${text}」`;
        setInitialQuestion(q);
        setForceOpen(true);
        setActivated(true);
      }
    };

    window.addEventListener("zhuangzi:ask-selection", handleAskSelection);
    return () => {
      window.removeEventListener("zhuangzi:ask-selection", handleAskSelection);
    };
  }, []);

  if (!activated) {
    return (
      <div className="fixed bottom-4 right-4 z-50 no-print chat-fab">
        <button
          type="button"
          onClick={() => {
            setForceOpen(true);
            setActivated(true);
          }}
          aria-label="打开「问庄子」对话"
          aria-expanded={false}
          className="w-11 h-11 rounded-full bg-[var(--text-accent)] text-[var(--btn-accent-text,#ffffff)] shadow-md hover:shadow-lg hover:opacity-90 transition-all flex items-center justify-center cursor-pointer"
        >
          <svg
            aria-hidden="true"
            focusable="false"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <ChatWithZhuangzi
      defaultOpen
      initialQuestion={initialQuestion}
      forceOpen={forceOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setForceOpen(false);
          setInitialQuestion(undefined);
        }
      }}
    />
  );
}
