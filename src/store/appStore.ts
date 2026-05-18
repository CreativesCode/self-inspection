import { create } from "zustand";

interface Notification {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

interface AppState {
  // Estado
  isLoading: boolean;
  error: string | null;
  notifications: Notification[];
  
  // Acciones
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

/**
 * Store de estado general de la aplicación con Zustand
 * 
 * Características:
 * - Gestión de estado de carga global
 * - Manejo de errores genéricos
 * - Sistema de notificaciones con auto-dismiss
 * - Compatible con Capacitor y SPA
 */
export const useAppStore = create<AppState>((set, get) => ({
  // Estado inicial
  isLoading: false,
  error: null,
  notifications: [],

  // Establecer estado de carga
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Establecer error
  setError: (error: string | null) => {
    set({ error });
  },

  // Agregar una notificación
  addNotification: (notification: Omit<Notification, "id">) => {
    // Generar ID único
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newNotification: Notification = {
      ...notification,
      id,
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-dismiss si tiene duración
    if (notification.duration) {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration);
    }
  },

  // Remover una notificación específica
  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  // Limpiar todas las notificaciones
  clearNotifications: () => {
    set({ notifications: [] });
  },
}));

// Selectores útiles
export const selectIsLoading = (state: AppState) => state.isLoading;
export const selectError = (state: AppState) => state.error;
export const selectNotifications = (state: AppState) => state.notifications;
export const selectHasNotifications = (state: AppState) => state.notifications.length > 0;

