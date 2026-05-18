"use client";

import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import { useTheme } from "@/contexts/ThemeContext";
import { useUnreadNotificationsCount } from "@/hooks/useNotifications";
import { fromGenericError, notifyError } from "@/lib/error-service";
import { cn, getFullImageUrl } from "@/lib/utils";
import { useAuthStore } from "@/store";
import {
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NavItem = {
  label: string;
  href: string;
  Icon: React.ComponentType<{ size?: number | string }>;
  visibleFor?: string[];
  badgeKey?: "notifications";
};

const NAV_PRIMARY: NavItem[] = [
  { label: "Inicio", href: "/", Icon: Home },
  { label: "Inspecciones", href: "/inspections", Icon: ClipboardList },
  { label: "Ranking", href: "/evaluations", Icon: BarChart3 },
];

const NAV_ADMIN: NavItem[] = [
  {
    label: "Usuarios",
    href: "/admin/users",
    Icon: Users,
    visibleFor: ["ADMINISTRADOR", "JEFE_DE_OBRA", "TECNICO"],
  },
  {
    label: "Clientes",
    href: "/admin/clients",
    Icon: Building2,
    visibleFor: ["ADMINISTRADOR", "JEFE_DE_OBRA"],
  },
  {
    label: "Tipos de inspección",
    href: "/admin/inspection-types",
    Icon: ShieldCheck,
    visibleFor: ["ADMINISTRADOR"],
  },
  {
    label: "Actividades",
    href: "/admin/activities",
    Icon: CheckCircle2,
    visibleFor: ["ADMINISTRADOR"],
  },
  {
    label: "Encabezados / Preguntas",
    href: "/admin/headers",
    Icon: FileText,
    visibleFor: ["ADMINISTRADOR"],
  },
];

const NAV_USER: NavItem[] = [
  {
    label: "Notificaciones",
    href: "/notifications",
    Icon: Bell,
    badgeKey: "notifications",
  },
  { label: "Configuración", href: "/settings", Icon: Settings },
];

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

function roleLabel(userType?: string): string {
  switch (userType) {
    case "ADMINISTRADOR":
      return "Administrador";
    case "JEFE_DE_OBRA":
      return "Jefe de obra";
    case "JEFE_DE_TRABAJO":
      return "Jefe de trabajo";
    case "INSPECTOR":
      return "Inspector";
    case "TECNICO":
      return "Técnico";
    default:
      return "";
  }
}

/**
 * MobileHeader — top bar para móvil (< sm). Hamburguesa a la izquierda
 * (abre drawer con nav), logo + wordmark al centro, avatar a la derecha
 * (lleva al perfil). Sticky con backdrop blur. Respeta safe-area-inset-top
 * (notch iOS) cuando corre en Capacitor.
 */
export function MobileHeader() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const unread = useUnreadNotificationsCount();

  // Cerrar drawer al cambiar de ruta
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // ESC para cerrar drawer + bloquear scroll body
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const profileHref = profileUrlFor(user?.userType);

  const adminItems = useMemo(
    () =>
      NAV_ADMIN.filter(
        (i) => !i.visibleFor || (user && i.visibleFor.includes(user.userType)),
      ),
    [user],
  );

  if (!user) return null;

  const fullName = `${user.firstName} ${user.lastName}`;
  const initials =
    `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const profilePic = user.profile?.profilePicture
    ? getFullImageUrl(user.profile.profilePicture)
    : null;

  const handleLogout = async () => {
    try {
      setLogoutOpen(false);
      setDrawerOpen(false);
      await logout();
      router.push("/login");
    } catch (error) {
      notifyError(fromGenericError(error, "Error al cerrar sesión"));
    }
  };

  return (
    <>
      <header
        style={{
          // Capacitor / iOS notch: empuja el header debajo de la status bar.
          // En navegadores sin notch, env() devuelve 0 → no afecta.
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingLeft: "max(env(safe-area-inset-left, 0px), 0px)",
          paddingRight: "max(env(safe-area-inset-right, 0px), 0px)",
        }}
        className={cn(
          // fixed (no sticky) porque globals.css define overflow-y: auto en
          // main/body, lo que crea scroll containers que rompen position: sticky.
          "fixed inset-x-0 top-0 z-[1900] w-full sm:hidden",
          "border-b border-hairline bg-surface/85 backdrop-blur-xl",
          "dark:border-hairline-dark dark:bg-dark-bg-2/85",
        )}
      >
        <div className="flex h-14 w-full items-center justify-between gap-2 px-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              "border border-hairline bg-[rgba(27,22,20,0.03)] text-ink-2",
              "dark:border-hairline-dark dark:bg-white/[0.04] dark:text-dark-ink-2",
            )}
          >
            <Menu size={18} />
          </button>

          <Link
            href="/"
            aria-label="Safe 360 inicio"
            className="flex h-10 min-w-0 flex-1 items-center justify-center"
          >
            <Logo size={26} />
          </Link>

          <Link
            href="/notifications"
            aria-label={
              unread > 0
                ? `Notificaciones · ${unread} sin leer`
                : "Notificaciones"
            }
            className={cn(
              "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              "border border-hairline bg-[rgba(27,22,20,0.03)] text-ink-2",
              "dark:border-hairline-dark dark:bg-white/[0.04] dark:text-dark-ink-2",
            )}
          >
            <Bell size={17} />
            {unread > 0 && (
              <span
                className={cn(
                  "absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center",
                  "rounded-full bg-grad-brand px-1 text-[10px] font-bold text-white",
                  "ring-2 ring-surface dark:ring-dark-bg-2",
                )}
              >
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>

          <Link
            href={profileHref}
            aria-label="Mi perfil"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
          >
            {profilePic ? (
              <Image
                src={profilePic}
                alt={fullName}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <Avatar name={initials} size={36} />
            )}
          </Link>
        </div>
      </header>

      {/* Spacer: compensa la altura del header fixed para que el contenido no
          quede tapado. Altura = 56px (h-14) + safe-area-inset-top del notch. */}
      <div
        aria-hidden
        style={{ height: "calc(env(safe-area-inset-top, 0px) + 3.5rem)" }}
        className="sm:hidden"
      />

      {/* Drawer hamburguesa */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[2300] flex sm:hidden">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
          />

          {/* Panel lateral */}
          <aside
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
            className={cn(
              "relative z-10 flex w-[80%] max-w-[320px] flex-col",
              "border-r border-hairline bg-surface text-ink shadow-soft-lg",
              "dark:border-hairline-dark dark:bg-dark-surface dark:text-dark-ink dark:shadow-soft-dark",
            )}
          >
            {/* Header del drawer: usuario */}
            <div className="flex items-center gap-3 border-b border-hairline px-4 py-4 dark:border-hairline-dark">
              <Link
                href={profileHref}
                className="flex flex-1 items-center gap-3"
                onClick={() => setDrawerOpen(false)}
              >
                {profilePic ? (
                  <Image
                    src={profilePic}
                    alt={fullName}
                    width={42}
                    height={42}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <Avatar name={initials} size={42} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-bold">
                    {fullName}
                  </div>
                  <div className="truncate text-[11px] text-ink-2 dark:text-dark-ink-2">
                    {roleLabel(user.userType)}
                  </div>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Cerrar menú"
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  "border border-hairline bg-bg-2 text-ink-2",
                  "dark:border-hairline-dark dark:bg-white/[0.05] dark:text-dark-ink-2",
                )}
              >
                <X size={14} />
              </button>
            </div>

            {/* Navegación */}
            <nav className="flex-1 overflow-y-auto px-2 py-3">
              <DrawerSection
                label="Navegación"
                items={NAV_PRIMARY}
                pathname={pathname}
                unread={unread}
              />
              {adminItems.length > 0 && (
                <DrawerSection
                  label="Administración"
                  items={adminItems}
                  pathname={pathname}
                  unread={unread}
                />
              )}
              <DrawerSection
                label="Cuenta"
                items={NAV_USER}
                pathname={pathname}
                unread={unread}
              />
            </nav>

            {/* Footer del drawer: cerrar sesión */}
            <div className="border-t border-hairline px-2 py-3 dark:border-hairline-dark">
              <button
                type="button"
                onClick={() => setLogoutOpen(true)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[13px] font-semibold",
                  "text-primary-600 hover:bg-[rgba(var(--accent-rgb),0.08)]",
                )}
              >
                <LogOut size={15} />
                Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      <ConfirmationDialog
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        title="Cerrar sesión"
        message="¿Quieres cerrar sesión en este dispositivo?"
        confirmText="Cerrar sesión"
        isDark={isDark}
      />
    </>
  );
}

function DrawerSection({
  label,
  items,
  pathname,
  unread,
}: {
  label: string;
  items: NavItem[];
  pathname: string | null;
  unread: number;
}) {
  return (
    <div className="mb-3">
      <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-3 dark:text-dark-ink-2">
        {label}
      </div>
      <div className="grid gap-0.5">
        {items.map((it) => {
          const isActive =
            pathname === it.href ||
            (it.href !== "/" && pathname?.startsWith(it.href));
          const badge =
            it.badgeKey === "notifications" && unread > 0 ? unread : null;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold transition-colors",
                isActive
                  ? "bg-[rgba(var(--accent-rgb),0.08)] text-primary-600"
                  : "text-ink hover:bg-bg-2 dark:text-dark-ink dark:hover:bg-white/[0.04]",
              )}
            >
              <it.Icon size={15} />
              <span className="flex-1 truncate">{it.label}</span>
              {badge !== null && (
                <span
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                    "bg-grad-brand text-white",
                  )}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
