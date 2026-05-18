"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type PageBtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  active?: boolean;
};

/**
 * PageBtn — botón de paginación. El activo va en gradient brand sólido.
 * Pasa números, "...", o iconos de flecha como children.
 */
export const PageBtn = forwardRef<HTMLButtonElement, PageBtnProps>(
  function PageBtn(
    { children, active = false, className, type = "button", ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg",
          "px-2.5 text-[13px] font-semibold transition",
          active
            ? "bg-grad-brand border-0 text-white shadow-brand-glow"
            : "border border-hairline bg-surface text-ink-2 hover:brightness-95 " +
                "dark:border-hairline-dark dark:bg-white/[0.04] dark:text-dark-ink-2",
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
