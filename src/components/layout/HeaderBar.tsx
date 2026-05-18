"use client";

import { Logo } from "@/components/ui/Logo";
import { useUnreadNotificationsCount } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";
import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { HeaderUserMenu } from "./HeaderUserMenu";

type NavItem = {
  id: "home" | "insp" | "eval" | "admin";
  label: string;
  href: string;
  /** Si la ruta empieza con alguna de éstas, el item se considera activo. */
  matchPrefixes: string[];
  /** Si está definido, solo se muestra cuando `userType` está incluido. */
  visibleFor?: string[];
};

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Inicio", href: "/", matchPrefixes: [] }, // exact match
  {
    id: "insp",
    label: "Inspecciones",
    href: "/inspections",
    matchPrefixes: ["/inspections"],
  },
  {
    id: "eval",
    label: "Evaluaciones",
    href: "/evaluations",
    matchPrefixes: ["/evaluations"],
  },
  {
    id: "admin",
    label: "Administración",
    href: "/admin/users",
    matchPrefixes: ["/admin"],
    visibleFor: ["ADMINISTRADOR", "JEFE_DE_OBRA", "TECNICO"],
  },
];

/**
 * HeaderBar — top-bar global del rediseño Safe 360.
 *
 * Estructura:
 *   - Izquierda: Logo + nav horizontal (4 items, role-aware).
 *   - Derecha: search ⌘K (placeholder visual) + bell + user pill / login CTA.
 *
 * Sticky con backdrop-blur. Oculto en `< sm` (la nav móvil vive en
 * <MobileTabBar>). Escóndelo en login desde el layout root.
 */
export function HeaderBar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const unread = useUnreadNotificationsCount();

  const items = useMemo(
    () =>
      NAV_ITEMS.filter(
        (i) => !i.visibleFor || (user && i.visibleFor.includes(user.userType)),
      ),
    [user],
  );

  const activeId = useMemo(() => {
    if (!pathname) return "home";
    for (const item of items) {
      if (item.matchPrefixes.length === 0) continue;
      if (item.matchPrefixes.some((p) => pathname.startsWith(p))) return item.id;
    }
    return pathname === "/" ? "home" : null;
  }, [pathname, items]);

  return (
    <header
      className={cn(
        "sticky top-0 z-[2000] hidden h-[68px] w-full items-center justify-between sm:flex",
        "border-b border-hairline px-8",
        "bg-surface/70 backdrop-blur-xl",
        "dark:border-hairline-dark dark:bg-dark-bg-2/70",
      )}
    >
      {/* Left: logo + nav */}
      <div className="flex items-center gap-9">
        <Link href="/" aria-label="Safe 360 inicio">
          <Logo size={32} />
        </Link>
        <nav className="flex gap-1">
          {items.map((i) => {
            const isActive = activeId === i.id;
            return (
              <Link
                key={i.id}
                href={i.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  "border",
                  isActive
                    ? "border-hairline bg-[rgba(27,22,20,0.04)] text-ink " +
                        "dark:border-hairline-dark dark:bg-white/[0.06] dark:text-dark-ink"
                    : "border-transparent text-ink-2 hover:text-ink " +
                        "dark:text-dark-ink-2 dark:hover:text-dark-ink",
                )}
              >
                {i.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: bell + user */}
      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          aria-label={
            unread > 0 ? `Notificaciones · ${unread} sin leer` : "Notificaciones"
          }
          className={cn(
            "relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-full",
            "border border-hairline bg-[rgba(27,22,20,0.03)] text-ink-2 hover:brightness-95",
            "dark:border-hairline-dark dark:bg-white/[0.04] dark:text-dark-ink-2",
          )}
        >
          <Bell size={16} />
          {unread > 0 && (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center",
                "rounded-full bg-grad-brand px-1 text-[10px] font-bold text-white",
                "ring-2 ring-surface dark:ring-dark-bg-2",
              )}
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Link>

        <HeaderUserMenu />
      </div>
    </header>
  );
}
