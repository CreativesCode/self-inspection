import { useEffect, useState } from 'react';

interface CapacitorWindow extends Window {
  Capacitor?: unknown;
  opera?: unknown;
  DocumentTouch?: new () => Document;
}

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isCapacitor, setIsCapacitor] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detectar si estamos en Capacitor
    const checkCapacitor = () => {
      return !!(window as CapacitorWindow).Capacitor;
    };

    // Detectar si estamos en un dispositivo móvil
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as CapacitorWindow).opera || '';

      // Detectar dispositivos móviles
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const isMobileDevice = mobileRegex.test(String(userAgent));

      // Detectar por tamaño de pantalla
      const isSmallScreen = window.innerWidth <= 768;

      return isMobileDevice || isSmallScreen;
    };

    // Detectar si es un dispositivo táctil
    const checkTouchDevice = () => {
      return 'ontouchstart' in window ||
             navigator.maxTouchPoints > 0 ||
             !!(window as CapacitorWindow).DocumentTouch && document instanceof (window as CapacitorWindow).DocumentTouch!;
    };

    setIsCapacitor(checkCapacitor());
    setIsMobile(checkMobile());
    setIsTouchDevice(checkTouchDevice());

    // Escuchar cambios en el tamaño de la ventana
    const handleResize = () => {
      setIsMobile(checkMobile());
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return {
    isMobile,
    isCapacitor,
    isTouchDevice,
    isMobileApp: isCapacitor && isMobile,
    // Nueva lógica: activar en cualquier dispositivo móvil o táctil
    shouldEnablePullToRefresh: isMobile || isTouchDevice,
  };
};
