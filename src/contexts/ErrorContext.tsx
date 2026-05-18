"use client";

import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { AppError, notifyError, setErrorHandler } from "@/lib/error-service";

interface ErrorContextType {
  errors: AppError[];
  pushError: (error: AppError) => void;
  dismissError: (incidentId?: string) => void;
  clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<AppError[]>([]);

  const pushError = (error: AppError) => {
    setErrors((prev) => {
      const existing = prev.find((item) => item.incidentId === error.incidentId);
      if (existing) {
        return prev;
      }
      return [error, ...prev].slice(0, 10);
    });
  };

  const dismissError = (incidentId?: string) => {
    setErrors((prev) =>
      incidentId ? prev.filter((error) => error.incidentId !== incidentId) : []
    );
  };

  const clearErrors = () => setErrors([]);

  useEffect(() => {
    setErrorHandler(pushError);
    return () => {
      setErrorHandler(null);
    };
  }, []);

  const value = useMemo(
    () => ({
      errors,
      pushError,
      dismissError,
      clearErrors,
    }),
    [errors]
  );

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
}

export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
}

