"use client";

import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import { Avatar } from "@/components/ui/Avatar";
import { useTheme } from "@/contexts/ThemeContext";
import { fromGenericError, notifyError } from "@/lib/error-service";
import { cn, getFullImageUrl } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuthStore } from "@/store";
import {
  ChevronDown,
  ClipboardList,
  LogOut,
  Moon,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ITEM_BASE =
  "flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium " +
  "text-ink outline-none transition-colors data-[highlighted]:bg-[rgba(27,22,20,0.05)] " +
  "dark:text-dark-ink dark:data-[highlighted]:bg-white/[0.06]";

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
 * HeaderUserMenu — pill con avatar + nombre + rol + chevron, abre dropdown
 * Radix con Mi Perfil / Mis Evaluaciones / Tema / Cerrar sesión.
 */
export function HeaderUserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { isDark, theme, setTheme } = useTheme();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) {
    return (
      <Link
        href="/login"
        className={cn(
          "rounded-full px-4 py-2 text-sm font-semibold",
          "bg-grad-brand text-white shadow-brand-glow",
        )}
      >
        Iniciar sesión
      </Link>
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const profilePic = user.profile?.profilePicture
    ? getFullImageUrl(user.profile.profilePicture)
    : null;

  const handleLogout = async () => {
    try {
      setShowLogoutConfirm(false);
      await logout();
      router.push("/login");
    } catch (error) {
      if (
        error instanceof Error &&
        !error.message.includes("Error al cerrar sesión")
      ) {
        notifyError(fromGenericError(error, "Error al cerrar sesión"));
      }
    }
  };

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2.5 rounded-full p-1 pr-3",
              "border border-hairline bg-surface text-left",
              "dark:border-hairline-dark dark:bg-white/[0.04]",
              "hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
            )}
          >
            {profilePic ? (
              <Image
                src={profilePic}
                alt={fullName}
                width={30}
                height={30}
                className="rounded-full object-cover"
              />
            ) : (
              <Avatar name={initials} size={30} />
            )}
            <span className="hidden flex-col leading-tight md:flex">
              <span className="text-[13px] font-semibold text-ink dark:text-dark-ink">
                {fullName}
              </span>
              <span className="text-[11px] text-ink-2 dark:text-dark-ink-2">
                {roleLabel(user.userType)}
              </span>
            </span>
            <ChevronDown size={14} className="text-ink-2 dark:text-dark-ink-2" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={8}
            align="end"
            className={cn(
              "z-[2100] min-w-[220px] rounded-xl p-1.5 shadow-soft-lg",
              "border border-hairline bg-surface",
              "dark:border-hairline-dark dark:bg-dark-surface dark:shadow-soft-dark",
            )}
          >
            <div className="px-2.5 pb-2 pt-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 dark:text-dark-ink-2">
                Sesión activa
              </div>
              <div className="mt-0.5 truncate text-[13px] font-semibold text-ink dark:text-dark-ink">
                {user.email}
              </div>
            </div>
            <DropdownMenu.Separator className="my-1 h-px bg-hairline dark:bg-hairline-dark" />

            <DropdownMenu.Item asChild>
              <Link href={profileUrlFor(user.userType)} className={ITEM_BASE}>
                <UserIcon size={15} className="text-ink-2 dark:text-dark-ink-2" />
                Mi perfil
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <Link
                href={`/evaluations/details?userId=${user.id}`}
                className={ITEM_BASE}
              >
                <ClipboardList
                  size={15}
                  className="text-ink-2 dark:text-dark-ink-2"
                />
                Mis evaluaciones
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <Link href="/settings" className={ITEM_BASE}>
                <SettingsIcon
                  size={15}
                  className="text-ink-2 dark:text-dark-ink-2"
                />
                Configuración
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="my-1 h-px bg-hairline dark:bg-hairline-dark" />

            <DropdownMenu.Item
              className={ITEM_BASE}
              onSelect={(e) => {
                e.preventDefault();
                setTheme(theme === "dark" ? "light" : "dark");
              }}
            >
              {isDark ? (
                <Sun size={15} className="text-ink-2 dark:text-dark-ink-2" />
              ) : (
                <Moon size={15} className="text-ink-2 dark:text-dark-ink-2" />
              )}
              Tema {isDark ? "claro" : "oscuro"}
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="my-1 h-px bg-hairline dark:bg-hairline-dark" />

            <DropdownMenu.Item
              className={cn(
                ITEM_BASE,
                "!text-primary-600 data-[highlighted]:!bg-[rgba(var(--accent-rgb),0.08)]",
              )}
              onSelect={() => {
                // Dejar que Radix cierre el menú y luego abrir el diálogo:
                // si abrimos antes, el focus-trap del dropdown roba el foco
                // al modal y el botón "Cerrar sesión" no llega a click.
                setTimeout(() => setShowLogoutConfirm(true), 0);
              }}
            >
              <LogOut size={15} />
              Cerrar sesión
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {showLogoutConfirm && (
        <ConfirmationDialog
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
          title="Cerrar sesión"
          message="¿Quieres cerrar sesión en este dispositivo?"
          confirmText="Cerrar sesión"
          isDark={isDark}
        />
      )}
    </>
  );
}

// Re-exporta el icono shield para uso en HeaderBar (placeholders).
export { ShieldCheck };
