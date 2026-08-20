"use client";

import { useRef, useState, useEffect } from "react";
import quotesData from "@/data/quotes.json";

interface Quote {
  id: string; text: string; chapter: string; chapterId: string;
  passageId: string; theme: string; explanation: string;
}

export default function QuoteCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [quote, setQuote] = useState<Quote | null>(null);

  const pickRandom = () => {
    const all = (quotesData as { quotes: Quote[] }).quotes;
    setQuote(all[Math.floor(Math.random() * all.length)]);
  };

  useEffect(() => {
    // 随机选句必须在客户端执行，避免 SSR/CSR 随机数不同导致水合不一致
    // eslint-disable-next-line react-hooks/set-state-in-effect
    pickRandom();
  }, []);

  useEffect(() => {
    if (!quote || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = 600, h = 400;
    canvas.width = w; canvas.height = h;

    // Background - paper texture
    ctx.fillStyle = "#fafaf8";
    ctx.fillRect(0, 0, w, h);

    // Decorative top line
    ctx.strokeStyle = "#8b4513";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, 50);
    ctx.lineTo(560, 50);
    ctx.stroke();

    // Quote mark
    ctx.fillStyle = "#8b4513";
    ctx.font = "48px serif";
    ctx.fillText("\u201C", 40, 110);

    // Quote text
    ctx.fillStyle = "#2c2c2c";
    ctx.font = "22px 'Noto Serif SC', serif";
    const maxWidth = 520;
    const lines = [];
    let line = "";
    for (const ch of quote.text) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    let y = 130;
    for (const l of lines) {
      ctx.fillText(l, 40, y);
      y += 36;
    }

    // Bottom line
    ctx.strokeStyle = "#8b4513";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, y + 10);
    ctx.lineTo(560, y + 10);
    ctx.stroke();

    // Chapter name
    ctx.fillStyle = "#6b6b6b";
    ctx.font = "14px serif";
    ctx.fillText(`\u2014\u2014 ${quote.chapter}`, 40, y + 40);

    // Theme tag
    ctx.fillStyle = "#8b4513";
    ctx.font = "12px serif";
    ctx.fillText(quote.theme, 520, y + 40);
  }, [quote]);

  const download = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = "zhuangzi-quote.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={pickRandom}
          className="text-xs px-3 py-1.5 rounded bg-[var(--text-accent)]/10 text-[var(--text-accent)] hover:bg-[var(--text-accent)]/20 transition-colors">
          🎲 换一句
        </button>
        <button onClick={download}
          className="text-xs px-3 py-1.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors">
          💾 下载图片
        </button>
      </div>
      <canvas ref={canvasRef}
        className="w-full max-w-[600px] rounded-lg border border-[var(--border-color)] shadow-sm" />
    </div>
  );
}
