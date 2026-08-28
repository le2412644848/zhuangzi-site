"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect,useRef, useState } from "react";

import ReadingSettings from "./ReadingSettings";
import SimplifiedToggle from "./SimplifiedToggle";
import { ThemeProvider } from "./ThemeProvider";
import ThemeSwitcher from "./ThemeSwitcher";
import VerticalModeToggle from "./VerticalModeToggle";

interface NavGroup {
  label: string;
  items: { href: string; label: string }[];
}

// 信息架构（2026-08 对标升级）：主链接与分组下拉零重复，
// 全部功能页均有导航入口 —— 此前 /dream、/translate-challenge、
// /reading-path、/zhuangzi 在站内无任何 UI 入链（仅 sitemap 收录），
// /ask-zhuangzi、/compare 只藏在页脚。
const navGroups: NavGroup[] = [
  {
    label: "阅读",
    items: [
      { href: "/concepts", label: "核心概念" },
      { href: "/quotes", label: "名句精选" },
      { href: "/fables", label: "寓言故事" },
      { href: "/reading-routes", label: "主题路线" },
    ],
  },
  {
    label: "探索",
    items: [
      { href: "/timeline", label: "时间线" },
      { href: "/map", label: "庄子地理" },
      { href: "/concordance", label: "词语索引" },
      { href: "/heatmap", label: "词频热图" },
      { href: "/zhuangzi", label: "庄子生平" },
    ],
  },
  {
    label: "互动",
    items: [
      { href: "/ask-zhuangzi", label: "问庄子" },
      { href: "/compare", label: "诸子对谈" },
      { href: "/translate-challenge", label: "翻译挑战" },
      { href: "/recite", label: "名句背诵" },
      { href: "/dream", label: "庄周梦蝶" },
      { href: "/reading-path", label: "定制阅读路径" },
    ],
  },
  {
    label: "工具",
    items: [
      { href: "/bookmarks", label: "我的书斋" },
      { href: "/report", label: "阅读报告" },
      { href: "/cards", label: "名言卡片" },
    ],
  },
];

const primaryLinks = [
  { href: "/", label: "首页" },
  { href: "/chapters", label: "篇章" },
  { href: "/search", label: "搜索" },
];

/**
 * 站点导航。
 *
 * 主题上下文（ThemeProvider）刻意只包裹导航自身：它曾包裹整页 children，
 * 而静态导出会把 client 组件的 server children 完整序列化进 RSC 载荷
 * （章节页 33 万字符重复载荷的根源之一）。主题应用是 document 级副作用，
 * 不需要包裹正文。
 * 沉浸模式隐藏由 CSS 完成（html.immersive-mode header.site-header）。
 */
export default function Navigation() {
  return (
    <ThemeProvider>
      <NavigationContent />
    </ThemeProvider>
  );
}

function NavigationContent() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 滚动吸顶柔光阴影（设计升级规范五.1）：吸顶静止时透明无影，
  // 滚动后挂超微柔光阴影，区分导航与正文，不喧宾夺主。
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // 首帧定初值
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    // 路由变化时重置导航状态（派生状态同步，属合法模式）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 640) setMenuOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  /** 菜单内方向键导航（WCAG 2.1.2：aria-haspopup 需配套 role=menu 与键盘操作） */
  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    const items = Array.from(
      (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('a[role="menuitem"]')
    );
    if (items.length === 0) return;
    const idx = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(idx + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(idx - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  /** 触发按钮：ArrowDown/ArrowUp 打开菜单并把焦点送进菜单项 */
  const handleTriggerKeyDown = (e: React.KeyboardEvent, group: NavGroup) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    setActiveDropdown(group.label);
    requestAnimationFrame(() => {
      const btn = e.currentTarget as HTMLElement;
      const items = btn.nextElementSibling?.querySelectorAll<HTMLElement>('a[role="menuitem"]') ?? [];
      if (e.key === "ArrowUp") items[items.length - 1]?.focus();
      else items[0]?.focus();
    });
  };

  return (
    <header
      className={`site-header sticky top-0 z-50 bg-[var(--bg-primary)]/85 backdrop-blur-md border-b border-[var(--border-light)] no-print transition-shadow duration-300 ${
        scrolled ? "shadow-[0_4px_20px_rgba(35,28,20,0.03)]" : "shadow-none"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 whitespace-nowrap text-lg font-semibold tracking-[0.08em] text-[var(--text-accent)] font-serif hover:text-[var(--color-accent-deep)] transition-colors"
        >
          莊子
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center" ref={dropdownRef}>
          {/* Primary links */}
          <div className="flex items-center gap-1">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-1.5 text-sm tracking-wide rounded-lg transition-all ${
                  isActive(link.href)
                    ? "text-[var(--text-accent)] font-medium bg-[var(--hover-bg)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-[var(--border-color)] mx-2" />

          {/* Dropdown groups */}
          {navGroups.map((group) => (
            <div key={group.label} className="relative">
              <button
                onClick={() =>
                  setActiveDropdown(activeDropdown === group.label ? null : group.label)
                }
                onKeyDown={(e) => handleTriggerKeyDown(e, group)}
                aria-haspopup="menu"
                aria-expanded={activeDropdown === group.label}
                className={`px-2.5 py-1.5 text-sm tracking-wide rounded-lg transition-all flex items-center gap-1 ${
                  activeDropdown === group.label
                    ? "text-[var(--text-accent)] bg-[var(--hover-bg)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                }`}
              >
                {group.label}
                <svg
                  className={`w-3 h-3 transition-transform ${
                    activeDropdown === group.label ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {activeDropdown === group.label && (
                <div
                  role="menu"
                  aria-label={group.label}
                  onKeyDown={handleMenuKeyDown}
                  className="absolute top-full mt-1 left-0 min-w-[140px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-[0_16px_48px_rgba(35,28,20,0.08)] py-1.5 z-50 animate-fade-in overflow-hidden"
                >
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      className={`nav-menu-item block relative px-4 py-2 text-sm transition-colors ${
                        isActive(item.href)
                          ? "text-[var(--text-accent)] bg-[var(--hover-bg)] font-medium"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-accent)] hover:bg-[var(--hover-bg)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Tools */}
          <div className="flex items-center gap-1 ml-3 pl-2 border-l border-[var(--border-light)]">
            <SimplifiedToggle />
            <ReadingSettings />
            <ThemeSwitcher />
            <VerticalModeToggle />
          </div>
        </div>

        {/* Mobile: tools + hamburger */}
        <div className="flex md:hidden items-center gap-1">
          <SimplifiedToggle />
          <ReadingSettings />
          <ThemeSwitcher />
          <VerticalModeToggle />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--hover-bg)] transition-colors ml-1"
            aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-[var(--border-light)] bg-[var(--bg-primary)] shadow-lg animate-fade-in">
          <div className="px-4 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Primary links */}
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.15em] px-2 mb-1">
                主导航
              </p>
              {primaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive(link.href)
                      ? "text-[var(--text-accent)] bg-[var(--hover-bg)] font-medium"
                      : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Grouped links */}
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.15em] px-2 mb-1">
                  {group.label}
                </p>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive(item.href)
                        ? "text-[var(--text-accent)] bg-[var(--hover-bg)] font-medium"
                        : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
