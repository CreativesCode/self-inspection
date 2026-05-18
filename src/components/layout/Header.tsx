"use client";

import { useAuthStore } from "@/store";
import { useTheme } from "@/contexts/ThemeContext";

import { getAvatarColor, getFullImageUrl } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { fromGenericError, notifyError } from "@/lib/error-service";

// Componente para diálogo de confirmación
const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) => {
  const { theme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);

  // Cerrar el diálogo haciendo clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className={`relative w-full max-w-md p-6 rounded-lg shadow-lg ${
          theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
      >
        <div className="flex items-center mb-4">
          <AlertTriangle className="text-yellow-500 mr-2" size={24} />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        <p
          className={`mb-6 ${
            theme === "dark" ? "text-gray-300" : "text-gray-600"
          }`}
        >
          {message}
        </p>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-md ${
              theme === "dark"
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md ${
              theme === "dark"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export function Header() {
  // Zustand con selectores
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { isDark, theme, setTheme } = useTheme();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar el dropdown cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogoutAttempt = () => {
    setIsDropdownOpen(false);
    setShowLogoutConfirmation(true);
  };

  const handleLogout = async () => {
    try {
      // Cerrar el diálogo primero
      setShowLogoutConfirmation(false);

      // Proceder con el cierre de sesión
      await logout();
      router.push("/login");
    } catch (error) {
      // Los errores ya son manejados por AuthContext y Apollo Link
      // Solo notificamos si es un error local no capturado
      if (error instanceof Error && !error.message.includes("Error al cerrar sesión")) {
        notifyError(fromGenericError(error, "Error al cerrar sesión"));
      }
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const profilePictureUrl = user?.profile?.profilePicture
    ? getFullImageUrl(user.profile.profilePicture)
    : null;

  const profileUrl = () => {
    if (user?.userType === "ADMINISTRADOR") {
      return "/profile/admin";
    } else if (user?.userType === "INSPECTOR") {
      return "/profile/worker";
    } else if (user?.userType === "JEFE_DE_OBRA") {
      return "/profile/site-manager";
    } else if (user?.userType === "TECNICO") {
      return "/profile/site-manager";
    }

    return "/profile";
  };

  const isAdmin = user?.userType === "ADMINISTRADOR";
  const isProjectManager = user?.userType === "JEFE_DE_OBRA";
  const isTechnician = user?.userType === "TECNICO";

  return (
    <header
      className={`sticky top-0 z-[2000] w-full border-b mobile-safe-header mobile-header-fallback px-4 ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mobile-safe-content">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link
            href="/"
            className={`header-primary flex gap-2 items-center ${
              isDark ? "header-primary-dark" : "header-primary-light"
            }`}
          >
            <Image
              src="/logo.svg"
              alt="Self Inspection"
              width={50}
              height={50}
            />
            Safe 360
          </Link>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`p-2 rounded-lg ${
                isDark
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {isDark ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  {profilePictureUrl ? (
                    <Image
                      src={profilePictureUrl}
                      alt={`${user.firstName} ${user.lastName}`}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="size-8 rounded-full flex items-center justify-center text-white text-md font-bold"
                      style={{
                        backgroundColor: getAvatarColor(
                          `${user.firstName}${user.lastName}`
                        ),
                      }}
                    >
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                  )}
                  <span
                    className={`text-sm hidden md:block ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {user.firstName} {user.lastName}
                  </span>
                  <span
                    className={`text-sm block md:hidden ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {getInitials(user.firstName, user.lastName)}
                  </span>
                  <svg
                    className={`w-4 h-4 ${
                      isDark ? "text-white" : "text-gray-900"
                    } ${isDropdownOpen ? "transform rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div
                    ref={dropdownRef}
                    className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ${
                      isDark
                        ? "bg-gray-800 border border-gray-700"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <Link
                      href={profileUrl()}
                      className={`block px-4 py-2 text-sm ${
                        isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Mi Perfil
                    </Link>
                    <Link
                      href={`/evaluations/details?userId=${user?.id}`}
                      className={`block px-4 py-2 text-sm ${
                        isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Mis Evaluaciones
                    </Link>
                    {(isAdmin || isProjectManager || isTechnician) && (
                      <Link
                        href="/admin/users"
                        className={`block px-4 py-2 text-sm ${
                          isDark
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Gestionar Usuarios
                      </Link>
                    )}
                    {(isAdmin || isProjectManager) && (
                      <Link
                        href="/admin/clients"
                        className={`block px-4 py-2 text-sm ${
                          isDark
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Gestionar Clientes
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        href="/admin/inspection-types"
                        className={`block px-4 py-2 text-sm ${
                          isDark
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Gestionar Tipos de Inspección
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        href="/admin/activities"
                        className={`block px-4 py-2 text-sm ${
                          isDark
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Gestionar Actividades
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        href="/admin/headers"
                        className={`block px-4 py-2 text-sm ${
                          isDark
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Gestionar Encabezados
                      </Link>
                    )}

                    <Link
                      href="/inspections"
                      className={`block px-4 py-2 text-sm ${
                        isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Gestionar Inspecciones
                    </Link>
                    <Link
                      href="/evaluations"
                      className={`block px-4 py-2 text-sm ${
                        isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Datos de Evaluaciones
                    </Link>
                    <button
                      onClick={handleLogoutAttempt}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        isDark
                          ? "text-red-400 hover:bg-gray-700"
                          : "text-red-600 hover:bg-gray-100"
                      }`}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className={`px-3 py-1 rounded-md text-sm ${
                  isDark
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                }`}
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación para cerrar sesión */}
      {showLogoutConfirmation && (
        <ConfirmationDialog
          isOpen={showLogoutConfirmation}
          onClose={() => setShowLogoutConfirmation(false)}
          onConfirm={handleLogout}
          title="Confirmar Cierre de Sesión"
          message="¿Estás seguro de que deseas cerrar sesión?"
        />
      )}
    </header>
  );
}
