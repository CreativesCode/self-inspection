import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface NavigationHistoryItem {
  path: string;
  timestamp: number;
}

export const useNavigationHistory = () => {
  const router = useRouter();
  const historyRef = useRef<NavigationHistoryItem[]>([]);
  const currentIndexRef = useRef(-1);

  // Agregar página al historial
  const addToHistory = (path: string) => {
    const now = Date.now();
    const newItem: NavigationHistoryItem = { path, timestamp: now };
    
    // Si estamos en el medio del historial, eliminar todo lo que esté después
    if (currentIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);
    }
    
    // Agregar nueva página
    historyRef.current.push(newItem);
    currentIndexRef.current = historyRef.current.length - 1;
  };

  // Navegar hacia atrás
  const goBack = () => {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current--;
      const previousPath = historyRef.current[currentIndexRef.current];
      router.push(previousPath.path);
      return true; // Navegación exitosa
    }
    return false; // No hay páginas anteriores
  };

  // Verificar si hay páginas anteriores
  const canGoBack = () => {
    return currentIndexRef.current > 0;
  };

  // Obtener la página anterior
  const getPreviousPage = () => {
    if (currentIndexRef.current > 0) {
      return historyRef.current[currentIndexRef.current - 1];
    }
    return null;
  };

  // Limpiar historial
  const clearHistory = () => {
    historyRef.current = [];
    currentIndexRef.current = -1;
  };

  // Inicializar con la página actual
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      addToHistory(currentPath);
    }
  }, []);

  return {
    addToHistory,
    goBack,
    canGoBack,
    getPreviousPage,
    clearHistory,
    history: historyRef.current,
    currentIndex: currentIndexRef.current,
  };
};
