"use client";

import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
} from "react";
import { Pill } from "./Pill";

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  icon?: ReactNode;
  /** Render slot a la derecha del input (botón ojo, chevron, etc.) */
  suffix?: ReactNode;
  /** Texto de ayuda bajo el field */
  hint?: ReactNode;
  /** Mensaje de error (sobreescribe `hint`) */
  error?: string;
  /** Bloquear edición sin estilo `disabled` (read-only). */
  locked?: boolean;
  /** Mostrar pill de "modificado" (usado en `DiffField`). */
  changed?: boolean;
  /** Texto descriptivo bajo el field (motivo de bloqueo, ej.) */
  tag?: ReactNode;
  className?: string;
  inputClassName?: string;
};

/**
 * Field — input estandarizado del rediseño: label arriba + caja interior con
 * icon opcional + suffix opcional. Diseñado para combinar con Pill
 * (changed/locked) en pantallas de edición.
 *
 * Ejemplo:
 *   <Field label="Email" icon={<Mail size={16}/>} value="..." />
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  {
    label,
    icon,
    suffix,
    hint,
    error,
    locked = false,
    changed = false,
    tag,
    className,
    inputClassName,
    id: idProp,
    type = "text",
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const id = idProp ?? `field-${reactId}`;
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
          "mt-1.5 flex items-center gap-2.5 rounded-[12px] border px-3.5 py-3",
          "transition-colors",
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
        <input
          ref={ref}
          id={id}
          type={type}
          disabled={locked}
          className={cn(
            "flex-1 bg-transparent text-sm text-ink outline-none",
            "placeholder:text-ink-3 dark:text-dark-ink dark:placeholder:text-dark-ink-2",
            "disabled:cursor-not-allowed",
            inputClassName,
          )}
          {...rest}
        />
        {suffix && <span className="inline-flex shrink-0">{suffix}</span>}
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
