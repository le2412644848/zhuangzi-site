"use client";

import Link from "next/link";
import { concepts } from "@/data/concepts";

interface ConceptTagProps {
  conceptId: string;
  name?: string;
  size?: "sm" | "md";
}

export default function ConceptTag({ conceptId, name, size = "sm" }: ConceptTagProps) {
  const displayName = name || concepts.find((c) => c.id === conceptId)?.name;
  if (!displayName) return null;

  const sizeClasses = size === "sm"
    ? "px-2.5 py-0.5 text-xs"
    : "px-3 py-1 text-sm";

  return (
    <Link
      href={`/concepts/${conceptId}`}
      className={`tag ${sizeClasses} font-serif tracking-wide cursor-pointer`}
    >
      {displayName}
    </Link>
  );
}
