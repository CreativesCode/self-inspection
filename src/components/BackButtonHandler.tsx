import { useBackButtonNavigation } from '@/hooks/useBackButtonNavigation';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import React, { ReactNode, useState } from 'react';
import { ExitConfirmationDialog } from './ExitConfirmationDialog';

interface CapacitorWindow extends Window {
  Capacitor?: {
    App?: {
      exitApp: () => void;
    };
  };
}

interface BackButtonHandlerProps {
  children: ReactNode;
  homePath?: string;
  onExitConfirm?: () => void;
}

export const BackButtonHandler: React.FC<BackButtonHandlerProps> = ({
  children,
  homePath = '/',
  onExitConfirm,
}) => {
  const { isCapacitor } = useMobileDetection();
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Función personalizada para confirmar salida
  const handleExitConfirm = () => {
    if (onExitConfirm) {
      onExitConfirm();
    } else {
      // Mostrar diálogo personalizado
      setShowExitDialog(true);
    }
  };

  // Función para confirmar salida del diálogo
  const handleConfirmExit = () => {
    setShowExitDialog(false);
    
    // En Capacitor, cerrar la app
    const capacitorApp = (window as CapacitorWindow).Capacitor?.App;
    if (isCapacitor && capacitorApp) {
      capacitorApp.exitApp();
    } else {
      // En navegador, cerrar la ventana
      window.close();
    }
  };

  // Función para cancelar salida
  const handleCancelExit = () => {
    setShowExitDialog(false);
  };

  // Solo habilitar en Capacitor
  useBackButtonNavigation({
    enabled: isCapacitor,
    homePath,
    onExitConfirm: handleExitConfirm,
  });

  return (
    <>
      {children}
      <ExitConfirmationDialog
        isOpen={showExitDialog}
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
      />
    </>
  );
};
