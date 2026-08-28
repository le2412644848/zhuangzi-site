# -*- coding: utf-8 -*-
import json, os
BASE = "src/data/chapters"
os.chdir("C:/Users/Administrator/OneDrive/桌面/reasonix项目/zhuangzi-site")
def load(name):
    with open(os.path.join(BASE, name), encoding="utf-8") as f:
        return json.load(f)
def save(name, data):
    with open(os.path.join(BASE, name), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
print("Script starting...")


c27 = load("27-yuyan.json")
p0_comm = "【逐字注】

"
p0_comm += "『寓言十九』——「寓言」：寄寓于他人之口的言论。「十九」：十分之九。庄子公开承认自己的著作大部分是寓言。

"
p0_comm += "『重言十七』——「重言」：借重先贤耆老之言。

"
p0_comm += "『卮言日出，和以天倪』——「卮（zhi）言」：像酒杯一样随物变化的言说。「天倪」：自然分际。

"
p0_comm += "【章旨】庄子公开了自己的写作方法论。
"
c27["passages"][0]["commentary"] = p0_comm
c27["passages"][0]["annotations"] = [{"term": "寓言十九", "text": "十分之九是寓言。"}]
save("27-yuyan.json", c27)
print("Updated 27")
