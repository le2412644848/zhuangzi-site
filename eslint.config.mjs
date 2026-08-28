import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // import 排序：51 个组件风格已漂移，统一为
    // 「内置 → 外部 → 别名(@/) → 相对」分组，`eslint --fix` 自动整理。
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    // 「服务端专用数据」硬约束：@/lib/kaoju 静态 import 约 5MB 考据 JSON，
    // 一旦被客户端组件误引就会整包进浏览器 bundle。
    // 判据是文件顶部是否声明 "use client" —— 服务端组件（页面、kaoju.ts 自身）
    // 引用完全合法，不能用按路径匹配的 no-restricted-imports（会误伤）。
    // 构建期另有 kaoju.ts 首行 import "server-only" 兜底（按打包边界拦截）。
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      local: {
        rules: {
          "no-client-kaoju": {
            meta: {
              type: "problem",
              docs: { description: "禁止 'use client' 文件引用服务端专用考据模块/JSON" },
              messages: {
                restricted:
                  "'{{ name }}' 仅限服务端组件使用（静态 import 约 5MB 考据数据）。客户端组件请用 @/lib/kaoju-utils 的纯函数与类型。",
              },
            },
            create(context) {
              const text = context.getSourceCode().text;
              const isClient =
                text.startsWith('"use client"') || text.startsWith("'use client'");
              if (!isClient) return {};
              const banned = [
                "@/lib/kaoju",
                "@/data/kaoju.json",
                "@/data/kaoju_fang.json",
                "@/data/passage_kaoju.json",
                "@/data/passage_kaoju_fang.json",
              ];
              return {
                ImportDeclaration(node) {
                  const value = node.source.value;
                  if (banned.includes(value)) {
                    context.report({ node, messageId: "restricted", data: { name: value } });
                  }
                },
              };
            },
          },
        },
      },
    },
    rules: { "local/no-client-kaoju": "error" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
