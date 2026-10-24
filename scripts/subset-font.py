"""
古籍宋体双族按需精确分片（TODO 3.1 v5 — Zhuangzi Serif 古籍正文标题族 + Zhuangzi Rare 生僻字回退族）：

设计目标：
1. 彻底消除单一 1.64MB zhuangzi-serif.woff2 在 Slow 4G 下阻塞首屏 9s+ 与总体积超标问题；
2. 解决无本地微软雅黑/思源宋体的 Linux/Ubuntu 环境（如 WenQuanYi Micro Hei）因现代白话正文
   穿透回退到 Zhuangzi Serif 而连带拉取 800KB+ 字体分片的问题：
   - "Zhuangzi Serif"：专供 h1/h2、古籍原文（.original-text）、篆印、双行夹注、竖排提字；
   - "Zhuangzi Rare"：仅包含 GB2312 之外的古籍异体/生僻字，挂载于 --font-serif 末尾，
     常规现代白话在任何系统均零网络请求，仅在遇到超纲生僻字时按需拉取单片；
3. 所有分片均使用严格不重叠的精确 unicode-range，内联 CSS 仅约 5KB gzip，外部 stylesheet <= 20KB。

用法：
  python scripts/subset-font.py
"""
import glob
import json
import os
import re
import shutil
import sys
import tempfile

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
DATA = os.path.join(ROOT, "src", "data")
FONT_SRC = os.path.join(ROOT, "scripts", "fonts", "NotoSerifSC.ttf")
SLICES_DIR = os.path.join(ROOT, "public", "fonts", "slices")
LEGACY_FONT = os.path.join(ROOT, "public", "fonts", "zhuangzi-serif.woff2")
LEGACY_CSS = os.path.join(ROOT, "src", "app", "fonts.css")
TS_OUT = os.path.join(ROOT, "src", "lib", "font-faces.ts")

SLICE_SIZE = 150

ALLOWED_RANGES = [
    (0x2000, 0x206F),
    (0x3000, 0x303F),
    (0x4E00, 0x9FFF),
    (0xFF00, 0xFFEF),
]


def in_allowed_range(ch: str) -> bool:
    cp = ord(ch)
    return any(lo <= cp <= hi for lo, hi in ALLOWED_RANGES)


def is_non_gb2312(ch: str) -> bool:
    if not (0x4E00 <= ord(ch) <= 0x9FFF):
        return False
    try:
        ch.encode("gb2312")
        return False
    except UnicodeEncodeError:
        return True


def walk_strings(obj, out: list[str]):
    if isinstance(obj, str):
        out.append(obj)
    elif isinstance(obj, dict):
        for v in obj.values():
            walk_strings(v, out)
    elif isinstance(obj, list):
        for v in obj:
            walk_strings(v, out)


