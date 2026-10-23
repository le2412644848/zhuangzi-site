"use client";

import { useEffect, useRef, useState } from "react";

const textSettings = [
  { key: "fontSize", label: "字号", values: ["sm", "base", "lg", "xl"], labels: ["小", "中", "大", "特大"] },
  { key: "lineHeight", label: "行距", values: ["1.6", "1.9", "2.2", "2.5"], labels: ["窄", "标准", "宽", "特宽"] },
  { key: "readingWidth", label: "版心", values: ["narrow", "normal", "wide"], labels: ["窄", "标准", "宽"] },
] as const;

/** 设置值 → CSS 长度（localStorage 存符号值，:root 变量存可用的 CSS 值） */
const CSS_VALUE_MAP: Record<string, Record<string, string>> = {
  fontSize: { sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem" },
  lineHeight: { "1.6": "1.6", "1.9": "1.9", "2.2": "2.2", "2.5": "2.5" },
  readingWidth: { narrow: "36rem", normal: "48rem", wide: "56rem" },
};

function cssValue(key: string, val: string): string {
  return CSS_VALUE_MAP[key]?.[val] ?? val;
}

type SoundMode = "none" | "guqin" | "rain";

/**
 * 纯 Web Audio API 程序化书斋声音合成引擎（零外部音频文件加载）
 */
class StudyAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private guqinTimer: number | null = null;
  private currentMode: SoundMode = "none";

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private createPinkNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.76160 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  public stop() {
    this.currentMode = "none";
    if (this.guqinTimer) {
      window.clearTimeout(this.guqinTimer);
      this.guqinTimer = null;
    }
    if (this.lfo) {
      try { this.lfo.stop(); this.lfo.disconnect(); } catch {}
      this.lfo = null;
    }
    if (this.noiseNode) {
      try { this.noiseNode.stop(); this.noiseNode.disconnect(); } catch {}
      this.noiseNode = null;
    }
    if (this.noiseGain) {
      try { this.noiseGain.disconnect(); } catch {}
      this.noiseGain = null;
    }
    if (this.filter) {
      try { this.filter.disconnect(); } catch {}
      this.filter = null;
    }
    if (this.ctx && this.ctx.state !== "closed") {
      try { this.ctx.suspend(); } catch {}
    }
  }

  public playRain() {
    this.stop();
    this.currentMode = "rain";
    const ctx = this.ensureContext();

    // 竹林听雨：双声道粉红噪声缓冲区 + BiquadFilterNode (lowpass 800Hz + 缓慢 LFO 调制)
    // 音量控制在 gain = 0.04
    const pinkBuffer = this.createPinkNoiseBuffer(ctx, 4);
    const noise = ctx.createBufferSource();
    noise.buffer = pinkBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    // 缓慢 LFO 调制 0.15Hz（沙沙微风雨韵）
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(150, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.04, ctx.currentTime);

    noise.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);
    noise.start();

    this.noiseNode = noise;
    this.filter = filter;
    this.lfo = lfo;
    this.noiseGain = masterGain;
  }

  public playGuqin() {
    this.stop();
    this.currentMode = "guqin";
    const ctx = this.ensureContext();

    // 极轻柔底噪（超低音量粉红噪声）
    const pinkBuffer = this.createPinkNoiseBuffer(ctx, 4);
    const noise = ctx.createBufferSource();
    noise.buffer = pinkBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320, ctx.currentTime);

    const floorGain = ctx.createGain();
    floorGain.gain.setValueAtTime(0.008, ctx.currentTime);

    noise.connect(filter);
    filter.connect(floorGain);
    floorGain.connect(ctx.destination);
    noise.start();

    this.noiseNode = noise;
    this.noiseGain = floorGain;

    // 中国五声音阶：宫商角徵羽
    const PENTATONIC = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63];

    const pluck = (freq: number) => {
      if (this.currentMode !== "guqin" || !this.ctx || this.ctx.state === "closed") return;
      const now = this.ctx.currentTime;

      // 古琴正弦 + 泛音包络：快速起音 0.08s，悠长古琴余韵指数衰减 4.2s
      const harmonics = [
        { mult: 1, gain: 0.08, decay: 4.2 },
        { mult: 2, gain: 0.035, decay: 3.2 },
        { mult: 3, gain: 0.015, decay: 2.4 },
      ];

      harmonics.forEach(({ mult, gain, decay }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq * mult, now);

        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(gain, now + 0.08);
        g.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(g);
        g.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + decay + 0.1);
      });
    };

    const scheduleNext = () => {
      if (this.currentMode !== "guqin") return;
      const freq = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)] ?? 196.00;
      pluck(freq);

      const nextDelay = 4500 + Math.random() * 2500;
      this.guqinTimer = window.setTimeout(scheduleNext, nextDelay);
    };

    scheduleNext();
  }
}

