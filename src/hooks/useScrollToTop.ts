"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

// Detectar si estamos en Capacitor
const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;

interface UseScrollToTopOptions {
  /**
   * Si debe hacer scroll al tope cuando cambie la ruta
   */
  scrollOnRouteChange?: boolean;
  /**
   * Si debe hacer scroll al tope cuando se monte el componente
   */
  scrollOnMount?: boolean;
  /**
   * Selector del elemento contenedor de scroll (por defecto busca contenedores comunes)
   */
  scrollContainerSelector?: string;
  /**
   * Delay en ms antes de hacer scroll (útil para esperar a que se renderice el contenido)
   */
  delay?: number;
  /**
   * Comportamiento del scroll
   */
  behavior?: ScrollBehavior;
}

/**
 * Hook para manejar el scroll automático al tope de la página
 * Funciona tanto en navegación normal como en redirects
 */
export const useScrollToTop = ({
  scrollOnRouteChange = true,
  scrollOnMount = true,
  scrollContainerSelector,
  delay = 0,
  behavior = 'smooth'
}: UseScrollToTopOptions = {}) => {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);
  const hasScrolledOnMount = useRef(false);

  /**
   * Función para encontrar el contenedor de scroll correcto
   */
  const findScrollContainer = (): HTMLElement | null => {
    // Si se especifica un selector personalizado, usarlo
    if (scrollContainerSelector) {
      return document.querySelector(scrollContainerSelector) as HTMLElement;
    }

    // En Capacitor, priorizar el body y html
    if (isCapacitor) {
      const body = document.body;
      const html = document.documentElement;
      
      // Verificar si el body tiene scroll
      if (body.scrollHeight > body.clientHeight) {
        return body;
      }
      
      // Verificar si el html tiene scroll
      if (html.scrollHeight > html.clientHeight) {
        return html;
      }
      
      // Buscar contenedores específicos
      const capacitorContainers = [
        'main',
        '[data-scroll-container]',
        '[data-scrollable]',
        '.overflow-auto',
        '.overflow-y-auto'
      ];

      for (const selector of capacitorContainers) {
        const container = document.querySelector(selector) as HTMLElement;
        if (container && container.scrollHeight > container.clientHeight) {
          return container;
        }
      }
      
      // Como último recurso en Capacitor, usar body
      return body;
    }

    // Buscar contenedores específicos en orden de prioridad (navegador web)
    const scrollContainers = [
      '[data-scroll-container]',
      '[data-scrollable]',
      '.overflow-auto',
      '.overflow-y-auto',
      '.overflow-scroll',
      '.overflow-y-scroll',
      'main',
      'body',
      'html'
    ];

    for (const selector of scrollContainers) {
      const container = document.querySelector(selector) as HTMLElement;
      if (container) {
        return container;
      }
    }

    // Como último recurso, usar window
    return null;
  };

  /**
   * Función para hacer scroll al tope
   */
  const scrollToTop = () => {
    const container = findScrollContainer();
    
    if (container) {
      // Si es un elemento específico, hacer scroll en ese elemento
      container.scrollTo({
        top: 0,
        left: 0,
        behavior
      });
      
      // En Capacitor, también intentar con window.scrollTo como respaldo
      if (isCapacitor) {
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant' // Usar instant para Capacitor
          });
        }, 50);
      }
    } else {
      // Si no se encuentra contenedor específico, hacer scroll en window
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: isCapacitor ? 'instant' : behavior // Usar instant en Capacitor
      });
    }
  };

  /**
   * Función para hacer scroll con delay
   */
  const scrollToTopWithDelay = () => {
    // En Capacitor, usar un delay más largo para asegurar que el contenido se haya renderizado
    const effectiveDelay = isCapacitor ? Math.max(delay, 200) : delay;
    
    if (effectiveDelay > 0) {
      setTimeout(scrollToTop, effectiveDelay);
    } else {
      scrollToTop();
    }
  };

  // Scroll al tope cuando cambie la ruta
  useEffect(() => {
    if (!scrollOnRouteChange) return;

    // Solo hacer scroll si la ruta realmente cambió
    if (previousPathname.current !== null && previousPathname.current !== pathname) {
      scrollToTopWithDelay();
    }

    // Actualizar la ruta anterior
    previousPathname.current = pathname;
  }, [pathname, scrollOnRouteChange, delay, behavior]);

  // Scroll al tope cuando se monte el componente
  useEffect(() => {
    if (!scrollOnMount || hasScrolledOnMount.current) return;

    scrollToTopWithDelay();
    hasScrolledOnMount.current = true;
  }, [scrollOnMount, delay, behavior]);

  // Función manual para hacer scroll al tope
  const manualScrollToTop = () => {
    scrollToTop();
  };

  return {
    scrollToTop: manualScrollToTop,
    scrollToTopWithDelay: () => scrollToTopWithDelay()
  };
};