def collect_dual_families() -> tuple[list[list[str]], list[list[str]], set[str]]:
    seen_classical: set[str] = set()

    def add_cls(text: str, bucket: list[str]):
        for ch in text:
            if in_allowed_range(ch) and ch not in seen_classical:
                seen_classical.add(ch)
                bucket.append(ch)

    # Tier 0: 首页/篇章目录/章节页/概念页 h1/h2 大标题、篆印、33 篇篇名与核心标点
    tier0: list[str] = []
    add_cls("，。、；：！？「」『』（）《》〈〉·—…“”‘’〔〕　", tier0)
    add_cls("莊子庄子戰國宋蒙人内外杂篇名精粹章总览深度互动关于逍遥物齐一万大宗师法三十千古文章核心概念相关段落出现篇章本篇总结题解延伸阅读", tier0)

    meta_path = os.path.join(DATA, "chapters", "metadata.json")
    with open(meta_path, encoding="utf-8") as f:
        for ch in json.load(f):
            add_cls(ch.get("title", "") + ch.get("category", ""), tier0)

    # Tier 1: 《逍遥游》全文古籍原文
    tier1: list[str] = []
    ch01_path = os.path.join(DATA, "chapters", "01-xiaoyao-you.json")
    with open(ch01_path, encoding="utf-8") as f:
        ch01 = json.load(f)
        for pas in ch01.get("passages", []):
            add_cls(pas.get("original", ""), tier1)

    # Tier 2: 其余页面 h1/h2、概念名、其余 32 篇古籍原文 + 名句 + 寓言篇题
    tier2: list[str] = []
    concepts_path = os.path.join(DATA, "concepts", "index.json")
    with open(concepts_path, encoding="utf-8") as f:
        for c in json.load(f).get("concepts", []):
            add_cls(c.get("name", ""), tier2)

    for path in sorted(glob.glob(os.path.join(ROOT, "src", "app", "**", "*.tsx"), recursive=True)):
        with open(path, encoding="utf-8") as f:
            src = f.read()
        for m in re.finditer(r"<h[1-2][^>]*>(.*?)</h[1-2]>", src, flags=re.S):
            add_cls(re.sub(r"<[^>]+>|\{[^}]+\}", "", m.group(1)), tier2)

    chapter_files = sorted(glob.glob(os.path.join(DATA, "chapters", "[0-9][0-9]-*.json")))
    for cpath in chapter_files:
        if os.path.basename(cpath).startswith("01-"):
            continue
        with open(cpath, encoding="utf-8") as f:
            ch_data = json.load(f)
            for pas in ch_data.get("passages", []):
                add_cls(pas.get("original", ""), tier2)

    quotes_path = os.path.join(DATA, "quotes.json")
    if os.path.exists(quotes_path):
        with open(quotes_path, encoding="utf-8") as f:
            for q in json.load(f).get("quotes", []):
                add_cls(q.get("text", ""), tier2)

    fables_path = os.path.join(DATA, "fables.json")
    if os.path.exists(fables_path):
        with open(fables_path, encoding="utf-8") as f:
            for fab in json.load(f).get("fables", []):
                add_cls(fab.get("name", ""), tier2)

    classical_slices: list[list[str]] = []
    for i in range(0, len(tier0), SLICE_SIZE):
        classical_slices.append(tier0[i : i + SLICE_SIZE])
    for i in range(0, len(tier1), SLICE_SIZE):
        classical_slices.append(tier1[i : i + SLICE_SIZE])
    for i in range(0, len(tier2), SLICE_SIZE):
        classical_slices.append(tier2[i : i + SLICE_SIZE])

    # Family 2 ("Zhuangzi Rare"): 全站所有 GB2312 以外的超纲异体/生僻汉字（供白话/注疏缺字兜底）
    seen_rare: set[str] = set()
    rare_ch01: list[str] = []
    ch01_strs: list[str] = []
    walk_strings(ch01, ch01_strs)
    for s in ch01_strs:
        for ch in s:
            if is_non_gb2312(ch) and ch not in seen_rare:
                seen_rare.add(ch)
                rare_ch01.append(ch)

    all_strs: list[str] = []
    for jpath in sorted(glob.glob(os.path.join(DATA, "**", "*.json"), recursive=True)):
        with open(jpath, encoding="utf-8") as f:
            walk_strings(json.load(f), all_strs)
    for tpath in sorted(glob.glob(os.path.join(ROOT, "src", "**", "*.ts*"), recursive=True)):
        with open(tpath, encoding="utf-8") as f:
            all_strs.append(f.read())

    rare_rest = sorted(
        {ch for s in all_strs for ch in s if is_non_gb2312(ch) and ch not in seen_rare},
        key=ord,
    )
    seen_rare.update(rare_rest)

    rare_slices: list[list[str]] = []
    if rare_ch01:
        rare_slices.append(rare_ch01)
    for i in range(0, len(rare_rest), SLICE_SIZE):
        rare_slices.append(rare_rest[i : i + SLICE_SIZE])

    print(
        f"双族统计：Zhuangzi Serif={len(seen_classical)} 字({len(classical_slices)} 片), "
        f"Zhuangzi Rare={len(seen_rare)} 字({len(rare_slices)} 片)"
    )
    return classical_slices, rare_slices, (seen_classical | seen_rare)


