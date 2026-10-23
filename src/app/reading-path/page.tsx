"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { chaptersMeta } from "@/data/chapters/metadata";
import { chat as deepseekChat } from "@/lib/ai";

interface Question {
  id: number;
  text: string;
  options: { label: string; value: string; desc: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "你最常被哪种情绪困扰？",
    options: [
      { label: "焦虑不安", value: "anxiety", desc: "总担心未来，无法活在当下" },
      { label: "患得患失", value: "attachment", desc: "得到了怕失去，失去了不甘心" },
      { label: "人际纷争", value: "conflict", desc: "与人相处总是磕磕绊绊" },
      { label: "意义迷茫", value: "meaning", desc: "不知道活着为了什么" },
    ],
  },
  {
    id: 2,
    text: "你对庄子的了解程度？",
    options: [
      { label: "刚接触", value: "beginner", desc: "只听过名字或几句名言" },
      { label: "略有所知", value: "intermediate", desc: "读过一些篇章或解读" },
      { label: "颇有心得", value: "advanced", desc: "已通读多篇，想深入" },
    ],
  },
  {
    id: 3,
    text: "你更喜欢哪种阅读风格？",
    options: [
      { label: "故事寓言", value: "story", desc: "喜欢听故事，从故事中悟道理" },
      { label: "哲理思辨", value: "philosophy", desc: "喜欢逻辑推理和思想碰撞" },
      { label: "诗意境界", value: "poetic", desc: "喜欢优美的文字和意境" },
    ],
  },
  {
    id: 4,
    text: "你当前最需要什么？",
    options: [
      { label: "内心平静", value: "peace", desc: "想要获得心灵安宁" },
      { label: "处世智慧", value: "wisdom", desc: "想知道如何更好地生活" },
      { label: "超越视角", value: "transcend", desc: "想跳出现有的思维框架" },
    ],
  },
  {
    id: 5,
    text: "你的阅读耐心如何？",
    options: [
      { label: "碎片时间", value: "short", desc: "每次10分钟左右" },
      { label: "中等投入", value: "medium", desc: "愿意花30分钟细读" },
      { label: "深度沉浸", value: "long", desc: "可以一口气读很久" },
    ],
  },
];

const CHAPTER_MAP: Record<string, string[]> = {
  anxiety: ["01-xiaoyao-you", "04-renjian-shi", "19-dasheng"],
  attachment: ["02-qiwu-lun", "17-qiushui", "20-shanmu"],
  conflict: ["04-renjian-shi", "05-dechong-fu", "23-gengsangchu"],
  meaning: ["02-qiwu-lun", "06-dazong-shi", "18-zhile"],
  peace: ["01-xiaoyao-you", "15-keyi", "19-dasheng"],
  wisdom: ["03-yangsheng-zhu", "04-renjian-shi", "20-shanmu"],
  transcend: ["01-xiaoyao-you", "02-qiwu-lun", "17-qiushui"],
};

