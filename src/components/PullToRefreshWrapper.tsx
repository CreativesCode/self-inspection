import { useMobileDetection } from '@/hooks/useMobileDetection';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import React, { ReactNode } from 'react';
import { PullToRefreshIndicator } from './PullToRefreshIndicator';

interface PullToRefreshWrapperProps {
  children: ReactNode;
  onRefresh: () => void | Promise<void>;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
  className?: string;
  indicatorClassName?: string;
}

export const PullToRefreshWrapper: React.FC<PullToRefreshWrapperProps> = ({
  children,
  onRefresh,
  threshold = 80,
  resistance = 0.5,
  enabled = true,
  className = '',
  indicatorClassName = '',
}) => {
  const { shouldEnablePullToRefresh } = useMobileDetection();
  
  const {
    isRefreshing,
    isPulling,
    pullDistance,
    getContentStyles,
  } = usePullToRefresh({
    onRefresh,
    threshold,
    resistance,
    enabled: enabled && shouldEnablePullToRefresh, // Habilitar en cualquier dispositivo móvil o táctil
  });

  return (
    <div className={`relative ${className}`} data-pull-to-refresh-wrapper>
      {/* Indicador de pull-to-refresh */}
      <PullToRefreshIndicator
        isRefreshing={isRefreshing}
        isPulling={isPulling}
        pullDistance={pullDistance}
        threshold={threshold}
        className={indicatorClassName}
      />
      
      {/* Contenido principal */}
      <div
        style={getContentStyles()}
        data-scrollable
        className="transition-transform duration-200 ease-out"
      >
        {children}
      </div>
      
      {/* Overlay de loading cuando está refrescando */}
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
