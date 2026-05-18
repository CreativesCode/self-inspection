"use client";

import { cn } from "@/lib/utils";

type AvatarProps = {
  /** Iniciales o nombre. Si es nombre, se muestra tal cual; el color se elige por hash. */
  name: string;
  size?: number;
  src?: string | null;
  /** Anillo de marca alrededor del avatar (top-3 de rankings, perfil hero) */
  ring?: boolean;
  className?: string;
};

/**
 * Paleta de gradientes warm (matches docs/design/views/tokens.jsx:298).
 * Determinístico: el hash del nombre escoge siempre el mismo color para el
 * mismo usuario.
 */
const GRADIENTS = [
  "linear-gradient(135deg,var(--accent-500),var(--accent-400))",
  "linear-gradient(135deg,var(--accent-400),var(--accent-300))",
  "linear-gradient(135deg,#786B66,#ACA3A0)",
  "linear-gradient(135deg,#4F75E1,#8FA9F0)",
  "linear-gradient(135deg,#2F9E6A,#6BC79A)",
  "linear-gradient(135deg,#E8A33D,#F4C66E)",
];

function pickGradient(name: string): string {
  if (!name) return GRADIENTS[0];
  const a = name.charCodeAt(0) || 0;
  const b = name.charCodeAt(name.length - 1) || 0;
  return GRADIENTS[(a + b) % GRADIENTS.length];
}

/**
 * Avatar — círculo con iniciales sobre gradient warm, o imagen si `src`.
 * El `ring` añade doble anillo (surface + brand) usado en Top-3 / hero.
 */
export function Avatar({
  name,
  size = 32,
  src = null,
  ring = false,
  className,
}: AvatarProps) {
  const background = src ? `center/cover url(${src})` : pickGradient(name);

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        "font-bold text-white tracking-tight",
        className,
      )}
      style={{
        width: size,
        height: size,
        background,
        fontSize: size * 0.38,
        boxShadow: ring
          ? "0 0 0 3px var(--avatar-ring-bg, #FFFFFF), 0 0 0 4px var(--accent-500)"
          : "0 1px 2px rgba(0,0,0,0.1)",
      }}
    >
      {!src && name}
    </div>
  );
}
