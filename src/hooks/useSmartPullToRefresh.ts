import { useEffect } from 'react';
import { useMobileDetection } from './useMobileDetection';
import { usePullToRefresh } from './usePullToRefresh';

interface UseSmartPullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
  // Nueva opción: deshabilitar si la página ya tiene su propio pull-to-refresh
  disableIfPageHasOwnRefresh?: boolean;
}

export const useSmartPullToRefresh = ({
  onRefresh,
  threshold = 80,
  resistance = 0.5,
  enabled = true,
  disableIfPageHasOwnRefresh = true,
}: UseSmartPullToRefreshOptions) => {
  const { shouldEnablePullToRefresh } = useMobileDetection();

  // Detectar si la página ya tiene su propio PullToRefreshWrapper
  useEffect(() => {
    if (disableIfPageHasOwnRefresh) {
      const existingWrapper = document.querySelector('[data-pull-to-refresh-wrapper]');
      if (existingWrapper) {
        // Si ya existe un wrapper, deshabilitar este
        return;
      }
    }
  }, [disableIfPageHasOwnRefresh]);

  const shouldEnable = enabled && shouldEnablePullToRefresh && 
    (!disableIfPageHasOwnRefresh || !document.querySelector('[data-pull-to-refresh-wrapper]'));

  return usePullToRefresh({
    onRefresh,
    threshold,
    resistance,
    enabled: shouldEnable,
  });
};
