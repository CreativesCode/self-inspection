"use client";

import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

export type PillTone = "neutral" | "brand" | "ok" | "warn" | "bad" | "info";

type PillProps = {
  children: ReactNode;
  tone?: PillTone;
  className?: string;
  style?: CSSProperties;
};

/**
 * Tonos del rediseño. Cada uno define bg/fg/border en variantes light + dark.
 * Las clases son estáticas (no interpoladas) para que Tailwind las recoja.
 */
const TONES: Record<PillTone, string> = {
  neutral:
    "bg-[rgba(27,22,20,0.05)] text-ink-2 border-hairline " +
    "dark:bg-white/[0.06] dark:text-dark-ink-2 dark:border-hairline-dark",
  brand:
    "bg-[rgba(var(--accent-rgb),0.10)] text-primary-600 " +
    "border border-[rgba(var(--accent-rgb),0.25)]",
  ok:
    "bg-[rgba(47,158,106,0.12)] text-ok-700 " +
    "border border-[rgba(47,158,106,0.28)]",
  warn:
    "bg-[rgba(232,163,61,0.14)] text-warn-700 " +
    "border border-[rgba(232,163,61,0.32)]",
  bad:
    "bg-[rgba(var(--accent-rgb),0.12)] text-primary-700 " +
    "border border-[rgba(var(--accent-rgb),0.30)]",
  info:
    "bg-[rgba(79,117,225,0.12)] text-info-700 " +
    "border border-[rgba(79,117,225,0.28)]",
};

/**
 * Pill — badge inline con tonos semánticos. Usado en estados, roles, contadores.
 */
export function Pill({ children, tone = "neutral", className, style }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full",
        "px-2.5 py-1 text-xs font-semibold tracking-tight",
        "border",
        TONES[tone],
        className,
      )}
      style={style}
    >
      {children}
    </span>
  );
}
