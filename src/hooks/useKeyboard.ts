import { Capacitor } from "@capacitor/core";
import { Keyboard, KeyboardInfo } from "@capacitor/keyboard";
import { useEffect, useState } from "react";

interface KeyboardState {
  isOpen: boolean;
  height: number;
}

export const useKeyboard = () => {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isOpen: false,
    height: 0,
  });

  useEffect(() => {
    // Solo en plataformas nativas
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleKeyboardDidShow = (info: KeyboardInfo) => {
      setKeyboardState({
        isOpen: true,
        height: info.keyboardHeight,
      });

      // Añadir clase CSS al body para ajustes globales
      document.body.classList.add("keyboard-open");

      // Ajustar el viewport height
      document.documentElement.style.setProperty(
        "--keyboard-height",
        `${info.keyboardHeight}px`
      );
    };

    const handleKeyboardDidHide = () => {
      setKeyboardState({
        isOpen: false,
        height: 0,
      });

      // Remover clase CSS del body
      document.body.classList.remove("keyboard-open");

      // Resetear el viewport height
      document.documentElement.style.removeProperty("--keyboard-height");
    };

    // Escuchar eventos del teclado
    let cleanup: (() => void) | null = null;

    const setupListeners = async () => {
      try {
        const showListener = await Keyboard.addListener(
          "keyboardDidShow",
          handleKeyboardDidShow
        );
        const hideListener = await Keyboard.addListener(
          "keyboardDidHide",
          handleKeyboardDidHide
        );

        cleanup = () => {
          showListener.remove();
          hideListener.remove();
        };
      } catch (error) {
        console.error("Error setting up keyboard listeners:", error);
      }
    };

    setupListeners();

    // Cleanup
    return () => {
      if (cleanup) {
        cleanup();
      }
      document.body.classList.remove("keyboard-open");
      document.documentElement.style.removeProperty("--keyboard-height");
    };
  }, []);

  return keyboardState;
};
