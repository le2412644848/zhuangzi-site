/**
 * Shared DeepSeek AI utility — used by all AI-powered features.
 *
 * When deployed on Cloudflare Pages, requests are proxied through
 * /api/chat (Pages Function) for rate limiting and security.
 * Falls back to direct DeepSeek API in local development.
 */

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const PROXY_URL = "/api/chat";
const MODEL = "deepseek-v4-flash";

export function getApiKey(): string | null {
  try {
    return localStorage.getItem("deepseek_key");
  } catch {
    return null;
  }
}

export function saveApiKey(key: string): void {
  localStorage.setItem("deepseek_key", key);
}

export interface ChatOptions {
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

async function callDirect(url: string, messages: { role: string; content: string }[], apiKey: string, opts: { temperature?: number; maxTokens?: number; signal?: AbortSignal }): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: opts.maxTokens ?? 500,
      temperature: opts.temperature ?? 0.7,
    }),
    signal: opts.signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek API 错误 (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "吾默然。";
}

async function callViaProxy(messages: { role: string; content: string }[], apiKey: string, opts: { temperature?: number; maxTokens?: number; signal?: AbortSignal }): Promise<string> {
  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: apiKey,
      messages,
      maxTokens: opts.maxTokens ?? 500,
      temperature: opts.temperature ?? 0.7,
    }),
    signal: opts.signal,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error((errData as { error?: string }).error || `代理请求失败 (${res.status})`);
  }

  const data = await res.json();
  return data.content || "吾默然。";
}

export async function chat(options: ChatOptions): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("请先设置 DeepSeek API Key（点击右下角 ⚙️）");
  }

  const messages = [
    { role: "system", content: options.systemPrompt },
    { role: "user", content: options.userMessage },
  ];

  // Try proxy first (Cloudflare Pages Function), fallback to direct
  try {
    return await callViaProxy(messages, apiKey, options);
  } catch (proxyErr) {
    // Proxy not available (local dev) or returned error — try direct
    try {
      return await callDirect(DEEPSEEK_URL, messages, apiKey, options);
    } catch {
      // If proxy already gave a meaningful error, rethrow it
      throw proxyErr;
    }
  }
}

export async function chatMultiTurn(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("请先设置 DeepSeek API Key（点击右下角 ⚙️）");
  }

  // Try proxy first, fallback to direct
  try {
    return await callViaProxy(messages, apiKey, { temperature: opts?.temperature, maxTokens: opts?.maxTokens });
  } catch (proxyErr) {
    try {
      return await callDirect(DEEPSEEK_URL, messages, apiKey, { temperature: opts?.temperature, maxTokens: opts?.maxTokens });
    } catch {
      throw proxyErr;
    }
  }
}

/**
 * Streaming multi-turn chat — yields content deltas via onChunk.
 * Returns the complete response text.
 */
export async function chatMultiTurnStream(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  onChunk: (text: string) => void,
  opts?: { temperature?: number; maxTokens?: number; signal?: AbortSignal }
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("请先设置 DeepSeek API Key（点击右下角 ⚙️）");
  }

  const payload = {
    key: apiKey,
    messages,
    maxTokens: opts?.maxTokens ?? 512,
    temperature: opts?.temperature ?? 0.7,
    stream: true,
  };

  let res: Response;
  try {
    res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: opts?.signal,
    });
  } catch {
    // Proxy unavailable — try direct DeepSeek
    res = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: payload.maxTokens,
        temperature: payload.temperature,
        stream: true,
      }),
      signal: opts?.signal,
    });
  }

  if (!res.ok) {
    throw new Error(`API 请求失败 (${res.status})`);
  }

  // Parse SSE stream
  const reader = res.body?.getReader();
  if (!reader) throw new Error("无法读取响应流");

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          onChunk(delta);
        }
      } catch {
        // Skip unparseable chunks
      }
    }
  }

  return fullText || "吾默然。";
}
