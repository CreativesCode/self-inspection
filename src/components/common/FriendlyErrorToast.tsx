"use client";

import { useEffect, useMemo, useState } from "react";
import { useError } from "@/contexts/ErrorContext";

function centerText(value?: string) {
  return value?.trim() || "-";
}

export function FriendlyErrorToast() {
  const { errors, dismissError, clearErrors } = useError();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeError = useMemo(() => errors[0], [errors]);

  useEffect(() => {
    if (!activeError) {
      setExpandedId(null);
      setCopied(false);
    }
  }, [activeError]);

  useEffect(() => {
    if (!activeError) return;
    const timeout = setTimeout(() => {
      dismissError(activeError.incidentId);
    }, 25000);
    return () => clearTimeout(timeout);
  }, [activeError, dismissError]);

  if (!activeError) {
    return null;
  }

  const technicalDetail = [
    `code: ${activeError.code}`,
    activeError.developerMessage && `dev: ${activeError.developerMessage}`,
    activeError.detail && `detail: ${activeError.detail}`,
    activeError.path && `path: ${activeError.path}`,
    `incidentId: ${activeError.incidentId ?? "n/a"}`,
    `timestamp: ${activeError.timestamp ?? "n/a"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(technicalDetail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("No se pudo copiar el detalle técnico", error);
    }
  };

  return (
    <div
      aria-live="assertive"
      className="fixed inset-x-4 bottom-6 z-50 flex justify-center"
    >
      <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white/95 px-5 py-4 shadow-xl shadow-red-500/20 ring-1 ring-red-500/60 backdrop-blur-md dark:border-red-700 dark:bg-gray-900/90 dark:ring-red-400/70">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-600 dark:text-red-300">
              Ocurrió un error
            </p>
            <p className="mt-1 text-base font-medium text-gray-900 dark:text-gray-100">
              {centerText(activeError.userMessage)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ID: <span className="font-mono">{activeError.incidentId ?? "pendiente"}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <button
              type="button"
              onClick={() =>
                setExpandedId((current) =>
                  current === activeError.incidentId ? null : activeError.incidentId ?? null
                )
              }
              className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
            >
              {expandedId === activeError.incidentId ? "Ocultar detalles" : "Mostrar detalles"}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs font-semibold text-gray-600 transition hover:text-gray-800 dark:text-gray-300"
            >
              {copied ? "Copiado" : "Copiar detalle técnico"}
            </button>
            <button
              type="button"
              onClick={() => dismissError(activeError.incidentId)}
              className="text-xs font-semibold text-gray-500 transition hover:text-gray-700 dark:text-gray-400"
            >
              Cerrar
            </button>
          </div>
        </div>
        {expandedId === activeError.incidentId && (
          <div className="mt-4 rounded-xl bg-gray-100/80 p-3 text-xs text-gray-700 dark:bg-gray-800/80 dark:text-gray-200">
            <p className="font-semibold text-gray-800 dark:text-gray-100">
              {activeError.developerMessage ?? "Detalle técnico disponible"}
            </p>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-snug text-gray-700 dark:text-gray-200">
              {technicalDetail}
            </pre>
            <button
              type="button"
              onClick={clearErrors}
              className="mt-3 text-[11px] font-semibold text-blue-600 transition hover:text-blue-700"
            >
              Limpiar errores
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

