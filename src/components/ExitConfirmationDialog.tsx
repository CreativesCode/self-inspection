import { useTheme } from '@/contexts/ThemeContext';
import { X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

interface ExitConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ExitConfirmationDialog: React.FC<ExitConfirmationDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const { isDark } = useTheme();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Manejar clic fuera del diálogo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onCancel]);

  // Manejar tecla Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={dialogRef}
        className={`relative w-full max-w-md mx-4 p-6 rounded-lg shadow-lg ${
          isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        <button
          onClick={onCancel}
          className={`absolute top-3 right-3 p-1 rounded-full ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-medium mb-2">
            Salir de la aplicación
          </h3>
          
          <p className={`text-sm mb-6 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            ¿Estás seguro de que quieres salir de la aplicación? 
            Se perderá cualquier trabajo no guardado.
          </p>

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
                isDark
                  ? 'bg-gray-600 hover:bg-gray-700 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              Cancelar
            </button>
            
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
