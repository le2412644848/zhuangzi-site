import { afterEach, describe, expect, it, vi } from "vitest";

describe("SITE_URL 环境变量兜底回归测试", () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
    }
    vi.resetModules();
  });

  it("当 NEXT_PUBLIC_SITE_URL 为空字符串（如 GitHub Actions 未设 vars.SITE_URL）时回退默认合法 URL", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "";
    vi.resetModules();
    const { SITE_URL, canonicalUrl } = await import("@/lib/site");
    expect(SITE_URL).toBe("https://zhuangzi-site.pages.dev");
    expect(() => new URL(SITE_URL)).not.toThrow();
    expect(canonicalUrl("/chapters/01-xiaoyao-you")).toBe(
      "https://zhuangzi-site.pages.dev/chapters/01-xiaoyao-you/"
    );
  });

  it("当 NEXT_PUBLIC_SITE_URL 含首尾空格与尾斜杠时自动清洗", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "  https://zhuangzi.example.org///  ";
    vi.resetModules();
    const { SITE_URL, canonicalUrl } = await import("@/lib/site");
    expect(SITE_URL).toBe("https://zhuangzi.example.org");
    expect(canonicalUrl("/")).toBe("https://zhuangzi.example.org/");
  });
});
