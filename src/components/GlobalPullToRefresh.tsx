import { useMobileDetection } from '@/hooks/useMobileDetection';
import { useSmartPullToRefresh } from '@/hooks/useSmartPullToRefresh';
import React, { ReactNode } from 'react';
import { PullToRefreshIndicator } from './PullToRefreshIndicator';

interface CapacitorWindow extends Window {
  Capacitor?: {
    App?: {
      reload: () => Promise<void>;
    };
  };
}

interface GlobalPullToRefreshProps {
  children: ReactNode;
  className?: string;
}

export const GlobalPullToRefresh: React.FC<GlobalPullToRefreshProps> = ({
  children,
  className = '',
}) => {
  const { shouldEnablePullToRefresh, isCapacitor } = useMobileDetection();
  
  // Función de refresh global que funciona en todas las páginas
  const handleGlobalRefresh = async () => {
    try {
      // Intentar refrescar la página actual
      if (typeof window !== 'undefined') {
        // Si estamos en Capacitor, usar el método nativo
        const capacitorApp = (window as CapacitorWindow).Capacitor?.App;
        if (isCapacitor && capacitorApp) {
          await capacitorApp.reload();
        } else {
          // En navegador web, recargar la página
          window.location.reload();
        }
      }
    } catch (error) {
      // Error silencioso en producción
      if (process.env.NODE_ENV === 'development') {
        console.error('Error al refrescar:', error);
      }
      // Fallback a recargar la página
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  const {
    isRefreshing,
    isPulling,
    pullDistance,
    getContentStyles,
  } = useSmartPullToRefresh({
    onRefresh: handleGlobalRefresh,
    threshold: 80,
    resistance: 0.5,
    enabled: shouldEnablePullToRefresh,
    disableIfPageHasOwnRefresh: true, // Deshabilitar si la página ya tiene su propio pull-to-refresh
  });

  return (
    <div className={`relative ${className}`}>
      {/* Indicador de pull-to-refresh global */}
      <PullToRefreshIndicator
        isRefreshing={isRefreshing}
        isPulling={isPulling}
        pullDistance={pullDistance}
        threshold={80}
        className="z-50"
      />
      
      {/* Contenido principal */}
      <div
        style={getContentStyles()}
        data-scrollable
        className="transition-transform duration-200 ease-out"
      >
        {children}
      </div>
      
      {/* Overlay de loading global */}
      {isRefreshing && (
        <div className="fixed inset-0 bg-black bg-opacity-20 z-40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-700 dark:text-gray-300">Actualizando...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
