"use client";

import { useAuthStore } from "@/store";
import { useEffect } from "react";

/**
 * AuthInitializer Component
 *
 * Este componente espera a que el store de autenticación termine de
 * inicializarse antes de renderizar los children. Esto previene el
 * "flash" al login cuando se hace refresh (F5).
 *
 * Flujo:
 * 1. Muestra loading mientras verifica el token
 * 2. Una vez verificado, renderiza los children
 * 3. Las rutas protegidas ya tienen el estado correcto
 */

interface AuthInitializerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthInitializer({
  children,
  fallback,
}: AuthInitializerProps): JSX.Element | null {
  // Los hooks deben ejecutarse incondicionalmente
  // Zustand maneja SSR automáticamente, pero este componente se carga con ssr: false
  const isInitialized = useAuthStore((state) => state.isInitialized);

  // Inicializar el store si no está inicializado
  useEffect(() => {
    if (!isInitialized) {
      const { initialize } = useAuthStore.getState();
      initialize().catch((error) => {
        console.error("Error initializing auth store:", error);
      });
    }
  }, [isInitialized]);

  // Mostrar fallback mientras se inicializa
  if (!isInitialized) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Cargando aplicación...
          </p>
        </div>
      </div>
    );
  }

  // Una vez inicializado, renderizar la app
  return <>{children}</>;
}