def format_exact_unicode_range(chars: list[str]) -> str:
    cps = sorted(ord(c) for c in chars)
    ranges = []
    start = prev = cps[0]
    for cp in cps[1:]:
        if cp == prev + 1:
            prev = cp
        else:
            ranges.append((start, prev))
            start = prev = cp
    ranges.append((start, prev))
    return ",".join(
        f"U+{lo:04X}" if lo == hi else f"U+{lo:04X}-{hi:04X}" for lo, hi in ranges
    )


def save_woff2(base_ttf: str, chars: list[str], out_path: str) -> int:
    tt = TTFont(base_ttf)
    opts = Options()
    opts.flavor = "woff2"
    opts.hinting = False
    opts.layout_features = ["vert", "vhal", "liga", "kern"]
    sub = Subsetter(options=opts)
    sub.populate(text="".join(chars))
    sub.subset(tt)
    tt.save(out_path)
    return os.path.getsize(out_path)


def main():
    if not os.path.exists(FONT_SRC):
        print(f"未找到源字体: {FONT_SRC}", file=sys.stderr)
        sys.exit(1)

    classical_slices, rare_slices, all_union = collect_dual_families()
    chars_file = os.path.join(ROOT, "scripts", "fonts", "chars.txt")
    with open(chars_file, "w", encoding="utf-8") as f:
        f.write("".join(sorted(all_union)))

    if os.path.exists(SLICES_DIR):
        shutil.rmtree(SLICES_DIR)
    os.makedirs(SLICES_DIR, exist_ok=True)
    for legacy in (LEGACY_FONT, LEGACY_CSS):
        if os.path.exists(legacy):
            os.remove(legacy)

    base_tt = instantiateVariableFont(TTFont(FONT_SRC), {"wght": 430}, inplace=False)
    tmp_base = os.path.join(tempfile.gettempdir(), "zhuangzi_static_430.ttf")
    base_tt.save(tmp_base)

    local_src = (
        'local("LXGW WenKai"),local("Noto Serif SC"),local("Noto Serif CJK SC"),'
        'local("Source Han Serif SC"),local("Songti SC"),local("STSong")'
    )
    css_rules = []
    total_bytes = 0

    try:
        for idx, chunk in enumerate(classical_slices):
            fname = f"zhuangzi-cls-{idx:02d}.woff2"
            sz = save_woff2(tmp_base, chunk, os.path.join(SLICES_DIR, fname))
            total_bytes += sz
            urange = format_exact_unicode_range(chunk)
            css_rules.append(
                f'@font-face{{font-family:"Zhuangzi Serif";src:{local_src},url("/fonts/slices/{fname}") format("woff2");font-weight:400 700;font-style:normal;font-display:swap;unicode-range:{urange}}}'
            )
            print(f"  [cls-{idx:02d}]  {len(chunk):3d} chars: {sz/1024:5.1f} KB")

        for idx, chunk in enumerate(rare_slices):
            fname = f"zhuangzi-rare-{idx:02d}.woff2"
            sz = save_woff2(tmp_base, chunk, os.path.join(SLICES_DIR, fname))
            total_bytes += sz
            urange = format_exact_unicode_range(chunk)
            css_rules.append(
                f'@font-face{{font-family:"Zhuangzi Rare";src:{local_src},url("/fonts/slices/{fname}") format("woff2");font-weight:400 700;font-style:normal;font-display:swap;unicode-range:{urange}}}'
            )
            print(f"  [rare-{idx:02d}] {len(chunk):3d} chars: {sz/1024:5.1f} KB")
    finally:
        if os.path.exists(tmp_base):
            os.remove(tmp_base)

    css_str = "".join(css_rules)
    ts_content = (
        "// 由 python scripts/subset-font.py 自动生成，请勿手改\n"
        f"export const FONT_FACE_CSS = {json.dumps(css_str, ensure_ascii=False)};\n"
    )
    with open(TS_OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(ts_content)

    print(
        f"完成：总体积 {total_bytes/1024:.1f} KB，内联 CSS {len(css_str)/1024:.1f} KB → {TS_OUT}"
    )


if __name__ == "__main__":
    main()
