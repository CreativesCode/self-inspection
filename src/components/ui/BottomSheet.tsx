"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Botón a la derecha del título (ej. "Limpiar"). */
  action?: ReactNode;
  /** Footer pegado al fondo (CTAs Cancelar/Aplicar). */
  footer?: ReactNode;
  /** Altura máxima como porcentaje del viewport. Default 90vh. */
  maxHeightVh?: number;
  children: ReactNode;
};

/**
 * BottomSheet — modal pegado al fondo en móvil con handle de drag visual,
 * scroll interno y safe-area-inset-bottom respetado. Pensado para flujos
 * tipo Filtros / Observación / Severidad.
 *
 * Notas:
 * - Cierra con click en el backdrop o ESC.
 * - Bloquea scroll del body mientras está abierto.
 * - En desktop también funciona (centrado abajo); pero su uso primario es móvil.
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  action,
  footer,
  maxHeightVh = 90,
  children,
}: BottomSheetProps) {
  // Cerrar con ESC + bloquear scroll del body
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2200] flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex w-full flex-col overflow-hidden",
          "rounded-t-[24px] sm:max-w-[520px] sm:rounded-[20px]",
          "border border-hairline bg-surface text-ink shadow-soft-lg",
          "dark:border-hairline-dark dark:bg-dark-surface dark:text-dark-ink dark:shadow-soft-dark",
          "pb-safe",
        )}
        style={{ maxHeight: `${maxHeightVh}vh` }}
      >
        {/* Handle (visible solo en mobile como pista visual de drag) */}
        <div className="flex justify-center pt-2 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-ink-3/40 dark:bg-white/15" />
        </div>

        {/* Header */}
        {(title || action) && (
          <div className="flex items-center gap-3 border-b border-hairline px-5 py-3.5 dark:border-hairline-dark">
            {title && (
              <h2 className="m-0 flex-1 text-[16px] font-bold tracking-tight">
                {title}
              </h2>
            )}
            {action && <div className="shrink-0">{action}</div>}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                "border border-hairline bg-bg-2 text-ink-2",
                "dark:border-hairline-dark dark:bg-white/[0.05] dark:text-dark-ink-2",
                "hover:brightness-95",
              )}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {/* Footer pegado */}
        {footer && (
          <div className="border-t border-hairline bg-surface px-5 py-3.5 dark:border-hairline-dark dark:bg-dark-surface">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
