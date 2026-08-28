import type { Metadata } from "next";
import Link from "next/link";

import { buildPageMetadata, CONTENT_LAST_MODIFIED } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "引用与致谢",
  description:
    "莊子數位典藏的内容来源与著作权说明 — 原文与古代注疏的公有领域情况、现代学术著作的引用明细（陈鼓应《庄子今注今译》、方勇《庄子纂要》等）、使用的开源库与第三方服务。",
  path: "/attributions",
});

const ACADEMIC_SOURCES = [
  {
    title: "陈鼓应《庄子今注今译》（商务印书馆）",
    usedFor: "白话翻译、篇首题解、逐字注、考据训诂（页面标注「陈鼓应注」的段落级注与浮层训诂）",
    note: "现代学术著作，受著作权保护。本站为学习研究之目的引述，仅节选片段并标注出处。",
  },
  {
    title: "方勇《庄子纂要》（学苑出版社）",
    usedFor: "历代注家辑录（页面标注「方勇训诂」的段落级注）",
    note: "现代整理著作，受著作权保护。本站仅节选历代注家引文。",
  },
  {
    title: "郭庆藩《庄子集释》、王先谦《庄子集解》、成玄英《庄子疏》等历代注疏",
    usedFor: "历代注家引文（清代及以前）",
    note: "属公有领域。",
  },
];

const OPEN_SOURCE = [
  { name: "pinyin-pro", url: "https://github.com/zh-lx/pinyin-pro", license: "MIT", usedFor: "原文注音" },
  { name: "d3", url: "https://d3js.org/", license: "ISC", usedFor: "知识图谱与词频可视化" },
  { name: "Leaflet", url: "https://leafletjs.com/", license: "BSD-2-Clause", usedFor: "「庄子地理」地图交互" },
  { name: "Next.js", url: "https://nextjs.org/", license: "MIT", usedFor: "站点框架与静态导出" },
  { name: "React", url: "https://react.dev/", license: "MIT", usedFor: "UI 框架" },
];

export default function AttributionsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.04em] text-[var(--text-primary)] mb-3">
          引用与致谢
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          最后更新：{CONTENT_LAST_MODIFIED}
        </p>
        <div className="ink-divider" />
      </div>

      <div className="space-y-10 text-sm leading-[1.85] text-[var(--text-primary)]">
        <section>
          <h2 className="text-base font-semibold text-[var(--text-accent)] tracking-[0.06em] mb-3">
            原文与古代注疏
          </h2>
          <p className="text-[var(--text-secondary)]">
            《庄子》三十三篇正文属先秦文本，清代及以前的注疏（如郭象注、
            成玄英疏、郭庆藩《庄子集释》中的历代注家引文）均已进入公有领域。
            本站基于通行本整理校录。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text-accent)] tracking-[0.06em] mb-3">
            现代学术著作（受著作权保护）
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-3">
            本站的白话翻译、题解、逐字注与考据训诂大量引述以下著作。
            <strong>本站定位为个人学习研究用途（不对外运营、不用于商业目的）</strong>，
            按《著作权法》第二十四条「为个人学习、研究或者欣赏而使用他人
            已经发表的作品」之精神使用，节选片段均标注出处。
            如权利人认为使用不当，请联系调整或移除。
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-3">
            注：名句页与背诵页中的「今日译文」「今日适用」文字为本站自撰，
            不属于上述著作的引述内容。
          </p>
          <div className="space-y-3">
            {ACADEMIC_SOURCES.map((s) => (
              <div key={s.title} className="rounded-lg border border-[var(--border-light)] p-3">
                <div className="font-medium text-[var(--text-accent)] text-sm mb-1">{s.title}</div>
                <dl className="text-xs space-y-1 text-[var(--text-secondary)]">
                  <div>
                    <dt className="inline font-medium">用于：</dt>
                    <dd className="inline"> {s.usedFor}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">说明：</dt>
                    <dd className="inline"> {s.note}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text-accent)] tracking-[0.06em] mb-3">
            开源软件
          </h2>
          <div className="rounded-lg border border-[var(--border-light)] overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[var(--bg-secondary)]">
                <tr>
                  <th scope="col" className="text-left px-3 py-2 font-medium text-[var(--text-primary)]">项目</th>
                  <th scope="col" className="text-left px-3 py-2 font-medium text-[var(--text-primary)]">协议</th>
                  <th scope="col" className="text-left px-3 py-2 font-medium text-[var(--text-primary)]">用途</th>
                </tr>
              </thead>
              <tbody>
                {OPEN_SOURCE.map((s) => (
                  <tr key={s.name} className="border-t border-[var(--border-light)]">
                    <td className="px-3 py-2 align-top">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--text-accent)] hover:underline"
                      >
                        {s.name}
                      </a>
                    </td>
                    <td className="px-3 py-2 font-mono text-[var(--text-secondary)] whitespace-nowrap align-top">{s.license}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)] align-top">{s.usedFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text-accent)] tracking-[0.06em] mb-3">
            第三方服务
          </h2>
          <p className="text-[var(--text-secondary)]">
            高德地图（地图底图瓦片）、DeepSeek API（AI 功能，自备密钥模式）
            的使用与数据情况见
            <Link href="/privacy" className="text-[var(--text-accent)] hover:underline"> 隐私说明 </Link>。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text-accent)] tracking-[0.06em] mb-3">
            本站代码许可
          </h2>
          <p className="text-[var(--text-secondary)]">
            本站程序代码以 MIT 协议开源（见仓库 LICENSE 文件），
            <strong>明确排除</strong> <code className="font-mono text-xs">src/data/</code> 下的
            语料与整理数据 —— 其中含受著作权保护的现代学术著作内容，
            不在开源许可范围内。
          </p>
        </section>
      </div>

      <div className="mt-14 pt-6 border-t border-[var(--border-light)] text-center">
        <Link
          href="/"
          className="text-sm text-[var(--text-accent)] hover:text-[var(--color-accent-deep)] transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
