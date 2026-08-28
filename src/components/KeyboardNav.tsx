"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface KeyboardNavProps {
  prevUrl: string | null;
  nextUrl: string | null;
}

/**
 * 章节页键盘快捷键。
 *
 * 修正的问题：
 *  1. **竖排模式冲突**：`.vertical-mode .vertical-content` 用 `overflow-x: auto`
 *     做横向滚动阅读，而原实现把 ArrowLeft/ArrowRight 直接抢去翻篇 ——
 *     竖排读者按方向键本想滚动正文，结果整页跳走。
 *     现在竖排模式下不接管方向键。
 *  2. **辅助技术冲突**：读屏软件在浏览模式下用单字母做快速导航
 *     （b/m 等）。原实现全局抢 `b`、`m`、`/` 且只排除 ctrl，
 *     Alt/Meta 组合键也会误触发。现要求「无任何修饰键」才响应，
 *     并跳过 contentEditable 与 select 元素。
 *  3. **整页刷新**：原用 `window.location.href` 翻篇，等于放弃客户端路由、
 *     丢掉已缓存的 JS chunk。改用 next/navigation 的 router.push。
 */
export default function KeyboardNav({ prevUrl, nextUrl }: KeyboardNavProps) {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K：聚焦搜索框（首页提示过该快捷键，需全站可用）。
      // 必须在「无修饰键」检查之前处理——它本身就是修饰键组合。
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const search = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[type="text"]'
        );
        search?.focus();
        return;
      }

      // 任何修饰键组合都不接管（避免与浏览器/系统/输入法快捷键冲突）
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;
      // 表单控件与可编辑区域内不接管
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]')
      ) {
        return;
      }

      // 竖排阅读模式下方向键用于横向滚动正文，不可挪用
      const verticalMode = document.documentElement.classList.contains("vertical-mode");

      if (!verticalMode && e.key === "ArrowLeft" && prevUrl) {
        e.preventDefault();
        router.push(prevUrl);
        return;
      }
      if (!verticalMode && e.key === "ArrowRight" && nextUrl) {
        e.preventDefault();
        router.push(nextUrl);
        return;
      }
      if (e.key === "/") {
        const search = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[type="text"]'
        );
        if (search) {
          e.preventDefault();
          search.focus();
        }
        return;
      }
      if (e.key === "b") {
        const star = document.querySelector<HTMLElement>('button[aria-label*="收藏"]');
        if (star) {
          e.preventDefault();
          star.click();
        }
        return;
      }
      if (e.key === "m") {
        const vbtn = document.querySelector<HTMLElement>(
          'button[aria-label*="竖排"], button[aria-label*="横排"], button[title*="竖排"], button[title*="横排"]'
        );
        if (vbtn) {
          e.preventDefault();
          vbtn.click();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prevUrl, nextUrl, router]);

  return null;
}
