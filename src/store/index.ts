/**
 * Stores centralizados con Zustand
 *
 * Este módulo exporta todos los stores de la aplicación usando Zustand
 * para manejo de estado global, reemplazando Context API.
 *
 * Ventajas:
 * - Mejor rendimiento (menos re-renders)
 * - Menos boilerplate
 * - Persistencia nativa
 * - Compatible con SPA y Capacitor
 * - TypeScript first-class support
 *
 * @example
 * ```tsx
 * import { useAuthStore, useThemeStore } from '@/store';
 *
 * function MyComponent() {
 *   const { user, login } = useAuthStore();
 *   const { theme, setTheme } = useThemeStore();
 *
 *   // ...
 * }
 * ```
 */

// Export stores
export {
  selectError,
  selectHasNotifications,
  selectIsLoading,
  selectNotifications,
  useAppStore,
} from "./appStore";
export { initializeAuthStore, useAuthStore } from "./authStore";
export { initializeErrorStore, useErrorStore } from "./errorStore";
export { useRefreshStore } from "./refreshStore";
export { initializeThemeStore, useThemeStore } from "./themeStore";
