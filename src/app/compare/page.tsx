"use client";

import { useState } from "react";

import { chat as deepseekChat } from "@/lib/ai";
import { search } from "@/lib/search";

// 2026-08-24 视觉复审：emoji 换「印章字」（单字入印，随主题换色）
const TOPICS = [
  { id: "life-death", label: "生死观", icon: "命" },
  { id: "freedom", label: "自由", icon: "遊" },
  { id: "governance", label: "治国之道", icon: "治" },
  { id: "human-nature", label: "人性", icon: "性" },
  { id: "knowledge", label: "求知", icon: "知" },
  { id: "happiness", label: "幸福", icon: "樂" },
  { id: "ethics", label: "仁义道德", icon: "仁" },
  { id: "nature", label: "天人关系", icon: "天" },
];

const SCHOOLS = [
  { id: "zhuangzi", label: "庄子", selected: true },
  { id: "laozi", label: "老子", selected: true },
  { id: "confucius", label: "孔子", selected: false },
  { id: "mencius", label: "孟子", selected: false },
  { id: "mozi", label: "墨子", selected: false },
  { id: "hanfeizi", label: "韩非子", selected: false },
];

export default function ComparePage() {
  const [topic, setTopic] = useState<string | null>(null);
  const [selectedSchools, setSelectedSchools] = useState(
    SCHOOLS.filter((s) => s.selected).map((s) => s.id)
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const toggleSchool = (id: string) => {
    setSelectedSchools((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleCompare = async () => {
    if (!topic || selectedSchools.length < 2) return;
    setLoading(true);
    try {
      const schoolNames = SCHOOLS.filter((s) => selectedSchools.includes(s.id)).map((s) => s.label);

      // 与「问庄子」同款 RAG：检索与话题相关的原文段落注入 system prompt，
      // 要求庄子一方优先引用原文 —— 否则各家「代表原文」全凭模型记忆，
      // 容易失真（站内就有精确语料，没有理由不用）。
      let contextBlock = "";
      try {
        const searchResults = await search(topic);
        if (searchResults.length > 0) {
          const context = searchResults
            .slice(0, 3)
            .map((r) => `《${r.chapterTitle}》：「${r.original.slice(0, 100)}」`)
            .join("\n");
          contextBlock = `\n\n以下是与话题相关的《庄子》原文段落，庄子部分请优先从中引用：\n${context}`;
        }
      } catch {
        // 检索失败则退回无上下文对话
      }

      const response = await deepseekChat({
        systemPrompt: `你是中国古代哲学比较研究专家。请并排对比各家思想。

格式要求：
1. 先以一段（50字）总览这个话题在各家思想中的异同
2. 然后每家单独一段：【学派名】核心观点 + 一句代表原文
3. 最后一句总结性启示
4. 整段300字以内，学术但易懂${contextBlock}`,
        userMessage: `话题：${topic}。对比学派：${schoolNames.join("、")}。请给出并排对比。`,
        temperature: 0.5,
        maxTokens: 500,
      });
      setResult(response);
    } catch (err) {
      setResult(`出错了：${err instanceof Error ? err.message : "请稍后再试"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-wide mb-2">诸子对谈</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        同一话题，不同视角。选一个话题，看诸子如何各抒己见
      </p>

      {/* Topic selection */}
      <div className="mb-6">
        <h3 className="text-xs font-medium text-[var(--text-secondary)] mb-2 tracking-wider">选择话题</h3>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button key={t.id} onClick={() => setTopic(t.label)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                topic === t.label
                  ? "bg-[var(--text-accent)] text-white"
                  : "border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-accent)]"
              }`}>
              <span className="seal-char" aria-hidden="true">
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* School selection */}
      <div className="mb-6">
        <h3 className="text-xs font-medium text-[var(--text-secondary)] mb-2 tracking-wider">选择学派（至少2家）</h3>
        <div className="flex flex-wrap gap-2">
          {SCHOOLS.map((s) => (
            <button key={s.id} onClick={() => toggleSchool(s.id)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                selectedSchools.includes(s.id)
                  ? "bg-[var(--text-accent)]/10 text-[var(--text-accent)] border border-[var(--text-accent)]/30"
                  : "border border-[var(--border-light)] text-[var(--text-secondary)]"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compare button */}
      <button onClick={handleCompare} disabled={!topic || selectedSchools.length < 2 || loading}
        className="w-full py-3 rounded-xl bg-[var(--text-accent)] text-white text-sm font-medium disabled:opacity-50 transition-opacity mb-6">
        {loading ? "诸子正在辩论…" : "开始对比"}
      </button>

      {/* Result */}
      {result && (
        <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="text-xs text-[var(--text-secondary)] mb-2">
            {topic} · {selectedSchools.map((id) => SCHOOLS.find((s) => s.id === id)?.label).join(" vs ")}
          </div>
          <div className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
            {result}
          </div>
        </div>
      )}
    </div>
  );
}
