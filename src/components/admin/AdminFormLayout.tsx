"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";

type AdminFormLayoutProps = {
  mode: "create" | "edit";
  breadcrumb: string;
  breadcrumbHref: string;
  title: string;
  subtitle?: string;
  primaryLabel?: string;
  loading?: boolean;
  error?: string | null;
  success?: string | null;
  onSubmit: (e: FormEvent) => void;
  cancelHref?: string;
  sidebar?: ReactNode;
  children: ReactNode;
};

/**
 * AdminFormLayout — wrapper para todos los create/edit del admin.
 * Header con breadcrumb + título + acciones, contenido en dos columnas (form
 * principal + sidebar opcional) y banners de error/success inline.
 */
export function AdminFormLayout({
  mode,
  breadcrumb,
  breadcrumbHref,
  title,
  subtitle,
  primaryLabel,
  loading = false,
  error,
  success,
  onSubmit,
  cancelHref,
  sidebar,
  children,
}: AdminFormLayoutProps) {
  const router = useRouter();
  const handleCancel = () => router.push(cancelHref ?? breadcrumbHref);

  return (
    <form
      onSubmit={onSubmit}
      className="bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink"
    >
      <div className="mx-auto max-w-[1200px] px-3 pb-16 pt-5 sm:px-8 sm:pt-8">
        <button
          type="button"
          onClick={() => router.push(breadcrumbHref)}
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:text-ink dark:text-dark-ink-2 dark:hover:text-dark-ink"
        >
          <ArrowLeft size={13} />
          <span>{breadcrumb}</span>
          <span className="mx-1 text-ink-3">·</span>
          <span className="font-semibold text-ink dark:text-dark-ink">
            {mode === "create" ? "Nuevo" : "Editar"}
          </span>
        </button>

        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
              {mode === "create" ? "Crear" : "Editar"}
            </div>
            <h1 className="m-0 mt-1.5 text-3xl font-extrabold tracking-tighter sm:text-[34px]">
              {title}
            </h1>
            {subtitle && (
              <p className="m-0 mt-1.5 text-sm text-ink-2 dark:text-dark-ink-2">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              icon={
                loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )
              }
            >
              {loading
                ? mode === "create"
                  ? "Creando…"
                  : "Guardando…"
                : primaryLabel ?? (mode === "create" ? "Crear" : "Guardar")}
            </Button>
          </div>
        </header>

        {success && (
          <div
            className={cn(
              "mb-5 flex items-start gap-3 rounded-[14px] border p-4",
              "border-[rgba(47,158,106,0.32)] bg-[rgba(47,158,106,0.06)]",
            )}
          >
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0 text-[#2F9E6A]"
            />
            <div className="text-sm font-medium text-[#2F9E6A]">{success}</div>
          </div>
        )}

        {error && (
          <div
            className={cn(
              "mb-5 flex items-start gap-3 rounded-[14px] border p-4",
              "border-[rgba(var(--accent-rgb),0.32)] bg-[rgba(var(--accent-rgb),0.06)]",
            )}
          >
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-primary-600"
            />
            <div className="text-sm font-medium text-primary-700">{error}</div>
          </div>
        )}

        <div
          className={cn(
            "grid gap-5",
            sidebar && "lg:grid-cols-[1.6fr_1fr]",
          )}
        >
          <div className="flex flex-col gap-5">{children}</div>
          {sidebar && (
            <div className="flex flex-col gap-5 self-start lg:sticky lg:top-4">
              {sidebar}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
