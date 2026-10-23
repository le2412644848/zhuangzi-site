"use client";

import { useEffect } from "react";

/**
 * 句级对齐与宋刻双行夹注控制器（SentenceSyncController）
 *
 * 架构铁律：无 UI 占位的客户端叶子岛（return null），挂载在 chapters/[id]/page.tsx。
 * 正文完全保持纯服务端组件直出，零服务端 HTML 体积增加！
 *
 * 功能 A：原文-译文「句级呼吸对齐」（Sentence-Level Hover Sync）
 * 功能 B：宋刻「双行夹注」投影（html.jiazhu-mode）
 */
export default function SentenceSyncController() {
  useEffect(() => {
    // ----------------------------------------------------
    // 功能 A：切分译文句子并建立句级呼吸对齐
    // ----------------------------------------------------
    const roots = document.querySelectorAll<HTMLElement>("[data-passage-root]");
    roots.forEach((root) => {
      const transEl = root.querySelector<HTMLElement>(".translation-text");
      if (transEl && transEl.dataset.sentsReady !== "true") {
        const rawText = transEl.textContent ?? "";
        // 按中文句末标点切分（保留标点）
        const matches = rawText.match(/[^。！？；]+[。！？；”’』」]?/g) || [rawText];
        transEl.textContent = "";
        matches.forEach((sentence, idx) => {
          const span = document.createElement("span");
          span.className = "trans-sent";
          span.dataset.sentIdx = String(idx);
          span.textContent = sentence;
          transEl.appendChild(span);
        });
        transEl.dataset.sentsReady = "true";
      }
    });

    /** 计算元素在原文容器中的字符偏移比例 */
    const getOffsetRatio = (el: HTMLElement, container: HTMLElement): number => {
      try {
        const range = document.createRange();
        range.setStart(container, 0);
        range.setEndBefore(el);
        const offset = range.toString().length;
        const total = Math.max(1, container.textContent?.length ?? 1);
        return offset / total;
      } catch {
        return 0;
      }
    };

    let activeSyncElements: HTMLElement[] = [];

    const clearActiveSync = () => {
      if (activeSyncElements.length > 0) {
        activeSyncElements.forEach((el) => el.classList.remove("sent-sync-active"));
        activeSyncElements = [];
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const grid = target.closest<HTMLElement>(".passage-grid");
      if (!grid) return;

      const transSent = target.closest<HTMLElement>(".trans-sent");
      const origText = grid.querySelector<HTMLElement>(".original-text");
      const transText = grid.querySelector<HTMLElement>(".translation-text");

      // 1. 鼠标悬停在右侧译文句子上
      if (transSent && origText && transText) {
        clearActiveSync();
        transSent.classList.add("sent-sync-active");
        activeSyncElements.push(transSent);

        const sents = Array.from(transText.querySelectorAll<HTMLElement>(".trans-sent"));
        const idx = parseInt(transSent.dataset.sentIdx ?? "0", 10);
        const ratio = (idx + 0.5) / Math.max(1, sents.length);

        // 映射到左侧原文对应的注释词或名句
        const candidates = Array.from(origText.querySelectorAll<HTMLElement>("button, .quote-mark"));
        if (candidates.length > 0) {
          let closestEl = candidates[0];
          let minDiff = Infinity;
          candidates.forEach((cand) => {
            const candRatio = getOffsetRatio(cand, origText);
            const diff = Math.abs(candRatio - ratio);
            if (diff < minDiff) {
              minDiff = diff;
              closestEl = cand;
            }
          });
          if (closestEl) {
            closestEl.classList.add("sent-sync-active");
            activeSyncElements.push(closestEl);
          }
        }
        return;
      }

      // 2. 鼠标悬停在左侧原文的注释词按钮或名句上
      const origItem = target.closest<HTMLElement>(".original-text button, .original-text .quote-mark");
      if (origItem && origText && transText) {
        clearActiveSync();
        origItem.classList.add("sent-sync-active");
        activeSyncElements.push(origItem);

        const sents = Array.from(transText.querySelectorAll<HTMLElement>(".trans-sent"));
        if (sents.length > 0) {
          const ratio = getOffsetRatio(origItem, origText);
          const targetIdx = Math.min(sents.length - 1, Math.max(0, Math.floor(ratio * sents.length)));
          const targetSent = sents[targetIdx];
          if (targetSent) {
            targetSent.classList.add("sent-sync-active");
            activeSyncElements.push(targetSent);
          }
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const related = e.relatedTarget as HTMLElement | null;
      // 若指针移出了 passage-grid 或者移出句子，清理高亮
      if (!related || !related.closest(".passage-grid")) {
        clearActiveSync();
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    // ----------------------------------------------------
    // 功能 B：宋刻「双行夹注」投影（html.jiazhu-mode）
    // ----------------------------------------------------
    const syncJiazhu = (enabled: boolean) => {
      // 先清理所有已注入的双行夹注
      document.querySelectorAll('[data-jiazhu-injected="true"]').forEach((el) => el.remove());
      if (!enabled) return;

      const passageRoots = document.querySelectorAll<HTMLElement>("[data-passage-root]");
      passageRoots.forEach((root) => {
        const commEl = root.querySelector<HTMLElement>(".commentary-text");
        const origEl = root.querySelector<HTMLElement>(".original-text");
        if (!commEl || !origEl) return;

        // 提取逐字注：『词条』：注释内容...
        const jiazhuMap = new Map<string, string>();
        const pTags = commEl.querySelectorAll("p");
        pTags.forEach((p) => {
          const text = p.textContent ?? "";
          const match = text.match(/^『([^』]+)』[：:\s]*([\s\S]*)/);
          if (match) {
            const term = match[1]?.trim();
            let note = match[2]?.trim().replace(/\s+/g, " ") ?? "";
            if (term && note && !jiazhuMap.has(term)) {
              if (note.length > 36) {
                note = note.slice(0, 36) + "…";
              }
              jiazhuMap.set(term, note);
            }
          }
        });

        if (jiazhuMap.size === 0) return;

        // 在原文对应的词条按钮后动态插入夹注
        const buttons = origEl.querySelectorAll<HTMLButtonElement>("button");
        buttons.forEach((btn) => {
          const term = btn.textContent?.trim() ?? "";
          const note = jiazhuMap.get(term);
          if (note) {
            // 避免重复插入
            if (btn.nextElementSibling?.getAttribute("data-jiazhu-injected") === "true") return;
            const span = document.createElement("span");
            span.className = "jiazhu-inline";
            span.setAttribute("data-jiazhu-injected", "true");
            span.textContent = `（${note}）`;
            btn.insertAdjacentElement("afterend", span);
          }
        });
      });
    };

    // 初始同步
    const isJiazhuInitially = document.documentElement.classList.contains("jiazhu-mode");
    syncJiazhu(isJiazhuInitially);

    // 监听 html 的 class 变化
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "class") {
          const isJiazhu = document.documentElement.classList.contains("jiazhu-mode");
          syncJiazhu(isJiazhu);
        }
      }
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      mo.disconnect();
      document.querySelectorAll('[data-jiazhu-injected="true"]').forEach((el) => el.remove());
      clearActiveSync();
    };
  }, []);

  return null;
}
