import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

interface PageNavigationOptions {
  onPageChange?: (path: string) => void;
  trackHistory?: boolean;
}

export const usePageNavigation = ({
  onPageChange,
  trackHistory = true,
}: PageNavigationOptions = {}) => {
  const router = useRouter();
  const historyRef = useRef<string[]>([]);
  const currentIndexRef = useRef(-1);
  const isNavigatingRef = useRef(false);

  // Agregar página al historial
  const addToHistory = useCallback((path: string) => {
    if (!trackHistory) return;

    // Si estamos en el medio del historial, eliminar todo lo que esté después
    if (currentIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);
    }

    // Agregar nueva página
    historyRef.current.push(path);
    currentIndexRef.current = historyRef.current.length - 1;

    // Llamar callback si existe
    if (onPageChange) {
      onPageChange(path);
    }
  }, [trackHistory, onPageChange]);

  // Navegar hacia atrás
  const goBack = useCallback(() => {
    if (isNavigatingRef.current) return false;
    
    isNavigatingRef.current = true;

    try {
      if (currentIndexRef.current > 0) {
        currentIndexRef.current--;
        const previousPath = historyRef.current[currentIndexRef.current];
        router.push(previousPath);
        return true;
      }
      return false;
    } finally {
      // Resetear flag después de un delay
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 500);
    }
  }, [router]);

  // Navegar hacia adelante
  const goForward = useCallback(() => {
    if (isNavigatingRef.current) return false;
    
    isNavigatingRef.current = true;

    try {
      if (currentIndexRef.current < historyRef.current.length - 1) {
        currentIndexRef.current++;
        const nextPath = historyRef.current[currentIndexRef.current];
        router.push(nextPath);
        return true;
      }
      return false;
    } finally {
      // Resetear flag después de un delay
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 500);
    }
  }, [router]);

  // Verificar si puede ir hacia atrás
  const canGoBack = useCallback(() => {
    return currentIndexRef.current > 0;
  }, []);

  // Verificar si puede ir hacia adelante
  const canGoForward = useCallback(() => {
    return currentIndexRef.current < historyRef.current.length - 1;
  }, []);

  // Obtener página anterior
  const getPreviousPage = useCallback(() => {
    if (currentIndexRef.current > 0) {
      return historyRef.current[currentIndexRef.current - 1];
    }
    return null;
  }, []);

  // Obtener página siguiente
  const getNextPage = useCallback(() => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      return historyRef.current[currentIndexRef.current + 1];
    }
    return null;
  }, []);

  // Limpiar historial
  const clearHistory = useCallback(() => {
    historyRef.current = [];
    currentIndexRef.current = -1;
  }, []);

  // Inicializar con la página actual
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      addToHistory(currentPath);
    }
  }, [addToHistory]);

  return {
    addToHistory,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    getPreviousPage,
    getNextPage,
    clearHistory,
    history: historyRef.current,
    currentIndex: currentIndexRef.current,
    isNavigating: isNavigatingRef.current,
  };
};
