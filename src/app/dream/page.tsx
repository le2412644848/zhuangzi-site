"use client";

import { useState } from "react";

interface Scene {
  id: string;
  text: string;
  image?: string;
  choices: { text: string; nextId: string }[];
}

const STORY: Record<string, Scene> = {
  start: {
    id: "start",
    text: "昔者庄周梦为蝴蝶，栩栩然蝴蝶也，自喻适志与！不知周也。\n\n你睁开眼，发现自己变成了一只蝴蝶。阳光透过薄翼，世界以全新的角度展开。你振翅欲飞——",
    choices: [
      { text: "🦋 飞向花园，感受自由", nextId: "garden" },
      { text: "🌲 飞向森林，探索未知", nextId: "forest" },
    ],
  },
  garden: {
    id: "garden",
    text: "花园里百花盛开，蜜蜂在花间穿梭。你落在一朵牡丹上，花香浓郁。\n\n一只老蜜蜂对你说：\"蝴蝶啊，你整日翩翩起舞，可知花开花落不过朝夕？\"",
    choices: [
      { text: "\"朝夕之美，即是永恒。\"", nextId: "beauty" },
      { text: "\"既如此，更该珍惜此刻。\"", nextId: "cherish" },
    ],
  },
  forest: {
    id: "forest",
    text: "森林幽深，古木参天。你飞过溪流，穿过树洞，遇见一只巨大的螳螂。\n\n螳螂说：\"你以为你自由了，可你仍困在这具蝴蝶之躯里。真正的自由在哪？\"",
    choices: [
      { text: "\"自由在心，不在形。\"", nextId: "freedom" },
      { text: "\"我且飞我的，何必多问。\"", nextId: "flyon" },
    ],
  },
  beauty: {
    id: "beauty",
    text: "\"朝夕之美即是永恒\"——此言既出，花丛中忽然寂静。所有蜜蜂都停下工作看着你。\n\n那老蜂笑道：\"你这个小蝴蝶，竟参透了庄周的道理。天地有大美而不言。\"\n\n忽然，一阵风起——",
    choices: [
      { text: "🌬️ 随风而去，不问方向", nextId: "awake1" },
    ],
  },
  cherish: {
    id: "cherish",
    text: "\"更该珍惜此刻\"——你话音刚落，花瓣上滴落一滴露珠，倒映着你的蝶影。\n\n你忽然想起什么……好像有什么重要的事被遗忘了。一阵眩晕袭来——",
    choices: [
      { text: "😵 闭眼，任凭感觉牵引", nextId: "awake1" },
    ],
  },
  freedom: {
    id: "freedom",
    text: "\"自由在心，不在形\"——螳螂沉默良久，收起镰刀般的双臂。\n\n\"也许你说得对。我困于此林，却从未想过困我者唯我心也。\"\n\n你振翅飞起，阳光穿林而入——",
    choices: [
      { text: "☀️ 迎光飞去", nextId: "awake2" },
    ],
  },
  flyon: {
    id: "flyon",
    text: "你不答话，只是飞。飞过古藤，飞过青苔，飞过所有问题。\n\n飞本身就是答案。当你停止追问，世界忽然变得澄明——",
    choices: [
      { text: "✨ 继续飞", nextId: "awake2" },
    ],
  },
  awake1: {
    id: "awake1",
    text: "俄然觉，则蘧蘧然周也。\n\n你醒了。你是庄周，不是蝴蝶。\n\n但你分不清：究竟是庄周梦见了蝴蝶，还是蝴蝶梦见了庄周？",
    choices: [
      { text: "🔁 再梦一次", nextId: "start" },
      { text: "📖 去读《齐物论》", nextId: "read" },
    ],
  },
  awake2: {
    id: "awake2",
    text: "不知周之梦为蝴蝶与，蝴蝶之梦为周与？\n\n你醒了。但这次不同——你不再纠结于谁梦见了谁。\n\n周与蝴蝶，则必有分矣。此之谓物化。",
    choices: [
      { text: "🔁 再梦一次", nextId: "start" },
      { text: "📖 去读《齐物论》", nextId: "read" },
    ],
  },
  read: {
    id: "read",
    text: "此之谓物化。\n\n庄子在《齐物论》中讲述了这段梦蝶的故事。他借梦境告诉我们：\n现实与虚幻、自我与他者之间的界限，可能并不像我们以为的那样分明。\n\n当你执着于\"我是谁\"时，不妨想想那只蝴蝶。",
    choices: [
      { text: "🔁 重新开始", nextId: "start" },
      { text: "📖 阅读《齐物论》原文", nextId: "read" },
    ],
  },
};

export default function DreamPage() {
  const [sceneId, setSceneId] = useState("start");
  const [history, setHistory] = useState<string[]>(["start"]);
  const [animating, setAnimating] = useState(false);

  const scene = STORY[sceneId];

  const handleChoice = (nextId: string) => {
    setAnimating(true);
    setTimeout(() => {
      setSceneId(nextId);
      setHistory((prev) => [...prev, nextId]);
      setAnimating(false);
    }, 400);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className={`max-w-md w-full transition-opacity duration-500 ${animating ? "opacity-0" : "opacity-100"}`}>
        {/* Scene number */}
        <div className="text-center mb-6">
          <div className="text-[10px] text-[var(--text-secondary)] tracking-widest mb-1">
            庄周梦蝶 · 交互叙事
          </div>
          <div className="text-4xl mb-2">🦋</div>
        </div>

        {/* Story text */}
        <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] mb-6 shadow-sm">
          <p className="text-sm text-[var(--text-primary)] leading-loose whitespace-pre-line">
            {scene.text}
          </p>
        </div>

        {/* Choices */}
        <div className="space-y-3">
          {scene.choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => handleChoice(choice.nextId)}
              disabled={animating}
              className="w-full text-left p-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] hover:border-[var(--text-accent)] hover:shadow-sm transition-all text-sm text-[var(--text-primary)] disabled:opacity-50"
            >
              {choice.text}
            </button>
          ))}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-8">
          {history.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === history.length - 1 ? "bg-[var(--text-accent)]" : "bg-[var(--border-light)]"
              }`}
            />
          ))}
        </div>

        {/* Reset */}
        {history.length > 3 && (
          <button
            onClick={() => { setSceneId("start"); setHistory(["start"]); }}
            className="block mx-auto mt-4 text-xs text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors"
          >
            重新开始
          </button>
        )}
      </div>
    </div>
  );
}
