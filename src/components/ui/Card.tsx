"use client";

import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";
import { GradientBorder } from "./GradientBorder";

type CardProps = {
  children: ReactNode;
  className?: string;
  /** Activa el borde luminoso (gradiente). Equivalente a `glow` en el diseño. */
  glow?: boolean;
  /** Border radius en px. */
  radius?: number;
  /** Padding interior en px. */
  padding?: number;
  style?: CSSProperties;
  /** Si quieres forzar el modo dark (ignora la clase `dark` global). */
  dark?: boolean;
};

/**
 * Card — surface con sombra suave y hairline border, opcionalmente con
 * gradient border (`glow`). Es el bloque base de casi todas las secciones del
 * rediseño.
 */
export function Card({
  children,
  className,
  glow = false,
  radius = 20,
  padding = 24,
  style,
  dark,
}: CardProps) {
  if (glow) {
    return (
      <GradientBorder
        radius={radius}
        dark={dark}
        className={cn("shadow-soft dark:shadow-soft-dark", className)}
        innerClassName="bg-surface dark:bg-dark-surface"
        style={style}
      >
        <div style={{ padding, borderRadius: radius - 1 }}>{children}</div>
      </GradientBorder>
    );
  }

  return (
    <div
      className={cn(
        "border border-hairline bg-surface shadow-soft",
        "dark:bg-dark-surface dark:shadow-soft-dark",
        className,
      )}
      style={{ borderRadius: radius, padding, ...style }}
    >
      {children}
    </div>
  );
}
