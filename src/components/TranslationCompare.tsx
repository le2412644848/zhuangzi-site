"use client";

import { useState } from "react";
import type { TranslationEntry } from "@/lib/chapters";

interface TranslationCompareProps {
  translations?: TranslationEntry[];
  defaultTranslation: string;
}

export default function TranslationCompare({
  translations,
  defaultTranslation,
}: TranslationCompareProps) {
  const [showCompare, setShowCompare] = useState(false);
  const [activeTranslator, setActiveTranslator] = useState(0);

  if (!translations || translations.length === 0) return null;

  const allVersions = [
    { translator: "白话", text: defaultTranslation },
    ...translations,
  ];

  return (
    <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
      <button
        onClick={() => setShowCompare(!showCompare)}
        className="text-xs text-[var(--text-accent)] hover:underline"
      >
        {showCompare ? "收起译本对照" : `多译本对照 (${allVersions.length}个版本)`}
      </button>

      {showCompare && (
        <div className="mt-2 space-y-0">
          {/* Translator tabs */}
          <div className="flex flex-wrap gap-1 mb-2">
            {allVersions.map((v, i) => (
              <button
                key={v.translator}
                onClick={() => setActiveTranslator(i)}
                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                  activeTranslator === i
                    ? "bg-[var(--text-accent)]/10 text-[var(--text-accent)] border border-[var(--text-accent)]/30"
                    : "text-[var(--text-secondary)] border border-transparent hover:text-[var(--text-primary)]"
                }`}
              >
                {v.translator}
              </button>
            ))}
          </div>

          {/* Active translation */}
          <div className="pl-3 border-l-2 border-[var(--border-color)]">
            <div className="text-xs text-[var(--text-secondary)] mb-1">
              {allVersions[activeTranslator].translator}
            </div>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed reading-prose">
              {allVersions[activeTranslator].text}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
