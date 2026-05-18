"use client";

import { useAuthStore } from "@/store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * ProtectedRoute Component
 *
 * Componente para proteger rutas que requieren autenticación.
 * Usa el store de Zustand para verificar el estado de autenticación.
 *
 * Ventajas sobre Context API:
 * - No causa re-renders innecesarios
 * - Más simple de usar
 * - Mejor performance
 *
 * @example
 * ```tsx
 * export default function ProtectedPage() {
 *   return (
 *     <ProtectedRoute>
 *       <YourContent />
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  redirectTo = "/login",
  fallback,
}: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Solo redirigir si ya se inicializó y no está autenticado
    if (isInitialized && !isAuthenticated && !isLoading) {
      // Guardar la ruta actual para redirigir después del login
      if (pathname !== redirectTo) {
        sessionStorage.setItem("redirectAfterLogin", pathname);
      }
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, isInitialized, router, redirectTo, pathname]);

  // Mostrar loading mientras se verifica
  if (!isInitialized || isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )
    );
  }

  // Si no está autenticado, no renderizar nada (ya se redirigió)
  if (!isAuthenticated) {
    return null;
  }

  // Usuario autenticado, renderizar contenido
  return <>{children}</>;
}
