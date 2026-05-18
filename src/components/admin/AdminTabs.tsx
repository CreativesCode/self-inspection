"use client";

import { cn } from "@/lib/utils";
import {
  Activity as ActivityIcon,
  Building2,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

export type AdminTabKey =
  | "users"
  | "clients"
  | "inspection-types"
  | "activities"
  | "headers";

const TABS: Array<{
  key: AdminTabKey;
  label: string;
  href: string;
  Icon: React.ComponentType<{ size?: number | string }>;
}> = [
  { key: "users", label: "Usuarios", href: "/admin/users", Icon: Users },
  {
    key: "clients",
    label: "Clientes",
    href: "/admin/clients",
    Icon: Building2,
  },
  {
    key: "inspection-types",
    label: "Tipos de inspección",
    href: "/admin/inspection-types",
    Icon: ShieldCheck,
  },
  {
    key: "activities",
    label: "Actividades",
    href: "/admin/activities",
    Icon: CheckCircle2,
  },
  {
    key: "headers",
    label: "Encabezados / Preguntas",
    href: "/admin/headers",
    Icon: FileText,
  },
];

/** Re-export por si otra view quiere reusar el icono (no usado por ahora). */
export const ADMIN_ICON_DEFAULTS = {
  activities: ActivityIcon,
};

/**
 * AdminTabs — barra de pestañas estilizada con el gradient brand para el tab
 * activo. Reutiliza la misma estética que el design (tokens.jsx · Admin nav).
 */
export function AdminTabs({ active }: { active: AdminTabKey }) {
  const router = useRouter();
  return (
    <div className="mb-5 flex flex-wrap items-center gap-1 rounded-[14px] border border-hairline bg-surface p-1 dark:border-hairline-dark dark:bg-dark-surface">
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => router.push(t.href)}
            className={cn(
              "inline-flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-[13px] font-semibold transition-colors",
              isActive
                ? "bg-grad-brand text-white"
                : "text-ink-2 hover:bg-bg-2 dark:text-dark-ink-2 dark:hover:bg-white/[0.04]",
            )}
          >
            <t.Icon size={13} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
