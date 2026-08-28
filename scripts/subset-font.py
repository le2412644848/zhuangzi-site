"""
字体子集化（TODO 3.1）：按全站实际用字生成思源宋体 woff2 子集。

背景：站点不加载 webfont 时，Windows 回退宋体、Android 回退系统默认，
古籍生僻字（鲲鹏罔两瞿鹊子藐姑射…）跨平台字形不一。
本脚本收集 src/data/ 全部文本的字符集，用 fontTools 子集化
Noto Serif SC（思源宋体的 Google 发行版，OFL 许可）为单个 woff2。

用法：
  python scripts/subset-font.py
产物：public/fonts/zhuangzi-serif.woff2（提交仓库，源字体不提交）

依赖：pip install fonttools brotli
源字体：scripts/fonts/NotoSerifSC.ttf（可变字体，约 25MB，gitignore）
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
DATA = os.path.join(ROOT, "src", "data")
FONT_SRC = os.path.join(ROOT, "scripts", "fonts", "NotoSerifSC.ttf")
FONT_OUT = os.path.join(ROOT, "public", "fonts", "zhuangzi-serif.woff2")

JSON_PATHS = []
for name in os.listdir(os.path.join(DATA, "chapters")):
    if name.endswith(".json"):
        JSON_PATHS.append(os.path.join(DATA, "chapters", name))
for name in [
    "kaoju.json", "kaoju_fang.json",
    "passage_kaoju.json", "passage_kaoju_fang.json",
    "concepts/index.json", "quotes.json", "fables.json",
    "related.json", "concordance.json", "timeline.json",
    "map-locations.json", "reading-routes.json",
]:
    JSON_PATHS.append(os.path.join(DATA, name))


def collect_text():
    chars = set()
    for path in JSON_PATHS:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)

        def walk(o):
            if isinstance(o, str):
                chars.update(o)
            elif isinstance(o, dict):
                for v in o.values():
                    walk(v)
            elif isinstance(o, list):
                for v in o:
                    walk(v)

        walk(data)
    return chars


def main():
    chars = collect_text()
    print(f"全站文本字符集：{len(chars)} 个字符")

    # 保留常用标点与空格；去掉控制字符
    keep = {c for c in chars if c != "\u0000" and not (0xD800 <= ord(c) <= 0xDFFF)}
    # 追加安全集：常用全角标点、数字（正文中可能未覆盖但 UI 需要）
    keep |= set("，。、；：！？「」『』（）《》〈〉·—…“”‘’〔〕　0123456789")

    chars_file = os.path.join(ROOT, "scripts", "fonts", "chars.txt")
    with open(chars_file, "w", encoding="utf-8") as f:
        f.write("".join(sorted(keep)))

    os.makedirs(os.path.dirname(FONT_OUT), exist_ok=True)
    cmd = [
        sys.executable, "-m", "fontTools.subset",
        FONT_SRC,
        f"--text-file={chars_file}",
        f"--output-file={FONT_OUT}",
        "--flavor=woff2",
        "--no-hinting",
        # 保留竖排/连字等布局特性（本站有竖排阅读模式）
        "--layout-features=vert,vhal,liga,kern",
    ]
    print("运行:", " ".join(cmd))
    subprocess.run(cmd, check=True)

    size = os.path.getsize(FONT_OUT) / 1024 / 1024
    print(f"生成 {FONT_OUT}（{size:.2f}MB）")


if __name__ == "__main__":
    main()
