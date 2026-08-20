"use client";

import { useState, useCallback, useEffect } from "react";
import { chat as deepseekChat } from "@/lib/ai";
import type { Passage, Chapter } from "@/lib/chapters";

function pickRandomPassage(chapters: Chapter[]): { passage: Passage; chapterTitle: string } | null {
  const all: { passage: Passage; chapterTitle: string }[] = [];
  for (const ch of chapters) {
    for (const p of ch.passages) {
      if (p.original.length >= 15 && p.original.length <= 80) {
        all.push({ passage: p, chapterTitle: ch.title });
      }
    }
  }
  if (all.length === 0) return null;
  return all[Math.floor(Math.random() * all.length)];
}

export default function TranslateChallengePage() {
  // 初始为 null，挂载后在客户端随机选题：避免 SSR/CSR 各随机一次导致 hydration mismatch
  const [current, setCurrent] = useState<{ passage: Passage; chapterTitle: string } | null>(null);
  const [userTranslation, setUserTranslation] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  // 参考译文：提交后 AI 返回，展示给用户对照（原 showReference 只 set 不读，功能残缺）
  const [referenceTranslation, setReferenceTranslation] = useState<string | null>(null);
  // 全文数据按需加载，加载一次后缓存供 handleNext 复用
  const [chaptersData, setChaptersData] = useState<Chapter[] | null>(null);

  // 客户端挂载后动态加载全文并选题（消除 SSR/CSR 不一致 + 避免全文阻塞首屏）
  useEffect(() => {
    let cancelled = false;
    import("@/data/chapters").then(({ chapters }) => {
      if (cancelled) return;
      setChaptersData(chapters);
      setCurrent(pickRandomPassage(chapters));
    });
    return () => { cancelled = true; };
  }, []);

  // Load stats from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("translate_stats");
      if (saved) {
        const s = JSON.parse(saved);
        // 挂载后读 localStorage 初始化（hydration-safe）
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTotalAttempts(s.attempts || 0);
        setTotalScore(s.score || 0);
      }
    } catch {}
  }, []);

  const saveStats = (attempts: number, score: number) => {
    try {
      localStorage.setItem("translate_stats", JSON.stringify({ attempts, score }));
    } catch {}
  };

  const handleSubmit = useCallback(async () => {
    if (!userTranslation.trim() || loading || !current) return;
    setLoading(true);
    setScore(null);
    setFeedback(null);

    try {
      const reply = await deepseekChat({
        systemPrompt: `你是古汉语翻译评分专家。请评估用户的翻译。

评分标准（满分100）：
- 准确性（60分）：是否准确传达了原文意思
- 流畅度（25分）：白话表达是否通顺自然
- 文采（15分）：是否保留了原文的韵味

请按以下格式回复：
【评分】XX分
【评价】一句话点评（鼓励为主）
【参考译文】你的参考译文

注意：评价要积极鼓励，参考译文要优美。`,
        userMessage: `原文：${current.passage.original}

用户译文：${userTranslation}

请评分并给出参考译文。`,
        temperature: 0.5,
        maxTokens: 400,
      });

      // Parse score from reply
      const scoreMatch = reply.match(/【评分】\s*(\d+)/);
      const feedbackMatch = reply.match(/【评价】\s*(.+)/);
      const refMatch = reply.match(/【参考译文】\s*([\s\S]+)/);

      const s = scoreMatch ? parseInt(scoreMatch[1], 10) : 70;
      const fb = feedbackMatch ? feedbackMatch[1].trim() : reply;
      const newTotal = totalAttempts + 1;
      const newScore = totalScore + s;

      setScore(s);
      setFeedback(fb);
      setTotalAttempts(newTotal);
      setTotalScore(newScore);
      saveStats(newTotal, newScore);

      // 保存参考译文供用户对照
      if (refMatch) {
        setReferenceTranslation(refMatch[1].trim());
      }
    } catch (err) {
      setFeedback(`出错了：${err instanceof Error ? err.message : "请稍后再试"}`);
    } finally {
      setLoading(false);
    }
  }, [userTranslation, current, loading, totalAttempts, totalScore]);

  const handleNext = () => {
    if (chaptersData) setCurrent(pickRandomPassage(chaptersData));
    setUserTranslation("");
    setScore(null);
    setFeedback(null);
    setReferenceTranslation(null);
  };

  if (!current) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-[var(--text-secondary)]">暂无可用的挑战段落</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">古文今译</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            试译庄子原文，AI 为你评分
          </p>
        </div>
        {totalAttempts > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--text-accent)]">
              {Math.round(totalScore / totalAttempts)}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)]">
              均分 · {totalAttempts}次挑战
            </div>
          </div>
        )}
      </div>

      {/* Original text card */}
      <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] mb-4">
        <div className="text-[10px] text-[var(--text-secondary)] mb-2 tracking-wider">
          原文 · 《{current.chapterTitle}》
        </div>
        <p className="text-lg text-[var(--text-primary)] leading-loose tracking-wide">
          {current.passage.original}
        </p>
      </div>

      {/* User translation input */}
      <textarea
        value={userTranslation}
        onChange={(e) => setUserTranslation(e.target.value)}
        placeholder="在此输入你的白话译文…"
        disabled={score !== null}
        rows={4}
        className="w-full px-4 py-3 text-sm rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)]/30 resize-none mb-3"
      />

      {/* Action buttons */}
      <div className="flex gap-2 mb-4">
        {score === null ? (
          <button onClick={handleSubmit} disabled={loading || !userTranslation.trim()}
            className="flex-1 py-2.5 text-sm rounded-xl bg-[var(--text-accent)] text-white disabled:opacity-50 transition-opacity">
            {loading ? "评分中…" : "提交译文"}
          </button>
        ) : (
          <button onClick={handleNext}
            className="flex-1 py-2.5 text-sm rounded-xl border border-[var(--text-accent)] text-[var(--text-accent)] hover:bg-[var(--text-accent)] hover:text-white transition-colors">
            下一题 →
          </button>
        )}
      </div>

      {/* Score & Feedback */}
      {score !== null && (
        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-3 animate-in">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-[var(--text-accent)]">{score}</div>
            <div className="text-xs text-[var(--text-secondary)]">/100 分</div>
            <div className="flex-1 h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--text-accent)] transition-all duration-700"
                style={{ width: `${score}%` }} />
            </div>
          </div>
          {feedback && (
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{feedback}</p>
          )}
          {referenceTranslation && (
            <div className="pt-3 border-t border-[var(--border-light)]">
              <div className="text-xs font-medium text-[var(--text-accent)] mb-1.5">参考译文</div>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">{referenceTranslation}</p>
            </div>
          )}
          <div className="text-xs text-[var(--text-secondary)]">
            出自《{current.chapterTitle}》
          </div>
        </div>
      )}
    </div>
  );
}
