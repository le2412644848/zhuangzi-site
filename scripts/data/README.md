# 数据管线说明

本目录记录 `src/data/` 下数据的来源与可复现流程。

## 哪些数据是「可复现产物」

| 数据 | 生成方式 | 校验 |
| --- | --- | --- |
| `src/data/chapters/metadata.json` | `node scripts/gen-metadata.mjs`（从各篇 chapter JSON 提取轻量元数据） | CI 中重新生成后 `git diff --exit-code` 必须无差异；`tests/data-integrity.test.ts` 校验与正文同步（含 `passageIds`） |
| `src/data/trad-map.ts` | `node scripts/gen-trad-map.mjs`（从 `SimplifiedToggle.tsx` 提取简繁映射、剔除歧义字） | `tests/script-conversion.test.ts` 全语料简→繁→简往返一致性 |
| `public/data/`（懒加载译本/考据） | `node scripts/gen-lazy-data.mjs`（`npm run build` 流程内自动执行） | 产物为构建中间物（已 gitignore），`scripts/check-passage-regression.mjs` 校验 33 篇齐全 |

## 哪些数据是「人工整理的输入」，无生成脚本

以下文件是逐篇人工整理（录入/校订古籍文本、撰写译文与注疏）的结果，
**不存在**「重跑脚本即可再得」的生成器，修改需直接编辑并提交：

- `src/data/chapters/<id>.json`（33 篇正文、译文、题解、逐字注、批注词条）
- `src/data/kaoju.json`、`kaoju_fang.json`（篇级考据训诂）
- `src/data/passage_kaoju.json`、`passage_kaoju_fang.json`（段落级注）
- `src/data/concepts/`、`concordance.json`、`quotes.json`、`fables.json`、
  `related.json`、`timeline.json`、`map-locations.json`、`reading-routes.json`

这些是本站的核心资产（约 6MB 手工整理内容），改动走正常代码评审。

## 一次性导入脚本（archive/）

`archive/` 下的 Python 脚本是整理期的一次性导入/修补工具：

- 硬编码了机器本地绝对路径（`C:/Users/Administrator/...`），在其他机器/CI 无法运行；
- 部分脚本含测试串（如 `up_test.py` 会把 `TEST_COMMENTARY_27` 写进正文）——
  **禁止重跑**，它们的数据已通过评审入库；
- 保留在仓库仅作整理过程的审计痕迹。

若将来需要再次导入外部数据，请为每篇 chapter JSON 编写**幂等**的转换脚本
（以 passage id 为键做 upsert，不依赖绝对路径），并配套数据完整性测试。

## 新增/修改数据时的流程

1. 直接编辑人工整理数据（见上）；
2. 重跑受影响的可复现产物：`node scripts/gen-metadata.mjs`（如改篇目结构）；
3. 本地 `npm run verify`（typecheck + lint + 65 测试）与 `npm run build`；
4. 推分支走 CI：CI 会在 `verify` job 中校验 `metadata.json` 与生成器一致。
