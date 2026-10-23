"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// 聊天球按需加载：内部静态引用 search → 全量章节数据(656KB)，
// 直接静态导入会把整包数据塞进每个页面的首屏 bundle。
// 延迟到交互/空闲后再拉取，首包体积显著下降。
// 需要包一层 client 组件：Next 16 不允许在 Server Component 中
// 使用 ssr:false 的 next/dynamic。
const ChatWithZhuangzi = dynamic(() => import("./ChatWithZhuangzi"), {
  ssr: false,
  loading: () => null,
});

/** 聊天球挂载点（client 叶子组件，对接划词「问庄子」自定义事件） */
export default function ChatFab() {
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
      }
    };

    window.addEventListener("zhuangzi:ask-selection", handleAskSelection);
    return () => {
      window.removeEventListener("zhuangzi:ask-selection", handleAskSelection);
    };
  }, []);

  return (
    <ChatWithZhuangzi
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
