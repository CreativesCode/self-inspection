"use client";

import { useEffect, useRef, useState } from 'react';

interface UseKeyboardFocusOptions {
  /**
   * Si debe habilitar el manejo automático del foco
   */
  enabled?: boolean;
  /**
   * Offset adicional para el scroll (en píxeles)
   */
  offset?: number;
  /**
   * Delay antes de hacer scroll al elemento enfocado
   */
  delay?: number;
  /**
   * Comportamiento del scroll
   */
  behavior?: ScrollBehavior;
  /**
   * Selector del header para calcular el offset
   */
  headerSelector?: string;
}

/**
 * Hook para manejar el foco de inputs cuando aparece el teclado en dispositivos móviles
 * Hace scroll automático al input enfocado para que no quede oculto detrás del header
 */
export const useKeyboardFocus = ({
  enabled = true,
  offset = 0,
  delay = 300,
  behavior = 'smooth',
  headerSelector = 'header'
}: UseKeyboardFocusOptions = {}) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const initialViewportHeight = useRef<number>(0);

  // Detectar si el teclado está abierto
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      
      // Si no tenemos la altura inicial, guardarla
      if (initialViewportHeight.current === 0) {
        initialViewportHeight.current = currentHeight;
        return;
      }

      // Calcular la diferencia de altura
      const heightDifference = initialViewportHeight.current - currentHeight;
      
      // Si la diferencia es significativa (más de 150px), consideramos que el teclado está abierto
      if (heightDifference > 150) {
        setIsKeyboardOpen(true);
        setKeyboardHeight(heightDifference);
      } else {
        setIsKeyboardOpen(false);
        setKeyboardHeight(0);
      }
    };

    // También detectar cuando el viewport cambia
    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        const heightDifference = initialViewportHeight.current - window.visualViewport.height;
        
        if (heightDifference > 150) {
          setIsKeyboardOpen(true);
          setKeyboardHeight(heightDifference);
        } else {
          setIsKeyboardOpen(false);
          setKeyboardHeight(0);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Usar Visual Viewport API si está disponible (mejor para móviles)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, [enabled]);

  // Manejar el foco en inputs
  useEffect(() => {
    if (!enabled || !isKeyboardOpen) return;

    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      
      // Solo manejar inputs, textareas y elementos editables
      if (
        target &&
        (target.tagName === 'INPUT' || 
         target.tagName === 'TEXTAREA' || 
         target.contentEditable === 'true')
      ) {
        lastFocusedElement.current = target;
        
        // Hacer scroll al elemento enfocado con delay
        setTimeout(() => {
          scrollToFocusedElement(target);
        }, delay);
      }
    };

    const handleBlur = () => {
      lastFocusedElement.current = null;
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, [enabled, isKeyboardOpen, delay, offset, behavior, headerSelector]);

  /**
   * Función para hacer scroll al elemento enfocado
   */
  const scrollToFocusedElement = (element: HTMLElement) => {
    if (!element) return;

    // Obtener el header para calcular el offset
    const header = document.querySelector(headerSelector) as HTMLElement;
    const headerHeight = header ? header.offsetHeight : 0;
    
    // Calcular la posición del elemento
    const elementRect = element.getBoundingClientRect();
    const elementTop = elementRect.top + window.scrollY;
    
    // Calcular la posición objetivo (elemento - header - offset adicional)
    const targetPosition = elementTop - headerHeight - offset - 20; // 20px de margen adicional
    
    // Hacer scroll suave a la posición calculada
    window.scrollTo({
      top: Math.max(0, targetPosition),
      behavior
    });
  };

  /**
   * Función manual para hacer scroll al último elemento enfocado
   */
  const scrollToLastFocused = () => {
    if (lastFocusedElement.current) {
      scrollToFocusedElement(lastFocusedElement.current);
    }
  };

  /**
   * Función para hacer scroll a un elemento específico
   */
  const scrollToElement = (element: HTMLElement) => {
    scrollToFocusedElement(element);
  };

  return {
    isKeyboardOpen,
    keyboardHeight,
    scrollToLastFocused,
    scrollToElement
  };
};
