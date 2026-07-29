"use client";

import { useState, useMemo } from "react";
import concordanceData from "@/data/concordance.json";

interface Occurrence { chapterId: string; passageId: string; }
interface WordEntry { word: string; count: number; occurrences: Occurrence[]; }

const chapterOrder = [
  "01-xiaoyao-you","02-qiwu-lun","03-yangsheng-zhu","04-renjian-shi","05-dechong-fu","06-dazong-shi","07-yingdi-wang",
  "08-pianmu","09-mati","10-quqie","11-zaiyou","12-tiandi","13-tiandao","14-tianyun","15-keyi","16-shanxing",
  "17-qiushui","18-zhile","19-dasheng","20-shanmu","21-tianzifang","22-zhibeiyou",
  "23-gengsangchu","24-xuwugui","25-zeyang","26-waiwu","27-yuyan","28-rangwang","29-daozhi","30-shuojian",
  "31-yufu","32-lieyukou","33-tianxia"
];

const chapterNames: Record<string, string> = {
  "01-xiaoyao-you":"逍遥","02-qiwu-lun":"齐物","03-yangsheng-zhu":"养生","04-renjian-shi":"人间",
  "05-dechong-fu":"德充","06-dazong-shi":"大宗","07-yingdi-wang":"应帝","08-pianmu":"骈拇",
  "09-mati":"马蹄","10-quqie":"胠箧","11-zaiyou":"在宥","12-tiandi":"天地",
  "13-tiandao":"天道","14-tianyun":"天运","15-keyi":"刻意","16-shanxing":"缮性",
  "17-qiushui":"秋水","18-zhile":"至乐","19-dasheng":"达生","20-shanmu":"山木",
  "21-tianzifang":"田子","22-zhibeiyou":"知北","23-gengsangchu":"庚桑","24-xuwugui":"徐无",
  "25-zeyang":"则阳","26-waiwu":"外物","27-yuyan":"寓言","28-rangwang":"让王",
  "29-daozhi":"盗跖","30-shuojian":"说剑","31-yufu":"渔父","32-lieyukou":"列御","33-tianxia":"天下"
};

export default function ConcordanceHeatmapPage() {
  const [maxWords, setMaxWords] = useState(20);
  const words = useMemo(() => {
    const all = (concordanceData as { words: WordEntry[] }).words;
    return all.slice(0, maxWords);
  }, [maxWords]);

  // Get max count for scaling
  const maxCount = useMemo(() => Math.max(...words.map(w => w.count), 1), [words]);

  // Build heatmap data: for each word, count per chapter
  const heatmap = useMemo(() => {
    return words.map(w => {
      const perChapter: Record<string, number> = {};
      for (const o of w.occurrences) {
        const chId = o.chapterId.slice(0, 2); // "01", "02" etc
        const fullId = chapterOrder.find(c => c.startsWith(chId)) || chId;
        perChapter[fullId] = (perChapter[fullId] || 0) + 1;
      }
      return { word: w.word, count: w.count, perChapter };
    });
  }, [words]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-wide mb-2">词频分布</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        {(concordanceData as { words: WordEntry[] }).words.length} 个词的篇章分布热图
      </p>

      <div className="mb-6 flex items-center gap-2">
        <span className="text-xs text-[var(--text-secondary)]">显示前</span>
        <select value={maxWords} onChange={(e) => setMaxWords(Number(e.target.value))}
          className="text-xs px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)]">
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={30}>30</option>
          <option value={50}>50</option>
        </select>
        <span className="text-xs text-[var(--text-secondary)]">个高频词</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 pr-3 font-medium text-[var(--text-secondary)] sticky left-0 bg-[var(--bg-primary)] z-10">词</th>
              <th className="text-center py-2 px-1 font-medium text-[var(--text-secondary)]">总计</th>
              {chapterOrder.map(ch => (
                <th key={ch} className="text-center py-2 px-1 font-medium text-[var(--text-secondary)] writing-vertical" title={ch}>
                  {chapterNames[ch] || ch}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmap.map(w => (
              <tr key={w.word} className="border-t border-[var(--border-light)]">
                <td className="py-2 pr-3 font-medium text-[var(--text-primary)] sticky left-0 bg-[var(--bg-primary)]">{w.word}</td>
                <td className="text-center py-2 px-1 text-[var(--text-accent)] font-mono">{w.count}</td>
                {chapterOrder.map(ch => {
                  const val = w.perChapter[ch] || 0;
                  const intensity = val > 0 ? Math.min(0.1 + (val / Math.max(...Object.values(w.perChapter), 1)) * 0.7, 0.8) : 0;
                  return (
                    <td key={ch}
                      className="text-center py-2 px-1 font-mono"
                      style={{ backgroundColor: val > 0 ? `rgba(139, 69, 19, ${intensity})` : 'transparent', color: intensity > 0.5 ? '#fff' : undefined }}>
                      {val > 0 ? val : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
