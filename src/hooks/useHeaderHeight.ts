import { useEffect, useState } from 'react';

export const useHeaderHeight = () => {
  const [headerHeight, setHeaderHeight] = useState(80); // Valor por defecto

  useEffect(() => {
    const updateHeaderHeight = () => {
      // Buscar el header en el DOM
      const header = document.querySelector('header') || 
                   document.querySelector('[data-header]') ||
                   document.querySelector('.header');
      
      if (header) {
        const height = header.getBoundingClientRect().height;
        setHeaderHeight(height);
      }
    };

    // Actualizar al montar
    updateHeaderHeight();

    // Actualizar en resize
    window.addEventListener('resize', updateHeaderHeight);
    
    // Observer para cambios en el header
    const header = document.querySelector('header') || 
                   document.querySelector('[data-header]') ||
                   document.querySelector('.header');
    
    if (header) {
      const observer = new ResizeObserver(updateHeaderHeight);
      observer.observe(header);
      
      return () => {
        observer.disconnect();
        window.removeEventListener('resize', updateHeaderHeight);
      };
    }

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  return headerHeight;
};
