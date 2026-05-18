import { RefreshCw } from 'lucide-react';
import React from 'react';

interface PullToRefreshIndicatorProps {
  isRefreshing: boolean;
  isPulling: boolean;
  pullDistance: number;
  threshold: number;
  className?: string;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  isRefreshing,
  isPulling,
  pullDistance,
  threshold,
  className = '',
}) => {
  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;

  return (
    <div
      className={`fixed top-0 left-1/2 transform -translate-x-1/2 -translate-y-full transition-all duration-200 ease-out z-50 ${className}`}
      style={{
        transform: `translateX(-50%) translateY(${Math.min(pullDistance - 20, threshold - 20)}px)`,
        opacity: isPulling || isRefreshing ? 1 : 0,
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg border border-gray-200 dark:border-gray-700">
        <RefreshCw
          className={`w-6 h-6 text-blue-500 transition-transform duration-200 ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          style={{
            transform: isRefreshing ? 'rotate(0deg)' : `rotate(${rotation}deg)`,
          }}
        />
      </div>
      
      {/* Indicador de progreso */}
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-200 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
};
