"use client";

import { cn } from "@/lib/utils";
import { FileText, X } from "lucide-react";
import { Card } from "./Card";
import { GradientBorder } from "./GradientBorder";

export type ReactionValue = "Bien" | "Regular" | "Mal" | "N/A";

type ReactionStyle = {
  value: ReactionValue;
  emoji: string;
  label: string;
  // Clases para el chip cuando está SELECCIONADO.
  selectedBg: string;
  selectedText: string;
  selectedBorder: string;
};

const REACTIONS: ReactionStyle[] = [
  {
    value: "Bien",
    emoji: "👍",
    label: "Bien",
    selectedBg: "bg-[rgba(47,158,106,0.10)]",
    selectedText: "text-ok-700",
    selectedBorder: "border-[rgba(47,158,106,0.30)]",
  },
  {
    value: "Regular",
    emoji: "😐",
    label: "Regular",
    selectedBg: "bg-[rgba(232,163,61,0.12)]",
    selectedText: "text-warn-700",
    selectedBorder: "border-[rgba(232,163,61,0.32)]",
  },
  {
    value: "Mal",
    emoji: "👎",
    label: "Mal",
    selectedBg: "bg-[rgba(var(--accent-rgb),0.10)]",
    selectedText: "text-primary-700",
    selectedBorder: "border-[rgba(var(--accent-rgb),0.28)]",
  },
  {
    value: "N/A",
    emoji: "🚫",
    label: "N/A",
    selectedBg: "bg-[rgba(27,22,20,0.04)] dark:bg-white/[0.05]",
    selectedText: "text-ink-2 dark:text-dark-ink-2",
    selectedBorder: "border-hairline dark:border-hairline-dark",
  },
];

export type QuestionObservation = {
  text: string;
  photos: string[];
};

type QuestionCardProps = {
  /** Número visible del item (1-based). */
  number: number | string;
  /** Texto de la pregunta. */
  text: string;
  /** Reacción seleccionada actualmente. */
  reaction: ReactionValue | null;
  /** Marca la card como "activa" — usa GradientBorder. */
  active?: boolean;
  /** Deshabilita la interacción (encuesta completada). */
  disabled?: boolean;
  /** Observación asociada (sólo se muestra si está presente). */
  observation?: QuestionObservation | null;
  onSelect?: (r: ReactionValue) => void;
  onOpenObservation?: () => void;
  onPhotoClick?: (url: string) => void;
  className?: string;
};

/**
 * QuestionCard — Card de una pregunta de inspección con chips de reacción
 * y panel inline de observación. Usado en `Inspecciones · Encuesta`.
 */
export function QuestionCard({
  number,
  text,
  reaction,
  active,
  disabled,
  observation,
  onSelect,
  onOpenObservation,
  onPhotoClick,
  className,
}: QuestionCardProps) {
  const inner = (
    <div className={cn("p-3.5 sm:p-5", className)}>
      <div className="flex items-start gap-2.5 sm:gap-3.5">
        <div
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] text-[12px] font-extrabold sm:h-8 sm:w-8 sm:text-[13px]",
            active
              ? "bg-grad-brand text-white"
              : reaction
              ? "bg-bg-2 text-ink dark:bg-white/[0.06] dark:text-dark-ink"
              : "bg-bg-2 text-ink-2 dark:bg-white/[0.05] dark:text-dark-ink-2",
          )}
        >
          {number}
        </div>

        <div className="min-w-0 flex-1">
          <p className="m-0 break-words text-[14px] font-semibold leading-relaxed text-ink dark:text-dark-ink sm:text-[15px]">
            {text}
          </p>

          {/* Chips de reacción */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:mt-3.5 sm:gap-2">
            {REACTIONS.map((r) => {
              const selected = reaction === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect?.(r.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold sm:gap-2 sm:px-3.5 sm:py-2 sm:text-[13px]",
                    "transition-colors",
                    selected
                      ? cn(r.selectedBg, r.selectedText, r.selectedBorder)
                      : "border-hairline bg-surface text-ink-2 hover:brightness-95 " +
                          "dark:border-hairline-dark dark:bg-white/[0.03] dark:text-dark-ink-2",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                  aria-pressed={selected}
                  aria-label={r.label}
                >
                  <span className="text-sm leading-none">{r.emoji}</span>
                  {r.label}
                </button>
              );
            })}
            {/* El chip "Nota" sólo aparece cuando la reacción es "Mal" y ya
                existe una observación guardada: sirve para volver a abrir el
                modal y ver/editar la nota. Cuando se selecciona "Mal" por
                primera vez, el modal se abre automáticamente desde la página. */}
            {reaction === "Mal" && observation && observation.text && (
              <>
                <div className="flex-1" />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={onOpenObservation}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-medium",
                    "border-hairline bg-surface text-ink-2 hover:brightness-95",
                    "dark:border-hairline-dark dark:bg-white/[0.03] dark:text-dark-ink-2",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                  title={disabled ? "Ver observación" : "Editar observación"}
                >
                  <FileText size={13} />
                  {disabled ? "Ver nota" : "Editar nota"}
                </button>
              </>
            )}
          </div>

          {/* Panel inline de observación (sólo si existe) */}
          {observation && observation.text && (
            <div className="mt-3.5 rounded-[12px] border border-[rgba(var(--accent-rgb),0.20)] bg-[rgba(var(--accent-rgb),0.06)] p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-600">
                <FileText size={13} /> Observación añadida
                {observation.photos.length > 0 && (
                  <span>
                    {" · "}
                    {observation.photos.length}{" "}
                    {observation.photos.length === 1 ? "foto" : "fotos"}
                  </span>
                )}
              </div>
              <p className="m-0 mt-2 text-[13px] text-ink dark:text-dark-ink">
                {observation.text}
              </p>
              {observation.photos.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {observation.photos.map((photo, i) => (
                    <button
                      key={`${photo.slice(-20)}-${i}`}
                      type="button"
                      onClick={() => onPhotoClick?.(photo)}
                      className="relative h-16 w-24 overflow-hidden rounded-[8px] border border-hairline hover:brightness-95 dark:border-hairline-dark"
                      title="Ver imagen"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={`Observación ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botón de "limpiar" reacción (sólo si hay reacción y no está disabled) */}
        {reaction && !disabled && (
          <button
            type="button"
            onClick={() => onSelect?.(reaction)}
            className="hidden"
            tabIndex={-1}
            aria-hidden
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );

  if (active) {
    return (
      <GradientBorder radius={18} className="overflow-hidden">
        {inner}
      </GradientBorder>
    );
  }
  return (
    <Card radius={18} padding={0} className="overflow-hidden">
      {inner}
    </Card>
  );
}
