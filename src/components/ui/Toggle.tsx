"use client";

import { cn } from "@/lib/utils";

type ToggleProps = {
  /** Estado controlado. */
  on: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
  /** Para aria. */
  label?: string;
};

/**
 * Toggle — switch con gradient brand cuando está activo. Componente
 * controlado: pasa `on` + `onChange`. Si no quieres controlarlo, gestiona
 * el estado en el padre.
 */
export function Toggle({
  on,
  onChange,
  disabled = false,
  className,
  label,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!on)}
      className={cn(
        "relative inline-flex h-[22px] w-10 shrink-0 cursor-pointer items-center",
        "rounded-full p-0.5 transition-colors duration-200",
        on
          ? "bg-grad-brand"
          : "bg-[rgba(27,22,20,0.12)] dark:bg-white/10",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span
        className={cn(
          "block h-[18px] w-[18px] rounded-full bg-white shadow-sm",
          "transition-transform duration-200",
          on ? "translate-x-[18px]" : "translate-x-0",
        )}
      />
    </button>
  );
}
