"use client";

import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

type GradientBorderProps = {
  children: ReactNode;
  /** Border radius en px (el inner se calcula como radius - 1) */
  radius?: number;
  className?: string;
  innerClassName?: string;
  /** Padding del fondo gradiente (1px = anillo fino) */
  padding?: number;
  /** Override del fondo gradiente */
  glow?: string;
  /** Aplica variante dark fija (si se omite, depende de la clase `dark` del root) */
  dark?: boolean;
  style?: CSSProperties;
};

const LIGHT_GLOW =
  "linear-gradient(135deg, rgba(var(--accent-rgb),0.55), rgba(247,140,124,0.25) 45%, rgba(120,107,102,0.18) 100%)";
const DARK_GLOW =
  "linear-gradient(135deg, rgba(247,140,124,0.55), rgba(var(--accent-rgb),0.25) 45%, rgba(255,255,255,0.05) 100%)";

/**
 * GradientBorder — anillo de gradiente "luminoso" alrededor de cualquier
 * contenido. Usado en cards destacadas, search bars y previews del rediseño.
 *
 * Implementación: padding 1px + background gradient en el wrapper, y el child
 * lleva el background sólido de surface. El `radius - 1` mantiene el anillo
 * uniforme sin gaps.
 */
export function GradientBorder({
  children,
  radius = 20,
  className,
  innerClassName,
  padding = 1,
  glow,
  dark,
  style,
}: GradientBorderProps) {
  const bgGlow = glow ?? (dark ? DARK_GLOW : LIGHT_GLOW);

  return (
    <div
      className={cn("relative", className)}
      style={{
        borderRadius: radius,
        padding,
        background: bgGlow,
        ...style,
      }}
    >
      <div
        className={cn(
          "h-full w-full bg-surface dark:bg-dark-surface",
          innerClassName,
        )}
        style={{ borderRadius: radius - padding }}
      >
        {children}
      </div>
    </div>
  );
}
