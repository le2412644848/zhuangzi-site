
# -*- coding: utf-8 -*-
import json, os
BASE = r"src/data/chapters"
os.chdir(r"C:/Users/Administrator/OneDrive/桌面/reasonix项目/zhuangzi-site")
def load(name):
    with open(os.path.join(BASE, name), encoding="utf-8") as f:
        return json.load(f)
def save(name, data):
    with open(os.path.join(BASE, name), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
c = load("27-yuyan.json")
c["passages"][0]["commentary"] = "TEST_COMMENTARY_27"
c["passages"][0]["annotations"] = [{"term": "test", "text": "test annotation"}]
save("27-yuyan.json", c)
print("OK")
