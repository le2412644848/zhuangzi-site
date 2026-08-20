"use client";

import { useState, useRef } from "react";

interface ShareCardProps {
  text: string;
  chapterTitle: string;
  onClose: () => void;
}

export default function ShareCard({ text, chapterTitle, onClose }: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 600;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    // Background
    const isDark = document.documentElement.classList.contains("dark");
    ctx.fillStyle = isDark ? "#1a1a1a" : "#fafaf8";
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = "#8b4513";
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Title
    ctx.fillStyle = "#8b4513";
    ctx.font = "bold 28px 'Noto Serif SC', serif";
    ctx.textAlign = "center";
    ctx.fillText("莊子", width / 2, 80);

    // Subtitle
    ctx.fillStyle = isDark ? "#999" : "#6b6b6b";
    ctx.font = "14px 'Noto Serif SC', serif";
    ctx.fillText(`《${chapterTitle}》`, width / 2, 105);

    // Separator
    ctx.strokeStyle = isDark ? "#3a3a3a" : "#d4c9b8";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(100, 125);
    ctx.lineTo(width - 100, 125);
    ctx.stroke();

    // Text (wrap)
    ctx.fillStyle = isDark ? "#e0e0e0" : "#2c2c2c";
    ctx.font = "18px 'Noto Serif SC', serif";
    ctx.textAlign = "center";
    const maxWidth = width - 120;
    const lines = wrapText(ctx, text, maxWidth);
    let y = 170;
    for (const line of lines) {
      if (y > height - 80) break;
      ctx.fillText(line, width / 2, y);
      y += 32;
    }

    // Footer
    ctx.fillStyle = isDark ? "#666" : "#aaa";
    ctx.font = "11px sans-serif";
    ctx.fillText("zhuangzi-site.pages.dev", width / 2, height - 30);

    setImgUrl(canvas.toDataURL("image/png"));
  };

  const handleCopy = async () => {
    const shareText = `《庄子·${chapterTitle}》\n\n${text}\n\n— 庄子数位典藏`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("复制分享：", shareText);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
          <h3 className="text-sm font-medium text-[var(--text-accent)]">分享此段</h3>
          <button onClick={onClose} className="p-1 text-xs text-[var(--text-secondary)]">✕</button>
        </div>
        <div className="px-4 py-3 space-y-3">
          {/* Preview */}
          <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-light)] max-h-32 overflow-y-auto">
            <p className="text-xs text-[var(--text-primary)] leading-relaxed">{text}</p>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1">— 《{chapterTitle}》</p>
          </div>

          {/* Generated image */}
          {imgUrl && (
            <div className="rounded-lg overflow-hidden border border-[var(--border-light)]">
              {/* canvas.toDataURL 生成的 data URL，next/image 不支持，需用原生 img */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgUrl} alt="分享卡片" className="w-full" />
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={generateImage}
              className="flex-1 py-2 text-sm rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors">
              🎨 生成卡片
            </button>
            <button onClick={handleCopy}
              className="flex-1 py-2 text-sm rounded-lg bg-[var(--text-accent)] text-white transition-opacity">
              {copied ? "✓ 已复制" : "📋 复制文字"}
            </button>
          </div>
          {imgUrl && (
            <a href={imgUrl} download={`zhuangzi-${chapterTitle}.png`}
              className="block text-center text-xs text-[var(--text-accent)] hover:underline">
              💾 下载图片
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const char of text) {
    const test = current + char;
    if (ctx.measureText(test).width > maxWidth && current.length > 0) {
      lines.push(current);
      current = char;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
