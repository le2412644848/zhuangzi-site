import type { Chapter } from "@/lib/chapters";
import { chaptersMeta, type ChapterMeta } from "./metadata";

// Import all chapter JSON files
import ch01 from "./01-xiaoyao-you.json";
import ch02 from "./02-qiwu-lun.json";
import ch03 from "./03-yangsheng-zhu.json";
import ch04 from "./04-renjian-shi.json";
import ch05 from "./05-dechong-fu.json";
import ch06 from "./06-dazong-shi.json";
import ch07 from "./07-yingdi-wang.json";
import ch08 from "./08-pianmu.json";
import ch09 from "./09-mati.json";
import ch10 from "./10-quqie.json";
import ch11 from "./11-zaiyou.json";
import ch12 from "./12-tiandi.json";
import ch13 from "./13-tiandao.json";
import ch14 from "./14-tianyun.json";
import ch15 from "./15-keyi.json";
import ch16 from "./16-shanxing.json";
import ch17 from "./17-qiushui.json";
import ch18 from "./18-zhile.json";
import ch19 from "./19-dasheng.json";
import ch20 from "./20-shanmu.json";
import ch21 from "./21-tianzifang.json";
import ch22 from "./22-zhibeiyou.json";
import ch23 from "./23-gengsangchu.json";
import ch24 from "./24-xuwugui.json";
import ch25 from "./25-zeyang.json";
import ch26 from "./26-waiwu.json";
import ch27 from "./27-yuyan.json";
import ch28 from "./28-rangwang.json";
import ch29 from "./29-daozhi.json";
import ch30 from "./30-shuojian.json";
import ch31 from "./31-yufu.json";
import ch32 from "./32-lieyukou.json";
import ch33 from "./33-tianxia.json";

const _chapterMap: Record<string, Chapter> = {
  "01-xiaoyao-you": ch01, "02-qiwu-lun": ch02, "03-yangsheng-zhu": ch03,
  "04-renjian-shi": ch04, "05-dechong-fu": ch05, "06-dazong-shi": ch06,
  "07-yingdi-wang": ch07, "08-pianmu": ch08, "09-mati": ch09,
  "10-quqie": ch10, "11-zaiyou": ch11, "12-tiandi": ch12,
  "13-tiandao": ch13, "14-tianyun": ch14, "15-keyi": ch15,
  "16-shanxing": ch16, "17-qiushui": ch17, "18-zhile": ch18,
  "19-dasheng": ch19, "20-shanmu": ch20, "21-tianzifang": ch21,
  "22-zhibeiyou": ch22, "23-gengsangchu": ch23, "24-xuwugui": ch24,
  "25-zeyang": ch25, "26-waiwu": ch26, "27-yuyan": ch27,
  "28-rangwang": ch28, "29-daozhi": ch29, "30-shuojian": ch30,
  "31-yufu": ch31, "32-lieyukou": ch32, "33-tianxia": ch33,
};

/** Full chapter data — 656KB. Only import this in detail pages or search. */
export const chapters: Chapter[] = chaptersMeta.map((m) => _chapterMap[m.id]);

/** Get a single full chapter by ID. */
export function getFullChapter(id: string): Chapter | undefined {
  return _chapterMap[id];
}

export { chaptersMeta, type ChapterMeta };
