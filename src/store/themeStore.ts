import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  // Estado
  theme: Theme;
  isDark: boolean;
  mounted: boolean;

  // Acciones
  setTheme: (theme: Theme) => void;
  setMounted: (mounted: boolean) => void;
  applyTheme: () => void;
  initialize: () => (() => void) | undefined;
}

/**
 * Store de tema con Zustand
 *
 * Características:
 * - Persistencia automática en localStorage
 * - Soporte para tema system (detecta preferencia del OS)
 * - Aplicación automática de clases CSS
 * - Compatible con Capacitor y SPA
 * - Prevención de flash en primera carga
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      theme: "system",
      isDark: false,
      mounted: false,

      // Establecer si el componente está montado
      setMounted: (mounted: boolean) => {
        set({ mounted });

        // Aplicar tema cuando se monta
        if (mounted) {
          get().applyTheme();
        }
      },

      // Cambiar el tema
      setTheme: (newTheme: Theme) => {
        set({ theme: newTheme });

        // Aplicar el nuevo tema inmediatamente si está montado
        if (get().mounted) {
          get().applyTheme();
        }
      },

      // Aplicar el tema al DOM
      applyTheme: () => {
        const { theme, mounted } = get();

        if (!mounted || typeof window === "undefined") {
          return;
        }

        const root = window.document.documentElement;
        root.classList.remove("light", "dark");

        if (theme === "system") {
          // Detectar preferencia del sistema
          const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
            .matches
            ? "dark"
            : "light";

          root.classList.add(systemTheme);
          set({ isDark: systemTheme === "dark" });
        } else {
          root.classList.add(theme);
          set({ isDark: theme === "dark" });
        }
      },

      // Inicializar el tema
      initialize: () => {
        set({ mounted: true });
        get().applyTheme();

        // Escuchar cambios en la preferencia del sistema
        if (typeof window !== "undefined") {
          const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

          const handleChange = () => {
            const { theme } = get();
            if (theme === "system") {
              get().applyTheme();
            }
          };

          // Usar addEventListener si está disponible, sino usar addListener
          if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handleChange);
          } else {
            // @ts-ignore - Para navegadores antiguos
            mediaQuery.addListener(handleChange);
          }

          // Retornar función de limpieza
          return () => {
            if (mediaQuery.removeEventListener) {
              mediaQuery.removeEventListener("change", handleChange);
            } else {
              // @ts-ignore - Para navegadores antiguos
              mediaQuery.removeListener(handleChange);
            }
          };
        }

        return undefined;
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => localStorage),
      // Solo persistir el tema, no el estado de montado ni isDark
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);

/**
 * Inicializar el store de tema
 * Debe llamarse al montar la aplicación
 */
export const initializeThemeStore = () => {
  return useThemeStore.getState().initialize();
};
