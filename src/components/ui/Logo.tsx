"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

type LogoProps = {
  /** Tamaño del símbolo en px. El wordmark escala como `size * 0.5`. */
  size?: number;
  /** Mostrar el wordmark "Safe 360" además del símbolo. */
  withText?: boolean;
  className?: string;
};

/**
 * Logo — símbolo Safe 360 con wordmark opcional en gradient brand.
 * Usa el SVG existente en /public/logo.svg.
 */
export function Logo({ size = 36, withText = true, className }: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/logo.svg"
        alt="Safe 360"
        width={size}
        height={size}
        priority
      />
      {withText && (
        <span
          className="text-grad-brand font-extrabold tracking-tight"
          style={{ fontSize: size * 0.5 }}
        >
          Safe 360
        </span>
      )}
    </div>
  );
}
