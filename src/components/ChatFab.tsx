"use client";

import dynamic from "next/dynamic";

// 聊天球按需加载：内部静态引用 search → 全量章节数据(656KB)，
// 直接静态导入会把整包数据塞进每个页面的首屏 bundle。
// 延迟到交互/空闲后再拉取，首包体积显著下降。
// 需要包一层 client 组件：Next 16 不允许在 Server Component 中
// 使用 ssr:false 的 next/dynamic。
const ChatWithZhuangzi = dynamic(() => import("./ChatWithZhuangzi"), {
  ssr: false,
  loading: () => null,
});

/** 聊天球挂载点（client 叶子组件，不包裹任何 children） */
export default function ChatFab() {
  return <ChatWithZhuangzi />;
}