export default function ReadingPathPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [recommendedChapters, setRecommendedChapters] = useState<
    typeof chaptersMeta
  >([]);

  const generateRecommendation = useCallback(
    async (finalAnswers: Record<number, string>) => {
      setLoading(true);
      try {
        const allChIds = new Set<string>();
        for (const [, val] of Object.entries(finalAnswers)) {
          const ids = CHAPTER_MAP[val];
          if (ids) ids.forEach((id) => allChIds.add(id));
        }
        const recs = chaptersMeta
          .filter((ch) => allChIds.has(ch.id))
          .slice(0, 5);
        setRecommendedChapters(recs);

        try {
          const aiReasoning = await deepseekChat({
            systemPrompt: `你是庄子研究专家。请根据用户的阅读偏好问卷结果，解释为什么推荐这些庄子篇章给他们。语气亲切有文采，150字以内。`,
            userMessage: `用户选择了：${JSON.stringify(
              finalAnswers
            )}。推荐篇章：${recs.map((r) => r.title).join("、")}。请解释推荐理由。`,
            temperature: 0.7,
            maxTokens: 250,
          });
          setRecommendation(aiReasoning);
        } catch {
          setRecommendation("根据你的偏好，以下篇章最能回应你当下的困惑与心境。");
        }
      } catch {
        setRecommendation("生成推荐时出现波动，请稍后再试。");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleAnswer = (qId: number, value: string) => {
    const newAnswers = { ...answers, [qId]: value };
    setAnswers(newAnswers);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // 最后一题直接出结果，消除多余确认屏
      setStep(QUESTIONS.length);
      void generateRecommendation(newAnswers);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  if (step < QUESTIONS.length) {
    const q = QUESTIONS[step]!;
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="mb-6">
          <div className="flex gap-1 mb-4">
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  i < step
                    ? "bg-[var(--text-accent)]"
                    : "bg-[var(--border-light)]"
                }`}
              />
            ))}
          </div>

          {/* 答题卡顶部导航：上一题按钮与进度 */}
          <div className="flex items-center justify-between mb-3 min-h-[28px]">
            {step > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors flex items-center gap-1 font-serif cursor-pointer"
              >
                ← 上一题
              </button>
            ) : (
              <span />
            )}
            <span className="text-xs font-serif text-[var(--text-muted)]">
              第 {step + 1} / {QUESTIONS.length} 题
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-wide mb-1.5 text-[var(--text-primary)]">
            寻找你的阅读起点
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            因心之所向，寻篇章所契
          </p>
        </div>

        <h2 className="text-base sm:text-lg font-serif font-medium mb-4 text-[var(--text-primary)]">
          {q.text}
        </h2>

        <div className="space-y-3">
          {q.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleAnswer(q.id, opt.value)}
              className="w-full text-left p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--text-accent)] hover:shadow-xs transition-all group cursor-pointer"
            >
              <div className="font-serif font-medium text-sm text-[var(--text-primary)] group-hover:text-[var(--text-accent)] transition-colors">
                {opt.label}
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-1 font-serif">
                {opt.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 推荐结果页
  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1 mb-2">
          <span className="seal-char" aria-hidden="true">程</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-wide mb-1.5 text-[var(--text-primary)]">
          你的阅读路径
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          循心而问，为你量身遴选的庄子入门卷次
        </p>
      </div>

      {loading && (
        <div className="text-center py-10 space-y-3">
          <div className="animate-spin w-6 h-6 border-2 border-[var(--text-accent)] border-t-transparent rounded-full mx-auto" />
          <div className="text-xs font-serif text-[var(--text-secondary)]">
            正在为你推演研读长卷…
          </div>
        </div>
      )}

      {recommendation && (
        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] mb-6 shadow-xs">
          <div className="text-xs font-serif font-medium text-[var(--text-accent)] mb-1.5">
            研读札记导引
          </div>
          <p className="text-sm font-serif text-[var(--text-primary)] leading-relaxed">
            {recommendation}
          </p>
        </div>
      )}

      {recommendedChapters.length > 0 && (
        <div className="space-y-3">
          {recommendedChapters.map((ch) => (
            <Link
              key={ch.id}
              href={`/chapters/${ch.id}`}
              className="block p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--text-accent)] hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif font-medium text-[var(--text-accent)] group-hover:underline">
                  {ch.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border-light)] text-[var(--text-secondary)] font-serif">
                  {ch.category}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">
                {ch.summary}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* 重新测试按钮 */}
      {!loading && (
        <button
          type="button"
          onClick={() => {
            setStep(0);
            setAnswers({});
            setRecommendation(null);
            setRecommendedChapters([]);
          }}
          className="w-full mt-6 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-serif text-[var(--text-secondary)] hover:text-[var(--text-accent)] hover:border-[var(--text-accent)] transition-all shadow-xs cursor-pointer"
        >
          重新测试阅读路径
        </button>
      )}
    </div>
  );
}
