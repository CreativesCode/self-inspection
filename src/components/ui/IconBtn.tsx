"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type IconBtnTone = "neutral" | "info" | "brand" | "ok" | "bad";

type IconBtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: IconBtnTone;
  /** Tamaño en px (cuadrado). Default 30. */
  size?: number;
};

const TONES: Record<IconBtnTone, string> = {
  neutral:
    "bg-[rgba(27,22,20,0.05)] text-ink-2 " +
    "dark:bg-white/[0.05] dark:text-dark-ink-2 hover:brightness-95",
  info: "bg-[rgba(79,117,225,0.10)] text-info-700 hover:brightness-95",
  brand: "bg-[rgba(var(--accent-rgb),0.10)] text-primary-600 hover:brightness-95",
  ok: "bg-[rgba(47,158,106,0.12)] text-ok-700 hover:brightness-95",
  bad: "bg-[rgba(var(--accent-rgb),0.10)] text-primary-600 hover:brightness-95",
};

/**
 * IconBtn — botón cuadrado con un solo icono (Ver/Editar/Eliminar/PDF…).
 * Usado mayoritariamente en filas de tablas y tarjetas.
 */
export const IconBtn = forwardRef<HTMLButtonElement, IconBtnProps>(
  function IconBtn(
    { children, tone = "neutral", size = 30, className, type = "button", ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center rounded-lg border-0 transition",
          "disabled:cursor-not-allowed disabled:opacity-50",
          TONES[tone],
          className,
        )}
        style={{ width: size, height: size }}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
