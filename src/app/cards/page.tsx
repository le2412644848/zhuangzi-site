"use client";

import { useEffect, useRef, useState } from "react";

import { useTheme } from "@/components/ThemeProvider";
import quotesData from "@/data/quotes.json";

interface Quote {
  id: string;
  text: string;
  chapter: string;
  chapterId: string;
  passageId: string;
  theme: string;
  explanation: string;
}

type PaperStyleId = "chengxin" | "xuanyan" | "zhuyun";
type LayoutMode = "horizontal" | "vertical";

interface PaperTheme {
  id: PaperStyleId;
  name: string;
  desc: string;
  bg: string;
  text: string;
  subText: string;
  border: string;
  seal: string;
  sealBg: string;
  gridLine: string;
  zenCircle: string;
}

const PAPER_THEMES: Record<PaperStyleId, PaperTheme> = {
  chengxin: {
    id: "chengxin",
    name: "澄心宣纸",
    desc: "暖宣松烟 · 檀木朱砂",
    bg: "#FAF8F4",
    text: "#231C14",
    subText: "#7A6B5D",
    border: "#8E5431",
    seal: "#B83B2E",
    sealBg: "#FAF8F4",
    gridLine: "rgba(142, 84, 49, 0.14)",
    zenCircle: "rgba(142, 84, 49, 0.06)",
  },
  xuanyan: {
    id: "xuanyan",
    name: "玄砚泥金",
    desc: "玄青月白 · 泥金丹砂",
    bg: "#181512",
    text: "#EAE4D9",
    subText: "#A89F91",
    border: "#D49B6A",
    seal: "#D9534F",
    sealBg: "#181512",
    gridLine: "rgba(212, 155, 106, 0.18)",
    zenCircle: "rgba(212, 155, 106, 0.08)",
  },
  zhuyun: {
    id: "zhuyun",
    name: "竹韵青花",
    desc: "素瓷浓墨 · 青花朱印",
    bg: "#F6F8F9",
    text: "#1C2833",
    subText: "#5C6B73",
    border: "#2B5F8A",
    seal: "#B83B2E",
    sealBg: "#F6F8F9",
    gridLine: "rgba(43, 95, 138, 0.15)",
    zenCircle: "rgba(43, 95, 138, 0.06)",
  },
};

function drawSeal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  text: string,
  sealColor: string,
  sealBg: string
) {
  ctx.save();
  // 朱文印外层双重方框
  ctx.strokeStyle = sealColor;
  ctx.lineWidth = 2.2;
  ctx.strokeRect(x, y, size, size);

  ctx.lineWidth = 0.8;
  ctx.strokeRect(x + 2.5, y + 2.5, size - 5, size - 5);

  ctx.fillStyle = sealBg;
  ctx.fillRect(x + 3.2, y + 3.2, size - 6.4, size - 6.4);

  // 印文
  ctx.fillStyle = sealColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (text.length === 2) {
    ctx.font = `bold ${Math.floor(size * 0.38)}px "Noto Serif SC", "Songti SC", serif`;
    ctx.fillText(text[0] ?? "", x + size / 2, y + size * 0.32);
    ctx.fillText(text[1] ?? "", x + size / 2, y + size * 0.72);
  } else if (text.length === 4) {
    ctx.font = `bold ${Math.floor(size * 0.32)}px "Noto Serif SC", "Songti SC", serif`;
    ctx.fillText(text[0] ?? "", x + size * 0.72, y + size * 0.32);
    ctx.fillText(text[1] ?? "", x + size * 0.72, y + size * 0.72);
    ctx.fillText(text[2] ?? "", x + size * 0.28, y + size * 0.32);
    ctx.fillText(text[3] ?? "", x + size * 0.28, y + size * 0.72);
  } else {
    ctx.font = `bold ${Math.floor(size * 0.45)}px "Noto Serif SC", "Songti SC", serif`;
    ctx.fillText(text, x + size / 2, y + size / 2);
  }
  ctx.restore();
}

function drawZenCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0.2 * Math.PI, 1.82 * Math.PI, false);
  ctx.strokeStyle = color;
  ctx.lineWidth = radius * 0.22;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.84, 0.35 * Math.PI, 1.68 * Math.PI, false);
  ctx.lineWidth = radius * 0.08;
  ctx.stroke();
  ctx.restore();
}

export default function QuoteCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [selectedPaperStyle, setSelectedPaperStyle] = useState<PaperStyleId | null>(null);
  const [layout, setLayout] = useState<LayoutMode>("horizontal");
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customText, setCustomText] = useState<string>("");
  const [customChapter, setCustomChapter] = useState<string>("");

  const { theme: siteTheme } = useTheme();

  // 默认根据站点主题推荐底色，也可由读者自由点选
  const defaultPaperStyle: PaperStyleId =
    siteTheme === "yedu" || siteTheme === "moyun"
      ? "xuanyan"
      : siteTheme === "qinghua"
      ? "zhuyun"
      : "chengxin";
  const paperStyle = selectedPaperStyle ?? defaultPaperStyle;

  const pickRandom = () => {
    const all = (quotesData as { quotes: Quote[] }).quotes;
    const item = all[Math.floor(Math.random() * all.length)] ?? null;
    setQuote(item);
    setIsCustomMode(false);
  };

  useEffect(() => {
    // 挂载时检查是否带有 URL ?text=...&chapter=... 划词入参
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const textParam = params.get("text");
      const chapterParam = params.get("chapter");

      if (textParam) {
        const cleanedText = textParam.trim();
        const cleanedChapter = chapterParam?.trim() || "原典精选";

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQuote({
          id: "custom-selected",
          text: cleanedText,
          chapter: cleanedChapter,
          chapterId: "",
          passageId: "",
          theme: "读者摘句",
          explanation: `此句由读者在《庄子 · ${cleanedChapter}》研读过程中划词制笺，一键生成宋刻文人笺纸海报。`,
        });
        setCustomText(cleanedText);
        setCustomChapter(cleanedChapter);
        setIsCustomMode(true);
        return;
      }
    }

     
    pickRandom();
  }, []);

  const handleApplyCustom = () => {
    if (!customText.trim()) return;
    setQuote({
      id: "user-custom",
      text: customText.trim(),
      chapter: customChapter.trim() || "自拟",
      chapterId: "",
      passageId: "",
      theme: "读者自撰",
      explanation: "由读者自定义输入之金句笺纸。",
    });
  };

  useEffect(() => {
    if (!quote || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;

    const render = async () => {
      if (typeof document !== "undefined" && document.fonts?.ready) {
        await document.fonts.ready;
      }
      if (cancelled) return;

      const theme = PAPER_THEMES[paperStyle];
      const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 3);

      if (layout === "horizontal") {
        // ========== 横排雅笺模式 ==========
        const logicalW = 620;
        const padX = 46;
        const contentW = logicalW - padX * 2;
        const lineHeight = 38;
        const textTop = 136;

        ctx.font = '22px "Noto Serif SC", "Songti SC", STSong, serif';
        const lines: string[] = [];
        let curLine = "";
        const kinsokuRe = /^[，。！？；：、」』）》]/;
        for (const ch of quote.text) {
          const test = curLine + ch;
          if (ctx.measureText(test).width > contentW && !kinsokuRe.test(ch)) {
            lines.push(curLine);
            curLine = ch;
          } else {
            curLine = test;
          }
        }
        if (curLine) lines.push(curLine);

        const lastLineY = textTop + (lines.length - 1) * lineHeight;
        const logicalH = Math.max(340, lastLineY + 110);

        canvas.width = Math.round(logicalW * dpr);
        canvas.height = Math.round(logicalH * dpr);
        canvas.style.width = `${logicalW}px`;
        canvas.style.height = `${logicalH}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        // 背景宣纸
        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, logicalW, logicalH);

        // 水墨禅圆暗纹
        drawZenCircle(ctx, logicalW - 100, 110, 68, theme.zenCircle);

        // 顶端双线条宋刻笺栏
        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(padX, 44);
        ctx.lineTo(logicalW - padX, 44);
        ctx.stroke();

        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(padX, 49);
        ctx.lineTo(logicalW - padX, 49);
        ctx.stroke();

        // 顶眉批注（小楷）
        ctx.fillStyle = theme.subText;
        ctx.font = '12px "Noto Serif SC", serif';
        ctx.fillText("十竹斋 · 澄心堂笺", padX, 36);

        // 典雅引言开卷符号
        ctx.fillStyle = theme.border;
        ctx.font = '46px "Noto Serif SC", serif';
        ctx.fillText("“", padX - 6, 108);

        // 名言大字
        ctx.fillStyle = theme.text;
        ctx.font = '22px "Noto Serif SC", "Songti SC", STSong, serif';
        let y = textTop;
        for (const l of lines) {
          ctx.fillText(l, padX, y);
          y += lineHeight;
        }

        // 底端乌丝线
        ctx.strokeStyle = theme.gridLine;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padX, y + 16);
        ctx.lineTo(logicalW - padX, y + 16);
        ctx.stroke();

        // 朱文篆刻方印「逍遥」
        drawSeal(ctx, padX, y + 28, 42, "逍遥", theme.seal, theme.sealBg);

        // 篇目落款
        ctx.fillStyle = theme.subText;
        ctx.font = '14px "Noto Serif SC", serif';
        ctx.fillText(`——《庄子 · ${quote.chapter}》`, padX + 54, y + 54);

        // 哲思主题印记
        ctx.fillStyle = theme.border;
        ctx.font = '12px "Noto Serif SC", serif';
        const tagText = `【${quote.theme}】`;
        const tagW = ctx.measureText(tagText).width;
        ctx.fillText(tagText, logicalW - padX - tagW, y + 54);
      } else {
        // ========== 宋刻竖排书签模式 ==========
        const logicalW = 420;
        const logicalH = 640;

        canvas.width = Math.round(logicalW * dpr);
        canvas.height = Math.round(logicalH * dpr);
        canvas.style.width = `${logicalW}px`;
        canvas.style.height = `${logicalH}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        // 背景
        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, logicalW, logicalH);

        // 宋刻外粗内细双边栏框
        const outerMargin = 22;
        const innerMargin = 28;

        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 3.2;
        ctx.strokeRect(outerMargin, outerMargin, logicalW - outerMargin * 2, logicalH - outerMargin * 2);

        ctx.lineWidth = 1;
        ctx.strokeRect(innerMargin, innerMargin, logicalW - innerMargin * 2, logicalH - innerMargin * 2);

        // 水墨禅圆暗纹
        drawZenCircle(ctx, innerMargin + 72, logicalH - innerMargin - 80, 52, theme.zenCircle);

        // 竖排文本布局计算（含中文标点避头尾保护）
        const topY = innerMargin + 32;
        const bottomY = logicalH - innerMargin - 36;
        const colHeight = bottomY - topY;
        const charStep = 27;
        const maxCharsPerCol = Math.max(8, Math.floor((colHeight - 36) / charStep));
        const kinsokuVertRe = /^[，。！？；：、」』）》]/;
        const vertPunctRe = /^[，。、；：！？]$/;

        // 正文逐字分列（严禁句末标点出现在新列列首）
        const textCols: string[] = [];
        let curCol = "";
        let charCount = 0;
        for (const ch of quote.text) {
          if (charCount >= maxCharsPerCol && !kinsokuVertRe.test(ch)) {
            textCols.push(curCol);
            curCol = ch;
            charCount = 1;
          } else {
            curCol += ch;
            charCount++;
          }
        }
        if (curCol) textCols.push(curCol);

        const colWidth = 38;
        const rightStartX = logicalW - innerMargin - 44;

        // 右侧首列：篇名题签「庄子 · 篇名」
        ctx.save();
        ctx.fillStyle = theme.subText;
        ctx.font = '13px "Noto Serif SC", "Songti SC", serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const titleText = `庄子 · ${quote.chapter}`;
        for (let c = 0; c < titleText.length; c++) {
          ctx.fillText(titleText[c] ?? "", rightStartX, topY + 12 + c * 20);
        }

        // 篇目题签左侧乌丝细栏线
        ctx.strokeStyle = theme.gridLine;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(rightStartX - colWidth / 2, topY);
        ctx.lineTo(rightStartX - colWidth / 2, bottomY);
        ctx.stroke();
        ctx.restore();

        // 逐列从右向左排布名言大字
        for (let colIdx = 0; colIdx < textCols.length; colIdx++) {
          const colX = rightStartX - (colIdx + 1) * colWidth;
          const colStr = textCols[colIdx]!;

          // 乌丝栏纵向细线
          ctx.save();
          ctx.strokeStyle = theme.gridLine;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(colX - colWidth / 2, topY);
          ctx.lineTo(colX - colWidth / 2, bottomY);
          ctx.stroke();
          ctx.restore();

          // 竖排大字
          ctx.save();
          ctx.fillStyle = theme.text;
          ctx.font = '21px "Noto Serif SC", "Songti SC", STSong, serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          for (let chIdx = 0; chIdx < colStr.length; chIdx++) {
            const ch = colStr[chIdx]!;
            const isPunct = vertPunctRe.test(ch);
            const drawX = isPunct ? colX + 5 : colX;
            const drawY = topY + 18 + chIdx * charStep + (isPunct ? -4 : 0);
            ctx.fillText(ch, drawX, drawY);
          }
          ctx.restore();
        }

        // 左下角：朱文篆刻方印「南华」
        drawSeal(ctx, innerMargin + 26, logicalH - innerMargin - 76, 46, "南华", theme.seal, theme.sealBg);

        // 左侧题签：十竹斋笺 · 逍遥
        ctx.save();
        ctx.fillStyle = theme.subText;
        ctx.font = '11px "Noto Serif SC", serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const sealSign = "南华真经";
        for (let s = 0; s < sealSign.length; s++) {
          ctx.fillText(sealSign[s] ?? "", innerMargin + 50, topY + 16 + s * 18);
        }
        ctx.restore();
      }
    };

    void render();

    return () => {
      cancelled = true;
    };
  }, [quote, paperStyle, layout]);

  const download = () => {
    if (!canvasRef.current || !quote) return;
    const link = document.createElement("a");
    link.download = `庄子名言-${quote.chapter}-${paperStyle}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="max-w-2xl mx-auto py-4">
      {/* 顶部标题与工坊引言 */}
      <div className="text-center mb-6">
        <h1 className="text-lg font-serif font-bold text-[var(--text-primary)] flex items-center justify-center gap-2">
          <span className="seal-char-lg" aria-hidden="true">箋</span>
          文人笺纸海报工坊
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1 tracking-wider font-serif">
          十竹斋木版水印 · 澄心堂古法宣纸 · 宋刻双边乌丝栏
        </p>
      </div>

      {/* 划词直达提示 */}
      {isCustomMode && (
        <div className="mb-4 p-3 rounded-xl border border-[var(--color-accent-vermilion,#b83b2e)]/30 bg-[var(--color-accent-vermilion,#b83b2e)]/5 text-xs font-serif text-[var(--color-accent-vermilion,#b83b2e)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="seal-char" aria-hidden="true">選</span>
            <span>已为您预填来自阅读器的摘录金句，可直接排版并下载海报。</span>
          </div>
          <button
            type="button"
            onClick={pickRandom}
            className="hover:underline text-[11px] cursor-pointer"
          >
            切换为经典金句库
          </button>
        </div>
      )}

      {/* 控制台：笺纸主题、版式切换与操作 */}
      <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] mb-6 space-y-4 shadow-sm">
        {/* 笺纸配色 */}
        <div>
          <div className="text-xs font-serif text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-accent)]" />
            古典笺纸品鉴
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(PAPER_THEMES) as PaperStyleId[]).map((id) => {
              const item = PAPER_THEMES[id];
              const active = paperStyle === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSelectedPaperStyle(id);
                  }}
                  className={`p-2 rounded-lg text-left border transition-all text-xs flex flex-col gap-1 cursor-pointer ${
                    active
                      ? "border-[var(--text-accent)] bg-[var(--text-accent)]/10 ring-1 ring-[var(--text-accent)]/40"
                      : "border-[var(--border-light)] bg-[var(--bg-secondary)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-medium text-[var(--text-primary)]">
                      {item.name}
                    </span>
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-inner"
                      style={{ backgroundColor: item.bg }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] scale-95 origin-left">
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 自定义文本折叠抽屉 */}
        {isCustomMode && (
          <div className="p-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] space-y-2">
            <div className="text-xs font-serif font-medium text-[var(--text-primary)]">
              自由编辑笺文与篇名
            </div>
            <textarea
              rows={2}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="输入欲制笺之金句古训…"
              className="w-full text-xs font-serif p-2 rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] resize-none"
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customChapter}
                onChange={(e) => setCustomChapter(e.target.value)}
                placeholder="篇名（如：逍遥游）"
                className="text-xs font-serif px-2.5 py-1.5 rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] flex-1"
              />
              <button
                type="button"
                onClick={handleApplyCustom}
                className="px-3 py-1.5 rounded bg-[var(--text-accent)] text-[var(--btn-accent-text,#ffffff)] text-xs font-serif font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                更新笺纸
              </button>
            </div>
          </div>
        )}

        {/* 版式选择与操作按钮 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-light)]">
          <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border-light)]">
            <button
              type="button"
              onClick={() => setLayout("horizontal")}
              className={`text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${
                layout === "horizontal"
                  ? "bg-[var(--bg-card)] text-[var(--text-accent)] font-medium shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              横排雅笺
            </button>
            <button
              type="button"
              onClick={() => setLayout("vertical")}
              className={`text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${
                layout === "vertical"
                  ? "bg-[var(--bg-card)] text-[var(--text-accent)] font-medium shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              宋刻竖排书签
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!isCustomMode) {
                  setCustomText(quote?.text || "");
                  setCustomChapter(quote?.chapter || "");
                  setIsCustomMode(true);
                } else {
                  setIsCustomMode(false);
                }
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--text-accent)] transition-all flex items-center gap-1 cursor-pointer"
            >
              <span className="seal-char" aria-hidden="true">筆</span>
              {isCustomMode ? "收起编辑" : "自定义笺文"}
            </button>
            <button
              type="button"
              onClick={pickRandom}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--text-accent)] transition-all flex items-center gap-1 cursor-pointer"
            >
              <span className="seal-char" aria-hidden="true">換</span>
              换一句
            </button>
            <button
              type="button"
              onClick={download}
              className="text-xs px-3.5 py-1.5 rounded-lg bg-[var(--text-accent)] text-[var(--btn-accent-text,#ffffff)] hover:opacity-90 font-medium transition-all shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span className="seal-char" aria-hidden="true">存</span>
              下载超清笺纸
            </button>
          </div>
        </div>
      </div>

      {/* 笺纸 Canvas 展台 */}
      <div className="flex justify-center p-4 md:p-8 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-x-auto shadow-inner">
        <canvas
          ref={canvasRef}
          className="rounded-lg shadow-lg border border-black/10 max-w-full transition-transform"
        />
      </div>

      {/* 说明札记 */}
      {quote && (
        <div className="mt-4 p-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-xs text-[var(--text-secondary)] leading-relaxed">
          <div className="font-serif font-medium text-[var(--text-primary)] mb-1">
            札记阐发 · {quote.chapter}
          </div>
          {quote.explanation}
        </div>
      )}
    </div>
  );
}
