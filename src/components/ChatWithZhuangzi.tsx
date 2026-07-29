"use client";

import { useState, useRef, useEffect } from "react";
import { chatMultiTurnStream, getApiKey, saveApiKey } from "@/lib/ai";
import { search } from "@/lib/search";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWithZhuangzi() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "子有何问？吾将应之。" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = getApiKey();
    if (saved) setApiKey(saved);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSaveApiKey = () => {
    saveApiKey(apiKey);
    setShowConfig(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      if (!apiKey) {
        throw new Error("请先设置 DeepSeek API Key");
      }

      const SYSTEM_PROMPT = `你是一个庄子哲学助手。请以庄子的口吻回答用户的问题。
规则：
1. 引用《庄子》原文回答（用白话解释）
2. 保持庄子式的诗意和智慧
3. 不要直接说教，多用比喻和寓言
4. 回答简洁有力，200字以内
5. 如果用户的问题与庄子哲学无关，巧妙地将话题引向庄子`;

      // RAG: inject relevant passages as context
      let contextPrompt = SYSTEM_PROMPT;
      try {
        const searchResults = await search(userMsg.content);
        if (searchResults.length > 0) {
          const topPassages = searchResults.slice(0, 3);
          const context = topPassages.map((r) =>
            `《${r.chapterTitle}》：「${r.original.slice(0, 100)}」`
          ).join("\n");
          contextPrompt = `${SYSTEM_PROMPT}\n\n以下是与对方问题相关的《庄子》原文段落，请尽可能引用：\n${context}`;
        }
      } catch {
        // Fall through without context
      }

      // Stream reply — append chunks incrementally
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      await chatMultiTurnStream(
        [
          { role: "system", content: contextPrompt },
          ...updatedMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        ],
        (delta) => {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last && last.role === "assistant") {
              copy[copy.length - 1] = { ...last, content: last.content + delta };
            }
            return copy;
          });
        },
        { temperature: 0.7, maxTokens: 512 }
      );
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `吾今不能应：${err instanceof Error ? err.message : "未知之误"}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Collapsed: just a small floating button
  if (!open) {
    return (
      <div className="fixed bottom-4 right-4 z-50 no-print">
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 rounded-full bg-[var(--text-accent)] text-white shadow-md hover:shadow-lg hover:bg-[var(--color-accent-deep)] transition-all flex items-center justify-center"
          title="问庄子"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </button>
      </div>
    );
  }

  // Expanded: full chat widget
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 shadow-xl rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] no-print">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-light)]">
        <span className="text-sm font-medium text-[var(--text-accent)] tracking-wider">
          问庄子
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-accent)] p-1"
            title="设置"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-accent)] p-1"
            title="收起"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="px-3 py-2 border-b border-[var(--border-light)] bg-[var(--bg-secondary)]">
          <div className="text-xs text-[var(--text-secondary)] mb-1">DeepSeek API Key</div>
          <div className="flex gap-1">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 text-xs px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)]"
            />
            <button onClick={handleSaveApiKey} className="text-xs px-2 py-1 rounded bg-[var(--text-accent)] text-white">
              保存
            </button>
          </div>
        </div>
      )}

      <div className="h-64 overflow-y-auto px-3 py-2 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`text-xs leading-relaxed ${msg.role === "assistant" ? "text-[var(--text-primary)]" : "text-[var(--text-accent)] text-right"}`}>
            <span className={`inline-block px-2 py-1 rounded-lg max-w-[85%] ${msg.role === "assistant" ? "bg-[var(--bg-secondary)]" : "bg-[var(--text-accent)]/10"}`}>
              {msg.content}
            </span>
          </div>
        ))}
        {loading && <div className="text-xs text-[var(--text-secondary)] italic">庄子正在思索…</div>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-[var(--border-light)] p-2 flex gap-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="问庄子一个问题…"
          disabled={loading}
          className="flex-1 text-xs px-2 py-1.5 rounded border border-[var(--border-color)] bg-transparent text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-accent)]"
        />
        <button type="submit" disabled={loading || !input.trim()} className="px-3 py-1.5 text-xs rounded bg-[var(--text-accent)] text-white disabled:opacity-50">
          问
        </button>
      </form>
    </div>
  );
}
