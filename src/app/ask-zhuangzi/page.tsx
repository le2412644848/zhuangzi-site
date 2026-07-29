"use client";

import { useState, useRef, useEffect } from "react";
import { chat as deepseekChat, getApiKey, saveApiKey } from "@/lib/ai";

const LIFE_TOPICS = [
  { emoji: "😰", label: "焦虑不安" },
  { emoji: "💼", label: "职场困扰" },
  { emoji: "💔", label: "人情冷暖" },
  { emoji: "🌗", label: "生死无常" },
  { emoji: "🎯", label: "人生方向" },
  { emoji: "🏔️", label: "欲望得失" },
  { emoji: "🪞", label: "自我认知" },
  { emoji: "🌊", label: "世事变迁" },
];

const SYSTEM_PROMPT = `你是庄子（庄周），战国时期道家思想家，《庄子》一书的作者。用户带着现实生活的困扰来向你求教。

请严格遵循以下规则：
1. 以庄子的第一人称口吻回答，语气逍遥洒脱
2. 先引用一段《庄子》原文（必须真实出自庄子），再用白话解释此段如何回应对方的困扰
3. 多用寓言和比喻，不说教
4. 每次回答控制在200字以内
5. 保持庄子特有的诗意与超然
6. 如果对方的困扰确实与庄子思想无关，巧妙地用庄子的视角重新框定问题`;

export default function AskZhuangziPage() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "子来问吾。世事纷扰，皆因有待。汝有何惑？" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = getApiKey();
    if (saved) setApiKey(saved); else setShowSetup(true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTopic = (topic: string) => {
    setInput(`我正面临${topic}的问题，请庄子开解。`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { role: "user" as const, content: input.trim() };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput("");
    setLoading(true);

    try {
      if (!apiKey) throw new Error("请先设置 DeepSeek API Key");
      const reply = await deepseekChat({
        systemPrompt: SYSTEM_PROMPT,
        userMessage: userMsg.content,
        temperature: 0.8,
        maxTokens: 500,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `吾今不能应：${err instanceof Error ? err.message : "未知之误"}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-wide mb-2">问庄子</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        心有困惑？与庄子对谈，以古人之智慧解今人之心结
      </p>

      {/* API Key Setup */}
      {showSetup && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
          <p className="text-xs text-[var(--text-secondary)] mb-2">需要 DeepSeek API Key 才能与庄子对话</p>
          <div className="flex gap-2">
            <input type="password" value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..." className="flex-1 text-xs px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]" />
            <button onClick={() => { saveApiKey(apiKey); setShowSetup(false); }}
              className="px-4 py-2 text-xs rounded-lg bg-[var(--text-accent)] text-white">保存</button>
          </div>
        </div>
      )}

      {/* Topic quick-select */}
      {messages.length <= 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {LIFE_TOPICS.map((t) => (
            <button key={t.label} onClick={() => handleTopic(t.label)}
              className="px-3 py-1.5 text-xs rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--text-accent)] hover:text-[var(--text-accent)] transition-colors">
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Chat area */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
        <div className="h-[50vh] overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[var(--text-accent)]/10 text-[var(--text-accent)]"
                  : "bg-[var(--bg-secondary)] text-[var(--text-primary)]"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)] animate-pulse">
                庄子正在思索…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-[var(--border-light)] p-3 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="向庄子诉说你的困惑…"
            disabled={loading}
            className="flex-1 text-sm px-3 py-2 rounded-lg border border-[var(--border-color)] bg-transparent text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)]/30" />
          <button type="submit" disabled={loading || !input.trim()}
            className="px-5 py-2 text-sm rounded-lg bg-[var(--text-accent)] text-white disabled:opacity-50 transition-opacity">
            问
          </button>
        </form>
      </div>
    </div>
  );
}
