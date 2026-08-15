// ──────────────────────────────────────────
// Cloudflare Pages Function — DeepSeek API proxy
// Supports both regular and SSE streaming responses.
// ──────────────────────────────────────────

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

// Simple in-memory rate limiter (per-IP, per 10s window)
const RATE_WINDOW = 10_000;
const RATE_MAX = 8;
const rateMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateMap.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_MAX;
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequest(context) {
  const { request } = context;

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  if (!checkRateLimit(ip)) {
    return jsonError("请求太频繁，请稍后再试", 429);
  }

  try {
    const body = await request.json();
    const { messages, key, stream, ...opts } = body;

    if (!key) return jsonError("请先设置 DeepSeek API Key", 401);
    if (!messages || !Array.isArray(messages)) return jsonError("缺少对话内容", 400);

    const payload = {
      model: "deepseek-v4-flash",
      messages,
      max_tokens: opts.maxTokens ?? 512,
      temperature: opts.temperature ?? 0.7,
      stream: stream === true,
    };

    const response = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      return jsonError(`DeepSeek API 错误: ${errText}`, response.status);
    }

    // ── Streaming: proxy the SSE stream ──
    if (stream) {
      return new Response(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no", // Disable nginx buffering if present
        },
      });
    }

    // ── Non-streaming: return complete response ──
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "吾默然。";

    return new Response(JSON.stringify({ content }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return jsonError("服务暂时不可用", 502);
  }
}
