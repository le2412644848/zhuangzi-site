"use client";

import { useEffect, useState } from "react";

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight =
            document.documentElement.scrollHeight - window.innerHeight;
          const scrollProgress =
            docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
          setProgress(scrollProgress);
          setShowBackToTop(scrollTop > 500);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Progress bar — sits below sticky nav */}
      <div className="fixed top-14 left-0 right-0 z-50 no-print">
        <div className="h-[2px] bg-[var(--border-light)]">
          <div
            className="h-full bg-gradient-to-r from-[var(--text-accent)] via-[var(--color-accent-gold)] to-[var(--text-accent)] transition-[width] duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Back to top button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-24 right-4 z-40 w-11 h-11 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] shadow-md flex items-center justify-center transition-all duration-300 no-print hover:border-[var(--text-accent)] hover:shadow-lg ${
          showBackToTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label="回到顶部"
        title="回到顶部"
      >
        <svg
          className="w-5 h-5 text-[var(--text-accent)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 15.75l7.5-7.5 7.5 7.5"
          />
        </svg>
      </button>
    </>
  );
}
