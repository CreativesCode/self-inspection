"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";
import React, { useEffect, useRef } from "react";

export type AlertType = "success" | "error" | "warning" | "info";

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: AlertType;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  autoClose = false,
  autoCloseDelay = 3000,
}) => {
  const { isDark } = useTheme();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Manejar clic fuera del diálogo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Manejar tecla Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Auto cerrar si está habilitado
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
        );
      case "error":
        return <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />;
      case "warning":
        return (
          <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
        );
      case "info":
      default:
        return <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getIconBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-100 dark:bg-green-900";
      case "error":
        return "bg-red-100 dark:bg-red-900";
      case "warning":
        return "bg-yellow-100 dark:bg-yellow-900";
      case "info":
      default:
        return "bg-blue-100 dark:bg-blue-900";
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case "success":
        return "bg-green-600 hover:bg-green-700 text-white";
      case "error":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 text-white";
      case "info":
      default:
        return "bg-blue-600 hover:bg-blue-700 text-white";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={dialogRef}
        className={`relative w-full max-w-md mx-4 p-6 rounded-lg shadow-lg ${
          isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 p-1 rounded-full ${
            isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
          }`}
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <div
            className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${getIconBgColor()} mb-4`}
          >
            {getIcon()}
          </div>

          <h3 className="text-lg font-medium mb-2">{title}</h3>

          <p
            className={`text-sm mb-6 ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {message}
          </p>

          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-md text-sm font-medium ${getButtonColor()}`}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;
