# -*- coding: utf-8 -*-
import json, os

BASE = r"C:/Users/Administrator/OneDrive/桌面/reasonix项目/zhuangzi-site/src/data/chapters"

def load_chapter(name):
    path = os.path.join(BASE, name)
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def save_chapter(name, data):
    path = os.path.join(BASE, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("Helper functions loaded")

