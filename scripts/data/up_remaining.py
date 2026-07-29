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
print("Starting update...")

c27 = load("27-yuyan.json")
c27["passages"][0]["commentary"] = (
    "【逐字注】

"
    "『寓言十九』——「寓言」：寄寓于他人之口的言论。\"十九\"：十分之九。庄子公开承认自己的著作大部分是寓言。

"
    "『重言十七』——「重言」：借重先贤耆老之言。引用黄帝、尧舜、孔子等权威人物来增加说服力，但常是反用权威。

"
    "『卮言日出，和以天倪』——「卮（zhi）言」：像酒杯一样随物变化的言说，无固定形态。「天倪」：自然的分际。最高级的语言形态。

"
    "『寓言十九，藉外论之』——「藉外」：假借外人、外物来谈论。不直接说教而是通过故事来表达。

"
    "『亲父不为其子媒』——父亲不替自己的儿子做媒。直接自夸会引起反感，借他人之口更有说服力。

"
    "『与己同则应，不与己同则反』——人类认知偏见的本质描述。寓言正是为了绕过这种偏见。

"
    "【章旨】庄子在这一篇中公开了自己的写作方法论。寓言占十分之九——借他人之口说自己的话。重言是借重先贤权威。卮言是无固定立场、随物变化的言说方式，是最高级的语言形态。庄子三种叙述策略构成了他的全部方法论。"
)