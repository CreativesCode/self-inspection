"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type SectionHeadProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Icono (lucide-react o cualquier ReactNode). Se renderiza dentro de un cuadrado tinted brand. */
  icon?: ReactNode;
  /** Slot a la derecha (pill, botón, etc.) */
  action?: ReactNode;
  className?: string;
};

/**
 * SectionHead — título de sección con icono opcional en cuadrado tinted brand.
 * Usado dentro de `<Card>` para arrancar bloques de contenido.
 */
export function SectionHead({
  title,
  subtitle,
  icon,
  action,
  className,
}: SectionHeadProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {icon && (
        <div
          className={cn(
            "inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px]",
            "bg-[rgba(var(--accent-rgb),0.08)] text-primary-500",
            "border border-[rgba(var(--accent-rgb),0.18)]",
          )}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold tracking-tight text-ink dark:text-dark-ink">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-ink-2 dark:text-dark-ink-2">{subtitle}</div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
