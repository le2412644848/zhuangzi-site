"use client";

import { useEffect } from "react";

interface KeyboardNavProps {
  prevUrl: string | null;
  nextUrl: string | null;
}

export default function KeyboardNav({ prevUrl, nextUrl }: KeyboardNavProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === "ArrowLeft" && prevUrl) { window.location.href = prevUrl; }
      if (e.key === "ArrowRight" && nextUrl) { window.location.href = nextUrl; }
      if (e.key === "/" && !e.ctrlKey) {
        e.preventDefault();
        const search = document.querySelector('input[type="text"]');
        if (search instanceof HTMLInputElement) search.focus();
      }
      if (e.key === "b" && !e.ctrlKey) {
        const star = document.querySelector('button[title*="收藏"]');
        if (star instanceof HTMLElement) star.click();
      }
      if (e.key === "m" && !e.ctrlKey) {
        const vbtn = document.querySelector('button[title*="竖排"], button[title*="横排"]');
        if (vbtn instanceof HTMLElement) vbtn.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prevUrl, nextUrl]);

  return null;
}
