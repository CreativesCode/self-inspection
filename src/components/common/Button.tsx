"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Loader2 } from "lucide-react";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "danger" | "info" | "success";
  fullWidth?: boolean;
}

export function Button({
  children,
  isLoading = false,
  loadingText,
  variant = "primary",
  fullWidth = false,
  ...props
}: ButtonProps) {
  const { isDark } = useTheme();

  const getVariantClasses = () => {
    const baseClasses = fullWidth ? "w-full" : "";
    switch (variant) {
      case "primary":
        return `button-primary ${isDark ? "button-primary-dark" : "button-primary-light"} ${baseClasses}`;
      case "secondary":
        return `button-secondary ${isDark ? "button-secondary-dark" : "button-secondary-light"} ${baseClasses}`;
      case "danger":
        return `button-danger ${isDark ? "button-danger-dark" : "button-danger-light"} ${baseClasses}`;
      case "info":
        return `button-info ${isDark ? "button-info-dark" : "button-info-light"} ${baseClasses}`;
      case "success":
        return `px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 ${baseClasses}`;
      default:
        return `button-primary ${isDark ? "button-primary-dark" : "button-primary-light"} ${baseClasses}`;
    }
  };

  const displayText = loadingText || (isLoading ? "Cargando..." : children);

  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`${getVariantClasses()} disabled:opacity-50 disabled:cursor-not-allowed ${props.className || ""}`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="animate-spin h-4 w-4" />
          <span>{displayText}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
