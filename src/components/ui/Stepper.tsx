"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { ComponentType } from "react";

/** Tipo permisivo para iconos: acepta lucide-react y cualquier otro componente que reciba `size`. */
type IconLike = ComponentType<{ size?: number | string }>;

export type StepperItem = {
  /** Etiqueta visible (ej. "Datos") */
  label: string;
  /** Icono (lucide o cualquier componente que reciba `size`) */
  icon?: IconLike;
};

type StepperProps = {
  items: StepperItem[];
  /** Índice del paso actualmente activo (0-based) */
  active: number;
  className?: string;
};

/**
 * Stepper — pills horizontales para flujos multi-paso. El paso activo va con
 * gradient brand sólido. Los completados muestran check sobre gradient ok.
 * Los pendientes en surface neutra.
 *
 * Usado en: Crear inspección · Encuesta · Onboarding desktop.
 */
export function Stepper({ items, active, className }: StepperProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {items.map((step, i) => {
        const isDone = i < active;
        const isCurrent = i === active;
        const Icon = step.icon;
        return (
          <RenderStep
            key={`${step.label}-${i}`}
            item={step}
            isDone={isDone}
            isCurrent={isCurrent}
            isLast={i === items.length - 1}
            Icon={Icon}
          />
        );
      })}
    </div>
  );
}

function RenderStep({
  item,
  isDone,
  isCurrent,
  isLast,
  Icon,
}: {
  item: StepperItem;
  isDone: boolean;
  isCurrent: boolean;
  isLast: boolean;
  Icon?: IconLike;
}) {
  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold",
          "transition-colors",
          isCurrent
            ? "bg-grad-brand border-0 text-white"
            : "border border-hairline bg-surface text-ink-2 " +
                "dark:border-hairline-dark dark:bg-white/[0.04] dark:text-dark-ink-2",
        )}
      >
        <span
          className={cn(
            "inline-flex h-[26px] w-[26px] items-center justify-center rounded-full",
            isCurrent
              ? "bg-white/20 text-white"
              : isDone
              ? "bg-grad-ok text-white"
              : "bg-bg-2 text-ink-2 dark:bg-white/[0.06] dark:text-dark-ink-2",
          )}
        >
          {isDone ? (
            <Check size={13} />
          ) : Icon ? (
            <Icon size={13} />
          ) : null}
        </span>
        {item.label}
      </div>
      {!isLast && (
        <div className="h-0.5 w-6 rounded-full bg-hairline dark:bg-hairline-dark" />
      )}
    </>
  );
}

/**
 * MiniStepper — versión compacta para móvil: barras horizontales que
 * se rellenan en gradient brand según el progreso (matches MobileCreate).
 */
export function MiniStepper({
  total,
  active,
  className,
}: {
  total: number;
  active: number;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1.5", className)}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            i <= active
              ? "bg-grad-brand"
              : "bg-[rgba(27,22,20,0.06)] dark:bg-white/[0.06]",
          )}
        />
      ))}
    </div>
  );
}
