import { AppError, setErrorHandler } from "@/lib/error-service";
import { create } from "zustand";

interface ErrorState {
  // Estado
  errors: AppError[];

  // Acciones
  pushError: (error: AppError) => void;
  dismissError: (incidentId?: string) => void;
  clearErrors: () => void;
}

/**
 * Store de manejo de errores con Zustand
 *
 * Características:
 * - Gestión centralizada de errores
 * - Deduplicación automática por incidentId
 * - Límite de 10 errores máximo
 * - Integración con el sistema de notificaciones
 * - Compatible con Capacitor y SPA
 */
export const useErrorStore = create<ErrorState>((set) => ({
  // Estado inicial
  errors: [],

  // Agregar un error
  pushError: (error: AppError) => {
    set((state) => {
      // Verificar si el error ya existe
      const existing = state.errors.find(
        (item) => item.incidentId === error.incidentId
      );

      if (existing) {
        return state; // No agregar duplicados
      }

      // Agregar el nuevo error y mantener máximo 10
      return {
        errors: [error, ...state.errors].slice(0, 10),
      };
    });
  },

  // Descartar un error específico o todos
  dismissError: (incidentId?: string) => {
    set((state) => ({
      errors: incidentId
        ? state.errors.filter((error) => error.incidentId !== incidentId)
        : [],
    }));
  },

  // Limpiar todos los errores
  clearErrors: () => {
    set({ errors: [] });
  },
}));

/**
 * Inicializar el error handler global
 * Debe llamarse al inicio de la aplicación
 */
export const initializeErrorStore = () => {
  setErrorHandler(useErrorStore.getState().pushError);

  return () => {
    setErrorHandler(null);
  };
};
