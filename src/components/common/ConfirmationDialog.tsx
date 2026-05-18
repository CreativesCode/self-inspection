"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDark: boolean;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDark,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  isLoading = false,
}) => {
  // Portal a <body> para escapar ancestros con `transform`/`backdrop-filter`
  // (p. ej. HeaderBar lleva `backdrop-blur-xl`), que crean un containing block
  // para `position: fixed` y harían que el modal se "encajone" dentro del header.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const dialog = (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black bg-opacity-50">
      <div
        className={`rounded-lg shadow-xl p-6 w-full max-w-md ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h3
          className={`text-lg font-medium mb-4 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </h3>
        <p
          className={`text-sm mb-6 ${
            isDark ? "text-gray-300" : "text-gray-600"
          }`}
        >
          {message}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
              isDark
                ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
              isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-red-700"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Eliminando...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
};

export default ConfirmationDialog;
