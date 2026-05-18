import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { usePageNavigation } from './usePageNavigation';

interface CapacitorWindow extends Window {
  Capacitor?: {
    App?: {
      showAlert: (options: {
        title: string;
        message: string;
        buttonTitle: string;
        cancelButtonTitle: string;
      }) => Promise<{ value: boolean }>;
      exitApp: () => void;
      addListener: (event: string, callback: () => void) => void;
      removeAllListeners: () => void;
    };
  };
}

interface UseBackButtonNavigationOptions {
  enabled?: boolean;
  onExitConfirm?: () => void;
  homePath?: string;
}

export const useBackButtonNavigation = ({
  enabled = true,
  onExitConfirm,
  homePath = '/',
}: UseBackButtonNavigationOptions) => {
  const router = useRouter();
  const { goBack, addToHistory } = usePageNavigation();
  const isNavigatingRef = useRef(false);

  // Agregar página actual al historial cuando cambie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      addToHistory(currentPath);
    }
  }, [addToHistory]);

  useEffect(() => {
    if (!enabled) return;

    // Función para manejar el botón atrás
    const handleBackButton = async () => {
      // Prevenir múltiples llamadas
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      try {
        // Verificar si estamos en Capacitor
        const capacitorApp = (window as CapacitorWindow).Capacitor?.App;
        if (typeof window !== 'undefined' && capacitorApp) {
          // Obtener la URL actual
          const currentPath = window.location.pathname;
          
          // Si estamos en el home, preguntar si quiere salir
          if (currentPath === homePath || currentPath === '/') {
            // Mostrar confirmación nativa
            const result = await capacitorApp.showAlert({
              title: 'Salir de la aplicación',
              message: '¿Estás seguro de que quieres salir de la aplicación?',
              buttonTitle: 'Salir',
              cancelButtonTitle: 'Cancelar',
            });

            if (result.value) {
              // Usuario confirmó salir
              if (onExitConfirm) {
                onExitConfirm();
              } else {
                // Salir de la app
                capacitorApp.exitApp();
              }
            }
          } else {
            // Intentar navegar hacia atrás usando el historial
            const navigated = goBack();
            
            if (!navigated) {
              // Si no hay historial, ir al home
              router.push(homePath);
            }
          }
        } else {
          // Si no estamos en Capacitor, usar navegación normal del navegador
          const navigated = goBack();
          
          if (!navigated) {
            // Si no hay historial, ir al home
            router.push(homePath);
          }
        }
      } catch (error) {
        // Fallback: navegación normal
        router.back();
      } finally {
        // Resetear el flag después de un delay
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 1000);
      }
    };

    // Agregar listener para el botón atrás de Capacitor
    const capacitorApp = (window as CapacitorWindow).Capacitor?.App;
    if (typeof window !== 'undefined' && capacitorApp) {
      capacitorApp.addListener('backButton', handleBackButton);
      
      return () => {
        capacitorApp.removeAllListeners();
      };
    }

    // Fallback para navegador web (usar popstate)
    const handlePopState = () => {
      // En navegador web, el comportamiento por defecto es suficiente
      // Pero podemos personalizarlo si es necesario
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enabled, router, homePath, onExitConfirm, goBack]);
};
