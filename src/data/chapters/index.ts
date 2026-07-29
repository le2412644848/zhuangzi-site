import type { Chapter } from "@/lib/chapters";

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

export const chapters: Chapter[] = [
  ch01, ch02, ch03, ch04, ch05, ch06, ch07,
  ch08, ch09, ch10, ch11, ch12, ch13, ch14,
  ch15, ch16, ch17, ch18, ch19, ch20, ch21,
  ch22, ch23, ch24, ch25, ch26, ch27, ch28,
  ch29, ch30, ch31, ch32, ch33,
].sort((a, b) => a.order - b.order);
