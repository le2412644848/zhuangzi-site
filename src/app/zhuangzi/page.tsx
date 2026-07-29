import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "庄子其人",
  description: "庄子（约前369—前286），名周，战国宋国蒙人，道家思想集大成者。",
};

const MILESTONES = [
  { year: "约前369年", event: "庄子出生于宋国蒙（今河南商丘附近），家境贫寒" },
  { year: "约前340年", event: "曾任蒙漆园吏，不久辞去，终身不仕" },
  { year: "约前330年", event: "与惠施结交，二人论辩相激，成为终生挚友与论敌" },
  { year: "约前320年", event: "楚威王遣使厚币迎庄子为相，庄子笑拒：\"吾将曳尾于涂中\"" },
  { year: "约前310年", event: "惠施去世，庄子过其墓，叹\"自夫子之死也，吾无以为质矣\"" },
  { year: "约前300年", event: "游历各国，著书立说，《庄子》内篇七篇基本完成" },
  { year: "约前286年", event: "庄子去世。临终嘱弟子：\"吾以天地为棺椁\"" },
];

const KEY_IDEAS = [
  { title: "逍遥游", desc: "追求精神的绝对自由，超越一切外在束缚——名利、生死、是非。\"无待\"是逍遥的最高境界。", link: "/chapters/01-xiaoyao-you" },
  { title: "齐物论", desc: "万物平等，是非相对。从道的角度看，大小、美丑、生死本无差别。破除我执，与天地并生。", link: "/chapters/02-qiwu-lun" },
  { title: "养生主", desc: "顺应自然之道以养生命。\"缘督以为经\"，不逆不助，在纷扰世间保全精神。", link: "/chapters/03-yangsheng-zhu" },
  { title: "人间世", desc: "如何在险恶的世间自处？庄子给出\"无用之用\"\"心斋\"\"乘物以游心\"等智慧。", link: "/chapters/04-renjian-shi" },
  { title: "大宗师", desc: "以道为宗，以道为师。看破生死，安时处顺。\"堕肢体，黜聪明，离形去知，同于大通\"。", link: "/chapters/06-dazong-shi" },
];

const INFLUENCES = [
  "陶渊明 — 归隐田园、「采菊东篱下」的恬淡自适，深得庄子逍遥之旨",
  "李白 — 「大鹏一日同风起」直接从《逍遥游》化出，庄子式的浪漫与不羁",
  "苏轼 — 贬谪中的豁达、「也无风雨也无晴」，是庄子「安时处顺」的实践",
  "鲁迅 — 称庄子「汪洋辟阖，仪态万方」，赞赏其文学成就",
  "禅宗 — 「不立文字」「平常心是道」与庄子的「得意忘言」一脉相通",
  "日本美学 — 侘寂、幽玄等概念与庄子的简朴自然观有深刻共鸣",
  "西方哲学 — 尼采、海德格尔等人的思想与庄子有诸多对话空间，成为比较哲学热点",
];

export default function ZhuangziPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-wide text-[var(--text-accent)] mb-3">庄子</h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-lg mx-auto">
          约前369—前286 · 名周 · 宋国蒙人 · 道家集大成者
        </p>
      </div>

      {/* Quote */}
      <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] mb-10 text-center">
        <p className="text-lg text-[var(--text-primary)] leading-loose tracking-wide">
          「独与天地精神往来，而不敖倪于万物」
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-3">— 《庄子·天下》</p>
      </div>

      {/* Timeline */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold tracking-wide mb-6">生平</h2>
        <div className="space-y-0">
          {MILESTONES.map((m, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--text-accent)] shrink-0 mt-1.5" />
                {i < MILESTONES.length - 1 && (
                  <div className="w-px flex-1 bg-[var(--border-light)] my-0.5" />
                )}
              </div>
              <div className="pb-6">
                <div className="text-xs font-medium text-[var(--text-accent)] mb-1">{m.year}</div>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">{m.event}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Key Ideas */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold tracking-wide mb-6">核心思想</h2>
        <div className="space-y-4">
          {KEY_IDEAS.map((idea) => (
            <Link key={idea.title} href={idea.link}
              className="block p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--text-accent)] transition-colors">
              <h3 className="font-medium text-[var(--text-accent)] mb-1">{idea.title}</h3>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">{idea.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Influence */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold tracking-wide mb-6">千年影响</h2>
        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="space-y-3">
            {INFLUENCES.map((item, i) => (
              <div key={i} className="text-sm text-[var(--text-primary)] leading-relaxed">
                <span className="text-[var(--text-accent)] font-medium">{item.split("—")[0].trim()}</span>
                <span className="text-[var(--text-secondary)]"> — {item.split("—")[1]?.trim()}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center pt-4 border-t border-[var(--border-light)]">
        <p className="text-sm text-[var(--text-secondary)] mb-4">不知从何读起？</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/reading-path"
            className="px-5 py-2 text-sm rounded-full bg-[var(--text-accent)] text-white hover:opacity-90 transition-opacity">
            个性化阅读路径 →
          </Link>
          <Link href="/chapters"
            className="px-5 py-2 text-sm rounded-full border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-accent)] transition-colors">
            浏览全部篇章
          </Link>
        </div>
      </div>
    </div>
  );
}
