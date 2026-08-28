"use client";

import { useEffect, useState } from "react";

/**
 * 沉浸阅读模式 —— 非包裹式实现。
 *
 * 状态只存在于 documentElement 的 .immersive-mode 类上（CSS 据此隐藏
 * 页头/页脚/进度条/聊天球），组件间通过 window 自定义事件同步。
 * 刻意不用 React context：context provider 必须包裹整页 children，
 * 而静态导出会把 client 组件的 server children 完整序列化进 RSC 载荷
 * （章节页 33 万字符重复载荷的根源之一）。本模块让沉浸状态不经过
 * 任何 client 祖先，正文保持纯 server 直出。
 */
const IMMERSIVE_CLASS = "immersive-mode";
const EVENT = "immersivechange";

export function isImmersive(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains(IMMERSIVE_CLASS);
}

export function setImmersive(next: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(IMMERSIVE_CLASS, next);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
}

export function toggleImmersive(): boolean {
  const next = !isImmersive();
  setImmersive(next);
  return next;
}

/** React hook：订阅沉浸状态（供需要读状态渲染的客户端组件使用） */
export function useImmersive(): boolean {
  const [value, setValue] = useState(false);
  useEffect(() => {
    const update = () => setValue(isImmersive());
    update();
    window.addEventListener(EVENT, update);
    return () => window.removeEventListener(EVENT, update);
  }, []);
  return value;
}
