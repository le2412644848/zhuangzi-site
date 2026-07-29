"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeSwitcher from "./ThemeSwitcher";
import SimplifiedToggle from "./SimplifiedToggle";
import VerticalModeToggle from "./VerticalModeToggle";
import { useState, useRef, useEffect } from "react";

interface NavGroup {
  label: string;
  items: { href: string; label: string }[];
}

const navGroups: NavGroup[] = [
  {
    label: "阅读",
    items: [
      { href: "/chapters", label: "篇章" },
      { href: "/concepts", label: "概念" },
      { href: "/quotes", label: "名句" },
      { href: "/fables", label: "寓言" },
      { href: "/reading-routes", label: "主题" },
    ],
  },
  {
    label: "探索",
    items: [
      { href: "/search", label: "搜索" },
      { href: "/timeline", label: "时间线" },
      { href: "/map", label: "地理" },
      { href: "/concordance", label: "词语" },
      { href: "/heatmap", label: "热图" },
    ],
  },
  {
    label: "更多",
    items: [
      { href: "/bookmarks", label: "收藏" },
      { href: "/report", label: "报告" },
      { href: "/cards", label: "卡片" },
    ],
  },
];

const allLinks = navGroups.flatMap((g) => g.items);
const primaryLinks = [
  { href: "/", label: "首页" },
  { href: "/chapters", label: "篇章" },
  { href: "/concepts", label: "概念" },
  { href: "/quotes", label: "名句" },
  { href: "/search", label: "搜索" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
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

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-primary)]/85 backdrop-blur-md border-b border-[var(--border-light)] no-print">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-semibold tracking-[0.08em] text-[var(--text-accent)] font-serif hover:text-[var(--color-accent-deep)] transition-colors"
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
                <div className="absolute top-full mt-1 left-0 min-w-[140px] bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl shadow-lg py-1.5 z-50 animate-fade-in">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        isActive(item.href)
                          ? "text-[var(--text-accent)] bg-[var(--hover-bg)] font-medium"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
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
            <ThemeSwitcher />
            <VerticalModeToggle />
          </div>
        </div>

        {/* Mobile: tools + hamburger */}
        <div className="flex md:hidden items-center gap-1">
          <SimplifiedToggle />
          <ThemeSwitcher />
          <VerticalModeToggle />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--hover-bg)] transition-colors ml-1"
            aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
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
        <div className="md:hidden border-t border-[var(--border-light)] bg-[var(--bg-primary)] shadow-lg animate-fade-in">
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
