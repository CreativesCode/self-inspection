import { useEffect, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  threshold?: number; // Distancia mínima para activar el refresh (en píxeles)
  resistance?: number; // Resistencia del scroll (0-1, donde 1 es sin resistencia)
  enabled?: boolean; // Si el pull-to-refresh está habilitado
}

interface PullToRefreshState {
  isRefreshing: boolean;
  pullDistance: number;
  isPulling: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  resistance = 0.5,
  enabled = true,
}: UsePullToRefreshOptions) => {
  const [state, setState] = useState<PullToRefreshState>({
    isRefreshing: false,
    pullDistance: 0,
    isPulling: false,
  });

  const startY = useRef(0);
  const currentY = useRef(0);
  const isAtTop = useRef(false);
  const containerRef = useRef<HTMLElement | null>(null);

  // Función para verificar si el scroll está en la parte superior
  const checkIfAtTop = (element: HTMLElement): boolean => {
    return element.scrollTop <= 0;
  };

  useEffect(() => {
    if (!enabled) return;

  // Función para encontrar el contenedor scrolleable correcto
  const findScrollableContainer = (target: HTMLElement): HTMLElement => {
    // Buscar contenedores específicos en orden de prioridad
    const scrollContainers = [
      '[data-scroll-container]',
      '[data-scrollable]', 
      '.overflow-auto',
      '.overflow-y-auto',
      '.overflow-scroll',
      '.overflow-y-scroll'
    ];

    for (const selector of scrollContainers) {
      const container = target.closest(selector) as HTMLElement;
      if (container) {
        return container;
      }
    }

    // Como último recurso, usar el body
    return document.body;
  };

  // Función para manejar el inicio del touch
  const handleTouchStart = (e: TouchEvent) => {
    if (!enabled || state.isRefreshing) return;

    const target = e.target as HTMLElement;
    const scrollableElement = findScrollableContainer(target);

    containerRef.current = scrollableElement;
    isAtTop.current = checkIfAtTop(scrollableElement);

    if (isAtTop.current) {
      startY.current = e.touches[0].clientY;
      currentY.current = e.touches[0].clientY;
    }
  };

    // Función para manejar el movimiento del touch
    const handleTouchMove = (e: TouchEvent) => {
      if (!enabled || state.isRefreshing || !isAtTop.current) return;

      currentY.current = e.touches[0].clientY;
      const pullDistance = Math.max(0, currentY.current - startY.current);
      
      // Aplicar resistencia
      const resistedDistance = pullDistance * resistance;

      setState(prev => ({
        ...prev,
        pullDistance: resistedDistance,
        isPulling: resistedDistance > 0,
      }));

      // Si se está haciendo pull hacia abajo, prevenir el scroll por defecto
      if (resistedDistance > 0) {
        e.preventDefault();
      }
    };

    // Función para manejar el final del touch
    const handleTouchEnd = async () => {
      if (!enabled || state.isRefreshing || !isAtTop.current) return;

      if (state.pullDistance >= threshold) {
        setState(prev => ({
          ...prev,
          isRefreshing: true,
          isPulling: false,
        }));

        try {
          await onRefresh();
        } catch (error) {
          // Error silencioso en producción
          if (process.env.NODE_ENV === 'development') {
            console.error('Error during refresh:', error);
          }
        } finally {
          setState(prev => ({
            ...prev,
            isRefreshing: false,
            pullDistance: 0,
          }));
        }
      } else {
        setState(prev => ({
          ...prev,
          pullDistance: 0,
          isPulling: false,
        }));
      }
    };

    // Función para manejar el scroll y verificar si está en el top
    const handleScroll = () => {
      if (!containerRef.current) return;
      isAtTop.current = checkIfAtTop(containerRef.current);
    };

    // Agregar event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, state.isRefreshing, state.pullDistance, threshold, resistance, onRefresh]);

  return {
    ...state,
    // Función para obtener los estilos del indicador de refresh
    getRefreshIndicatorStyles: () => ({
      transform: `translateY(${Math.min(state.pullDistance, threshold)}px)`,
      opacity: state.isPulling ? Math.min(state.pullDistance / threshold, 1) : 0,
    }),
    // Función para obtener los estilos del contenido
    getContentStyles: () => ({
      transform: `translateY(${Math.min(state.pullDistance, threshold)}px)`,
    }),
  };
};