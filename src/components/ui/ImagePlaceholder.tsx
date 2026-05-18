"use client";

import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type ImagePlaceholderProps = {
  /** Texto en monoespaciado mostrado en el centro (ej. "andamio.jpg") */
  label?: string;
  height?: number;
  radius?: number;
  className?: string;
  style?: CSSProperties;
};

/**
 * ImagePlaceholder — drop-zone con stripes diagonales, usado para
 * representar fotos pendientes de adjuntar en evidencias / observaciones.
 */
export function ImagePlaceholder({
  label = "image",
  height = 120,
  radius = 12,
  className,
  style,
}: ImagePlaceholderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center font-mono text-[11px] uppercase tracking-wider",
        "border border-dashed border-hairline text-ink-3",
        "dark:border-hairline-dark dark:text-dark-ink-2",
        // Stripes via repeating-linear-gradient (light + dark vía clases)
        "bg-[repeating-linear-gradient(135deg,rgba(27,22,20,0.025)_0_8px,rgba(27,22,20,0.055)_8px_16px)]",
        "dark:bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.04)_0_8px,rgba(255,255,255,0.07)_8px_16px)]",
        className,
      )}
      style={{ height, borderRadius: radius, ...style }}
    >
      {label}
    </div>
  );
}
