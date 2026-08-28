import type { Metadata } from "next";
import Link from "next/link";

import { buildPageMetadata, CONTENT_LAST_MODIFIED } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "隐私说明",
  description:
    "莊子數位典藏的隐私说明 — 本站不设账号、不在服务器保存个人数据；说明浏览器本地存储的内容、涉及的第三方服务（地图瓦片、AI 接口）及数据清除方式。",
  path: "/privacy",
});

const LOCAL_DATA = [
  { key: "siteTheme", what: "配色主题选择（宣纸/竹简/墨韵/青花/夜读）" },
  { key: "readingProgress", what: "各篇阅读进度与最近阅读时间" },
  { key: "bookmarks", what: "你收藏的段落" },
  { key: "annotations", what: "你为段落所写的个人批注" },
  { key: "deepseek_key", what: "你自备的 DeepSeek API Key（仅用于 AI 问答功能）" },
];

const THIRD_PARTIES = [
  {
    name: "高德地图（Amap）",
    where: "「庄子地理」页面的地图底图瓦片",
    data: "你的 IP 地址、浏览器信息、所浏览的地图区域",
    note: "由高德（中国大陆服务商）提供，仅在你打开地图页时请求。",
  },
  {
    name: "cdnjs (Cloudflare)",
    where: "地图标记图标",
    data: "你的 IP 地址、Referer",
    note: "已自托管（public/vendor/leaflet/），不再产生此项第三方请求。",
  },
  {
    name: "DeepSeek API",
    where: "「问庄子」「诸子对谈」「译文挑战」等 AI 功能",
    data: "你输入的问题文本、你自备的 API Key",
    note: "仅在你主动使用 AI 功能时发生；不使用则完全不发生请求。",
  },
];

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.04em] text-[var(--text-primary)] mb-3">
          隐私说明
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          最后更新：{CONTENT_LAST_MODIFIED}
        </p>
        <div className="ink-divider" />
      </div>

      <div className="space-y-10 text-sm leading-[1.85] text-[var(--text-primary)]">
        <section>
          <h2 className="text-base font-semibold text-[var(--text-accent)] tracking-[0.06em] mb-3">
            总述
          </h2>
          <p className="text-[var(--text-secondary)]">
            本站是一个静态的古籍阅读站：没有账号系统，没有后端数据库，
            也不在服务器上保存任何与你个人相关的数据。
            你的阅读记录、收藏与批注全部只存在于你自己浏览器的
            localStorage 中，换设备或清空浏览器数据即会消失。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text-accent)] tracking-[0.06em] mb-3">
            浏览器本地保存了什么
          </h2>
          <div className="rounded-lg border border-[var(--border-light)] overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[var(--bg-secondary)]">
                <tr>
                  <th scope="col" className="text-left px-3 py-2 font-medium text-[var(--text-primary)]">
                    存储键
                  </th>
                  <th scope="col" className="text-left px-3 py-2 font-medium text-[var(--text-primary)]">
                    内容
                  </th>
                </tr>
              </thead>
              <tbody>
                {LOCAL_DATA.map((row) => (
                  <tr key={row.key} className="border-t border-[var(--border-light)]">
                    <td className="px-3 py-2 font-mono text-[var(--text-accent)] align-top whitespace-nowrap">
                      {row.key}
                    </td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{row.what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[var(--text-secondary)]">
            以上数据均不会上传到本站服务器。清除方式：浏览器设置中清空本站站点数据，
            或在开发者工具的 Application → Local Storage 中删除对应条目。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text-accent)] tracking-[0.06em] mb-3">
            关于 API Key（重要）
          </h2>
          <p className="text-[var(--text-secondary)]">
            AI 功能采用「自备密钥」（BYOK）模式：密钥由你自己提供，
            以明文形式保存在浏览器 localStorage，并在你发起提问时随请求
            经本站的边缘函数转发给 DeepSeek。这意味着：
          </p>
          <ul className="mt-3 space-y-2 text-[var(--text-secondary)] list-disc pl-5">
            <li>密钥会途经本站的服务端转发环节，本站不记录、不落盘、不缓存该密钥；</li>
            <li>
              但请理解此架构的固有限制 ——
              明文存于 localStorage 意味着任何针对本站的脚本注入都可能读取它。
              建议使用<strong>额度受限的专用密钥</strong>，并在不再使用后
              到 DeepSeek 控制台吊销。
            </li>
            <li>不使用 AI 功能时，本站不会向任何 AI 服务发起请求。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text-accent)] tracking-[0.06em] mb-3">
            第三方请求
          </h2>
          <div className="space-y-4">
            {THIRD_PARTIES.map((tp) => (
              <div key={tp.name} className="rounded-lg border border-[var(--border-light)] p-3">
                <div className="font-medium text-[var(--text-accent)] text-sm mb-1">{tp.name}</div>
                <dl className="text-xs space-y-1 text-[var(--text-secondary)]">
                  <div>
                    <dt className="inline font-medium">出现位置：</dt>
                    <dd className="inline"> {tp.where}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">可能获得：</dt>
                    <dd className="inline"> {tp.data}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">说明：</dt>
                    <dd className="inline"> {tp.note}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text-accent)] tracking-[0.06em] mb-3">
            统计与追踪
          </h2>
          <p className="text-[var(--text-secondary)]">
            本站目前<strong>未启用</strong>任何访问统计或广告追踪，
            不设置追踪 Cookie，不做跨站画像。
            若将来启用（例如 Cloudflare Web Analytics 这类不使用 Cookie、
            不采集个人标识的方案），会在此处更新说明。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text-accent)] tracking-[0.06em] mb-3">
            内容来源与著作权
          </h2>
          <p className="text-[var(--text-secondary)]">
            《庄子》原文及清代以前注疏属公有领域。
            本站的白话翻译、题解、逐字注与考据训诂引述了陈鼓应《庄子今注今译》、
            方勇《庄子纂要》等现代学术著作，相关权利归原作者及出版方所有。
            <strong>本站定位为个人学习研究用途（不对外运营、不用于商业目的）</strong>，
            仅作学习研究之引用。逐条来源与致谢见
            <Link href="/attributions" className="text-[var(--text-accent)] hover:underline"> 引用与致谢 </Link>
            页；如权利人认为使用不当，请联系以便调整或移除。
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
