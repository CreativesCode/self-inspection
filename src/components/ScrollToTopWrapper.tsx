"use client";

import { useCapacitorScroll } from "@/hooks/useCapacitorScroll";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { usePathname } from "next/navigation";

// Detectar si estamos en Capacitor
const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;

interface ScrollToTopWrapperProps {
  children: React.ReactNode;
  /**
   * Si debe hacer scroll al tope cuando cambie la ruta
   */
  scrollOnRouteChange?: boolean;
  /**
   * Si debe hacer scroll al tope cuando se monte el componente
   */
  scrollOnMount?: boolean;
  /**
   * Selector del elemento contenedor de scroll
   */
  scrollContainerSelector?: string;
  /**
   * Delay en ms antes de hacer scroll
   */
  delay?: number;
  /**
   * Comportamiento del scroll
   */
  behavior?: ScrollBehavior;
  /**
   * Rutas que deben ser excluidas del scroll automático
   */
  excludePaths?: string[];
}

/**
 * Componente wrapper que maneja el scroll automático al tope
 * Se puede usar a nivel global o en páginas específicas
 */
export const ScrollToTopWrapper: React.FC<ScrollToTopWrapperProps> = ({
  children,
  scrollOnRouteChange = true,
  scrollOnMount = true,
  scrollContainerSelector,
  delay = 100,
  behavior = 'smooth',
  excludePaths = []
}) => {
  const pathname = usePathname();
  
  // Usar hook específico para Capacitor o el hook general
  const scrollHook = isCapacitor 
    ? useCapacitorScroll({
        scrollOnRouteChange: false, // Lo manejamos manualmente aquí
        scrollOnMount: false, // Lo manejamos manualmente aquí
        delay: Math.max(delay, 300),
        excludePaths
      })
    : useScrollToTop({
        scrollOnRouteChange: false, // Lo manejamos manualmente aquí
        scrollOnMount: false, // Lo manejamos manualmente aquí
        scrollContainerSelector,
        delay,
        behavior
      });

  const { scrollToTop } = scrollHook;

  // Los hooks específicos ya manejan la lógica de scroll
  // Solo necesitamos exponer las funciones manuales si es necesario

  return <>{children}</>;
};