export default function ReadingSettings() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [jiazhuMode, setJiazhuMode] = useState<"standard" | "jiazhu">("standard");
  const [soundMode, setSoundMode] = useState<SoundMode>("none");
  const audioEngineRef = useRef<StudyAudioEngine | null>(null);

  // 初始化音效引擎
  useEffect(() => {
    audioEngineRef.current = new StudyAudioEngine();
    return () => {
      audioEngineRef.current?.stop();
    };
  }, []);

  // Escape 关闭（下拉面板的标准键盘行为）
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // 读取与应用 localStorage
  useEffect(() => {
    const saved = localStorage.getItem("readingSettings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Record<string, string>;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValues(parsed);
        for (const [k, v] of Object.entries(parsed)) {
          document.documentElement.style.setProperty(`--reading-${k}`, cssValue(k, v));
        }
      } catch {}
    }

    // 双行夹注持久化状态
    const savedJiazhu = localStorage.getItem("zhuangzi-jiazhu-mode");
    if (savedJiazhu === "jiazhu") {
      document.documentElement.classList.add("jiazhu-mode");
      setJiazhuMode("jiazhu");
    }
  }, []);

  const applyTextSetting = (key: string, val: string) => {
    const next = { ...values, [key]: val };
    setValues(next);
    localStorage.setItem("readingSettings", JSON.stringify(next));
    document.documentElement.style.setProperty(`--reading-${key}`, cssValue(key, val));
  };

  const handleJiazhuChange = (mode: "standard" | "jiazhu") => {
    setJiazhuMode(mode);
    document.documentElement.classList.toggle("jiazhu-mode", mode === "jiazhu");
    localStorage.setItem("zhuangzi-jiazhu-mode", mode);
  };

  const handleSoundChange = (mode: SoundMode) => {
    setSoundMode(mode);
    if (!audioEngineRef.current) return;
    if (mode === "rain") {
      audioEngineRef.current.playRain();
    } else if (mode === "guqin") {
      audioEngineRef.current.playGuqin();
    } else {
      audioEngineRef.current.stop();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="min-w-[32px] min-h-[32px] flex items-center justify-center p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors"
        title="阅读设置"
        aria-label="阅读设置"
        aria-expanded={open}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
      </button>

      {open && (
        <>
          {/* 点击遮罩关闭：装饰性背景，对读屏隐藏（键盘用 Escape） */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-full mt-2 z-50 w-64 p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xl animate-fade-in text-[var(--text-primary)]">
            <div className="text-xs font-semibold text-[var(--text-accent)] mb-3 pb-1 border-b border-[var(--border-light)] tracking-[0.06em]">
              阅读与书斋设置
            </div>

            {/* 1. 排版设置 */}
            {textSettings.map((s) => (
              <div key={s.key} className="mb-3">
                <div className="text-[11px] text-[var(--text-secondary)] mb-1 font-medium">{s.label}</div>
                <div className="flex gap-1">
                  {s.values.map((v, i) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => applyTextSetting(s.key, v)}
                      className={`flex-1 text-xs py-1 rounded transition-colors ${
                        values[s.key] === v || (!values[s.key] && i === 1)
                          ? "bg-[var(--text-accent)]/15 text-[var(--text-accent)] font-medium shadow-xs"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                      }`}
                    >
                      {s.labels[i]}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* 2. 注疏版式（宋刻双行夹注） */}
            <div className="mb-3 pt-2 border-t border-[var(--border-light)]">
              <div className="text-[11px] text-[var(--text-secondary)] mb-1 font-medium">注疏版式</div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleJiazhuChange("standard")}
                  className={`flex-1 text-xs py-1 rounded transition-colors ${
                    jiazhuMode === "standard"
                      ? "bg-[var(--text-accent)]/15 text-[var(--text-accent)] font-medium shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  标准
                </button>
                <button
                  type="button"
                  onClick={() => handleJiazhuChange("jiazhu")}
                  className={`flex-1 text-xs py-1 rounded transition-colors ${
                    jiazhuMode === "jiazhu"
                      ? "bg-[var(--text-accent)]/15 text-[var(--text-accent)] font-medium shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  双行夹注
                </button>
              </div>
            </div>

            {/* 3. 书斋清音（伴读环境音合成器） */}
            <div className="pt-2 border-t border-[var(--border-light)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[var(--text-secondary)] font-medium">书斋清音</span>
                <span className="text-[10px] text-[var(--text-muted)]">Web Audio</span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleSoundChange("none")}
                  className={`flex-1 text-xs py-1 rounded transition-colors ${
                    soundMode === "none"
                      ? "bg-[var(--text-accent)]/15 text-[var(--text-accent)] font-medium shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  静音
                </button>
                <button
                  type="button"
                  onClick={() => handleSoundChange("guqin")}
                  className={`flex-1 text-xs py-1 rounded transition-colors ${
                    soundMode === "guqin"
                      ? "bg-[var(--text-accent)]/15 text-[var(--text-accent)] font-medium shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  古琴泛音
                </button>
                <button
                  type="button"
                  onClick={() => handleSoundChange("rain")}
                  className={`flex-1 text-xs py-1 rounded transition-colors ${
                    soundMode === "rain"
                      ? "bg-[var(--text-accent)]/15 text-[var(--text-accent)] font-medium shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  竹林听雨
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
