"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface UseCapacitorScrollOptions {
  /**
   * Si debe hacer scroll al tope cuando cambie la ruta
   */
  scrollOnRouteChange?: boolean;
  /**
   * Si debe hacer scroll al tope cuando se monte el componente
   */
  scrollOnMount?: boolean;
  /**
   * Delay en ms antes de hacer scroll
   */
  delay?: number;
  /**
   * Rutas que deben ser excluidas del scroll automático
   */
  excludePaths?: string[];
}

/**
 * Hook específico para manejar el scroll en Capacitor
 * Usa múltiples estrategias para asegurar que el scroll funcione correctamente
 */
export const useCapacitorScroll = ({
  scrollOnRouteChange = true,
  scrollOnMount = true,
  delay = 300,
  excludePaths = []
}: UseCapacitorScrollOptions = {}) => {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);
  const hasScrolledOnMount = useRef(false);
  const scrollAttempts = useRef(0);

  /**
   * Función para hacer scroll al tope usando múltiples estrategias
   */
  const scrollToTop = () => {
    scrollAttempts.current = 0;
    
    const performScroll = () => {
      scrollAttempts.current++;
      
      // Estrategia 1: window.scrollTo
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
      
      // Estrategia 2: document.documentElement.scrollTop
      document.documentElement.scrollTop = 0;
      
      // Estrategia 3: document.body.scrollTop
      document.body.scrollTop = 0;
      
      // Estrategia 4: Usar scrollIntoView en el primer elemento
      const firstElement = document.querySelector('main, body > div, body > *');
      if (firstElement) {
        firstElement.scrollIntoView({
          behavior: 'instant',
          block: 'start'
        });
      }
      
      // Si no hemos hecho suficientes intentos, intentar de nuevo
      if (scrollAttempts.current < 3) {
        setTimeout(performScroll, 100);
      }
    };
    
    performScroll();
  };

  /**
   * Función para hacer scroll con delay
   */
  const scrollToTopWithDelay = () => {
    setTimeout(scrollToTop, delay);
    
    // Hacer múltiples intentos en Capacitor
    setTimeout(scrollToTop, delay + 200);
    setTimeout(scrollToTop, delay + 400);
  };

  // Scroll al tope cuando cambie la ruta
  useEffect(() => {
    if (!scrollOnRouteChange) return;

    // Solo hacer scroll si la ruta realmente cambió
    if (previousPathname.current !== null && previousPathname.current !== pathname) {
      // Verificar si la ruta actual debe ser excluida
      const shouldExclude = excludePaths.some(path => 
        pathname.startsWith(path) || pathname === path
      );
      
      if (!shouldExclude) {
        scrollToTopWithDelay();
      }
    }

    // Actualizar la ruta anterior
    previousPathname.current = pathname;
  }, [pathname, scrollOnRouteChange, excludePaths, delay]);

  // Scroll al tope cuando se monte el componente
  useEffect(() => {
    if (!scrollOnMount || hasScrolledOnMount.current) return;

    // Verificar si la ruta actual debe ser excluida
    const shouldExclude = excludePaths.some(path => 
      pathname.startsWith(path) || pathname === path
    );
    
    if (!shouldExclude) {
      scrollToTopWithDelay();
      hasScrolledOnMount.current = true;
    }
  }, [scrollOnMount, pathname, excludePaths, delay]);

  // Función manual para hacer scroll al tope
  const manualScrollToTop = () => {
    scrollToTop();
  };

  return {
    scrollToTop: manualScrollToTop,
    scrollToTopWithDelay: () => scrollToTopWithDelay()
  };
};
