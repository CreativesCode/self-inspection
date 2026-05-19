"use client";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";
import {
  Activity as ActivityIcon,
  Building2,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

export type AdminTabKey =
  | "users"
  | "clients"
  | "inspection-types"
  | "activities"
  | "headers";

// `visibleFor` debe coincidir con los guards de cada página /admin/* para que
// no aparezcan tabs que luego rebotan al login. Ver:
//   - /admin/users         → ADMINISTRADOR, JEFE_DE_OBRA, TECNICO
//   - /admin/clients       → ADMINISTRADOR, JEFE_DE_OBRA
//   - /admin/inspection-types, /admin/activities, /admin/headers → ADMINISTRADOR
const TABS: Array<{
  key: AdminTabKey;
  label: string;
  href: string;
  Icon: React.ComponentType<{ size?: number | string }>;
  visibleFor: string[];
}> = [
  {
    key: "users",
    label: "Usuarios",
    href: "/admin/users",
    Icon: Users,
    visibleFor: ["ADMINISTRADOR", "JEFE_DE_OBRA", "TECNICO"],
  },
  {
    key: "clients",
    label: "Clientes",
    href: "/admin/clients",
    Icon: Building2,
    visibleFor: ["ADMINISTRADOR", "JEFE_DE_OBRA"],
  },
  {
    key: "inspection-types",
    label: "Tipos de inspección",
    href: "/admin/inspection-types",
    Icon: ShieldCheck,
    visibleFor: ["ADMINISTRADOR"],
  },
  {
    key: "activities",
    label: "Actividades",
    href: "/admin/activities",
    Icon: CheckCircle2,
    visibleFor: ["ADMINISTRADOR"],
  },
  {
    key: "headers",
    label: "Encabezados / Preguntas",
    href: "/admin/headers",
    Icon: FileText,
    visibleFor: ["ADMINISTRADOR"],
  },
];

/** Re-export por si otra view quiere reusar el icono (no usado por ahora). */
export const ADMIN_ICON_DEFAULTS = {
  activities: ActivityIcon,
};

/**
 * AdminTabs — barra de pestañas estilizada con el gradient brand para el tab
 * activo. Reutiliza la misma estética que el design (tokens.jsx · Admin nav).
 *
 * Filtra los tabs según el rol del usuario para no exponer secciones a las
 * que el guard de la página les rebotaría al login (UX coherente con
 * MobileHeader/HeaderBar que ya hacen el mismo filtrado).
 */
export function AdminTabs({ active }: { active: AdminTabKey }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const visibleTabs = useMemo(
    () => TABS.filter((t) => user && t.visibleFor.includes(user.userType)),
    [user],
  );

  return (
    <div className="mb-5 flex flex-wrap items-center gap-1 rounded-[14px] border border-hairline bg-surface p-1 dark:border-hairline-dark dark:bg-dark-surface">
      {visibleTabs.map((t) => {
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
