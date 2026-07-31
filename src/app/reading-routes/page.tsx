"use client";

import Link from "next/link";
import routesData from "@/data/reading-routes.json";

interface Route {
  id: string;
  title: string;
  description: string;
  chapters: string[];
  color: string;
}

const chapterNames: Record<string, string> = {
  "01-xiaoyao-you": "逍遥游", "02-qiwu-lun": "齐物论", "03-yangsheng-zhu": "养生主",
  "04-renjian-shi": "人间世", "05-dechong-fu": "德充符", "06-dazong-shi": "大宗师",
  "07-yingdi-wang": "应帝王", "08-pianmu": "骈拇", "09-mati": "马蹄",
  "10-quqie": "胠箧", "11-zaiyou": "在宥", "12-tiandi": "天地", "13-tiandao": "天道",
  "14-tianyun": "天运", "15-keyi": "刻意", "16-shanxing": "缮性", "17-qiushui": "秋水",
  "18-zhile": "至乐", "19-dasheng": "达生", "20-shanmu": "山木", "21-tianzifang": "田子方",
  "22-zhibeiyou": "知北游", "23-gengsangchu": "庚桑楚", "24-xuwugui": "徐无鬼",
  "25-zeyang": "则阳", "26-waiwu": "外物", "27-yuyan": "寓言", "28-rangwang": "让王",
  "29-daozhi": "盗跖", "30-shuojian": "说剑", "31-yufu": "渔父", "32-lieyukou": "列御寇",
  "33-tianxia": "天下",
};

export default function ReadingRoutesPage() {
  const routes = (routesData as { routes: Route[] }).routes;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.04em] text-[var(--text-primary)] mb-3">
          主题式阅读
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          按主题串联篇章，系统理解庄子思想
        </p>
        <div className="ink-divider" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {routes.map((r) => (
          <div
            key={r.id}
            className="card p-6 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform"
          >
            {/* Color accent bar */}
            <div
              className="w-10 h-1 rounded-full mb-1"
              style={{ backgroundColor: r.color }}
            />
            <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-wide">
              {r.title}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed flex-1">
              {r.description}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {r.chapters.map((ch) => (
                <Link
                  key={ch}
                  href={`/chapters/${ch}`}
                  className="text-xs px-2 py-0.5 rounded-full border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-accent)] hover:border-[var(--text-accent)]/40 hover:bg-[var(--hover-bg)] transition-all"
                >
                  {chapterNames[ch] || ch}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
