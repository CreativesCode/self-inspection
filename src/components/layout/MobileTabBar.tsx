"use client";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";
import { BarChart3, FileText, Home, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

type Tab = {
  id: "home" | "insp" | "rank" | "profile";
  label: string;
  href: string | (() => string);
  icon: typeof Home;
  matchPrefixes: string[];
};

function profileUrlFor(userType?: string): string {
  switch (userType) {
    case "ADMINISTRADOR":
      return "/profile/admin";
    case "INSPECTOR":
      return "/profile/worker";
    case "JEFE_DE_OBRA":
    case "TECNICO":
      return "/profile/site-manager";
    default:
      return "/profile";
  }
}

const TABS: Tab[] = [
  { id: "home", label: "Inicio", href: "/", icon: Home, matchPrefixes: [] },
  {
    id: "insp",
    label: "Inspecciones",
    href: "/inspections",
    icon: FileText,
    matchPrefixes: ["/inspections"],
  },
  {
    id: "rank",
    label: "Ranking",
    href: "/evaluations",
    icon: BarChart3,
    matchPrefixes: ["/evaluations"],
  },
  {
    id: "profile",
    label: "Perfil",
    href: "/profile", // resuelto en runtime según userType
    icon: UserIcon,
    matchPrefixes: ["/profile"],
  },
];

/**
 * MobileTabBar — bottom-nav fija para móvil. Solo visible en `< sm`.
 * Active: tinted brand + icono coloreado. Respeta safe-area-inset-bottom
 * para iPhones modernos.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const activeId = useMemo(() => {
    if (!pathname) return "home";
    for (const t of TABS) {
      if (t.matchPrefixes.length === 0) continue;
      if (t.matchPrefixes.some((p) => pathname.startsWith(p))) return t.id;
    }
    return pathname === "/" ? "home" : null;
  }, [pathname]);

  // Si no hay user logueado, no rendereamos la tab bar
  if (!user) return null;

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-[2000] flex sm:hidden",
        "items-center justify-around",
        "border-t border-hairline bg-surface/85 backdrop-blur-xl",
        "dark:border-hairline-dark dark:bg-dark-bg-2/85",
        "px-7 pb-7 pt-2.5", // padding inferior alto para safe-area
        "mobile-safe-bottom", // hook de safe-area existente en globals.css
      )}
    >
      {TABS.map((t) => {
        const isActive = activeId === t.id;
        const href =
          t.id === "profile" ? profileUrlFor(user.userType) : (t.href as string);
        const Icon = t.icon;
        return (
          <Link
            key={t.id}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5",
              isActive
                ? "text-primary-500"
                : "text-ink-3 dark:text-dark-ink-2",
            )}
          >
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.7} />
            <span className="text-[10px] font-semibold">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
