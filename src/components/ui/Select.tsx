"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, Lock } from "lucide-react";
import {
  forwardRef,
  type ReactNode,
  type SelectHTMLAttributes,
  useId,
} from "react";
import { Pill } from "./Pill";

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  label?: string;
  icon?: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Bloquear edición (read-only). */
  locked?: boolean;
  /** Pill de "modificado". */
  changed?: boolean;
  /** Texto descriptivo bajo el select. */
  tag?: ReactNode;
  className?: string;
};

/**
 * Select — wrapper estandarizado del rediseño. Comparte estructura con `Field`
 * (label arriba + caja interior + chevron) para mantener consistencia visual.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    icon,
    hint,
    error,
    locked = false,
    changed = false,
    tag,
    className,
    id: idProp,
    children,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const id = idProp ?? `select-${reactId}`;
  const help = error ?? hint;

  return (
    <div className={cn("flex flex-col", className)}>
      {(label || changed || locked) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label
              htmlFor={id}
              className="text-xs font-semibold tracking-tight text-ink-2 dark:text-dark-ink-2"
            >
              {label}
            </label>
          )}
          {changed && (
            <Pill tone="warn" className="!px-2 !py-0.5 !text-[10px]">
              Modificado
            </Pill>
          )}
          {locked && !changed && (
            <Pill tone="neutral" className="!px-2 !py-0.5 !text-[10px]">
              <Lock size={9} /> Bloqueado
            </Pill>
          )}
        </div>
      )}
      <div
        className={cn(
          "mt-1.5 flex items-center gap-2.5 rounded-[12px] border px-3.5 py-3 transition-colors",
          changed
            ? "border-[rgba(232,163,61,0.32)] bg-[rgba(232,163,61,0.08)]"
            : "border-hairline bg-bg-2 dark:border-hairline-dark dark:bg-white/[0.03]",
          error &&
            "!border-[rgba(var(--accent-rgb),0.4)] !bg-[rgba(var(--accent-rgb),0.04)]",
          locked && "opacity-65",
        )}
      >
        {icon && (
          <span className="inline-flex shrink-0 text-ink-2 dark:text-dark-ink-2">
            {icon}
          </span>
        )}
        <select
          ref={ref}
          id={id}
          disabled={locked || rest.disabled}
          className={cn(
            "flex-1 cursor-pointer appearance-none bg-transparent text-sm text-ink outline-none",
            "dark:text-dark-ink",
            "disabled:cursor-not-allowed",
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          size={14}
          className="shrink-0 text-ink-2 dark:text-dark-ink-2"
        />
      </div>
      {help && (
        <p
          className={cn(
            "mt-1 text-[11px]",
            error
              ? "text-primary-600"
              : "text-ink-3 dark:text-dark-ink-2",
          )}
        >
          {help}
        </p>
      )}
      {!help && tag && (
        <p className="mt-1 text-[11px] text-ink-3 dark:text-dark-ink-2">
          {tag}
        </p>
      )}
    </div>
  );
});
