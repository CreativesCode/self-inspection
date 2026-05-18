"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  /** Renderiza ancho 100% */
  block?: boolean;
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3.5 py-2 text-[13px]",
  md: "px-[18px] py-2.5 text-sm",
  lg: "px-[22px] py-3.5 text-sm",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "tracking-tight transition-colors disabled:opacity-50 disabled:cursor-not-allowed " +
  "select-none";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-grad-brand text-white border-0 shadow-brand-glow " +
    "hover:brightness-105 active:brightness-95",
  ghost:
    "bg-[rgba(27,22,20,0.03)] text-ink border border-hairline " +
    "hover:bg-[rgba(27,22,20,0.05)] " +
    "dark:bg-white/5 dark:text-dark-ink dark:hover:bg-white/[0.08]",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    variant = "primary",
    size = "md",
    icon,
    iconPosition = "left",
    block = false,
    className,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        BASE,
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {icon && iconPosition === "left" && (
        <span className="inline-flex shrink-0">{icon}</span>
      )}
      {children}
      {icon && iconPosition === "right" && (
        <span className="inline-flex shrink-0">{icon}</span>
      )}
    </button>
  );
});
