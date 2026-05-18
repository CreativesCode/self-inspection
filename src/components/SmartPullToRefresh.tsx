import { useHeaderHeight } from '@/hooks/useHeaderHeight';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import React, { ReactNode, useRef } from 'react';
import { PullToRefreshIndicator } from './PullToRefreshIndicator';

interface SmartPullToRefreshProps {
  children: ReactNode;
  onRefresh: () => void | Promise<void>;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
  className?: string;
  contentClassName?: string;
  indicatorClassName?: string;
  // Nueva prop para especificar el selector del contenedor scrolleable
  scrollableSelector?: string;
}

export const SmartPullToRefresh: React.FC<SmartPullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 80,
  resistance = 0.5,
  enabled = true,
  className = '',
  contentClassName = '',
  indicatorClassName = '',
}) => {
  const { shouldEnablePullToRefresh } = useMobileDetection();
  const headerHeight = useHeaderHeight();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    isRefreshing,
    isPulling,
    pullDistance,
    getContentStyles,
  } = usePullToRefresh({
    onRefresh,
    threshold,
    resistance,
    enabled: enabled && shouldEnablePullToRefresh,
  });

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`} 
      data-pull-to-refresh-wrapper
    >
      {/* Indicador de pull-to-refresh */}
      <PullToRefreshIndicator
        isRefreshing={isRefreshing}
        isPulling={isPulling}
        pullDistance={pullDistance}
        threshold={threshold}
        className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full z-50 ${indicatorClassName}`}
      />
      
      {/* Contenido principal con scroll */}
      <div
        style={{
          ...getContentStyles(),
          paddingTop: `${headerHeight}px`,
        }}
        data-scroll-container
        className={`transition-transform duration-200 ease-out ${contentClassName}`}
      >
        {children}
      </div>
      
      {/* Overlay de loading cuando está refrescando */}
      {isRefreshing && (
        <div className="absolute inset-0 bg-black bg-opacity-20 z-40 flex items-center justify-center">
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
