"use client";

import { useKeyboardFocus } from "@/hooks/useKeyboardFocus";
import { useEffect } from "react";

interface KeyboardFocusWrapperProps {
  children: React.ReactNode;
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
 * Componente wrapper que maneja el foco de inputs cuando aparece el teclado
 * Se puede usar a nivel global o en formularios específicos
 */
export const KeyboardFocusWrapper: React.FC<KeyboardFocusWrapperProps> = ({
  children,
  enabled = true,
  offset = 0,
  delay = 300,
  behavior = 'smooth',
  headerSelector = 'header'
}) => {
  const { isKeyboardOpen, keyboardHeight } = useKeyboardFocus({
    enabled,
    offset,
    delay,
    behavior,
    headerSelector
  });

  // Aplicar estilos cuando el teclado está abierto
  useEffect(() => {
    if (!enabled) return;

    const body = document.body;
    
    if (isKeyboardOpen) {
      // Agregar clase para indicar que el teclado está abierto
      body.classList.add('keyboard-open');
      
      // Ajustar el padding del body para compensar el teclado
      const currentPadding = body.style.paddingBottom || '0px';
      const currentPaddingValue = parseInt(currentPadding.replace('px', '')) || 0;
      
      // Solo ajustar si no se ha ajustado ya
      if (currentPaddingValue === 0) {
        body.style.paddingBottom = `${keyboardHeight}px`;
      }
    } else {
      // Remover clase y resetear padding
      body.classList.remove('keyboard-open');
      body.style.paddingBottom = '';
    }

    // Cleanup al desmontar
    return () => {
      body.classList.remove('keyboard-open');
      body.style.paddingBottom = '';
    };
  }, [isKeyboardOpen, keyboardHeight, enabled]);

  return <>{children}</>;
};
