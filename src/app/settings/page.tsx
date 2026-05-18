"use client";

import { Card } from "@/components/ui/Card";
import { SectionHead } from "@/components/ui/SectionHead";
import { useAccent } from "@/contexts/AccentContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ACCENT_LIST } from "@/lib/accent-palettes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";
import { Check, Loader2, Palette, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type ThemeKey = "light" | "dark" | "system";

const THEME_OPTIONS: Array<{
  key: ThemeKey;
  label: string;
  description: string;
}> = [
  { key: "light", label: "Claro", description: "Tema base con fondo cálido." },
  { key: "dark", label: "Oscuro", description: "Reduce la fatiga visual." },
  { key: "system", label: "Sistema", description: "Se ajusta a tu dispositivo." },
];

export default function SettingsPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-2 dark:text-dark-ink-2">
        <Loader2 size={18} className="mr-2 animate-spin" /> Cargando…
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      <div className="mx-auto max-w-[760px] px-3 pb-16 pt-5 sm:px-8 sm:pt-8">
        <header className="mb-5">
          <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
            Preferencias
          </div>
          <h1 className="m-0 mt-1.5 text-3xl font-extrabold tracking-tighter sm:text-[34px]">
            Configuración
          </h1>
          <p className="m-0 mt-1.5 text-sm text-ink-2 dark:text-dark-ink-2">
            Apariencia, tema y color de acento de la aplicación.
          </p>
        </header>

        <div className="grid gap-5">
          <AppearanceCard />
          <AccentCard />
        </div>
      </div>
    </div>
  );
}

function AppearanceCard() {
  const { theme, setTheme } = useTheme();

  return (
    <Card radius={20}>
      <SectionHead
        title="Tema"
        subtitle="Se aplica al instante y se guarda en tu navegador."
        icon={<Sparkles size={16} />}
      />
      <div className="mt-4 grid gap-3.5 sm:grid-cols-3">
        {THEME_OPTIONS.map((t) => {
          const isActive = theme === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTheme(t.key)}
              className={cn(
                "rounded-[16px] p-3.5 text-left transition-all",
                isActive
                  ? "border-2 border-primary-500 bg-[rgba(var(--accent-rgb),0.06)]"
                  : "border border-hairline bg-bg-2 dark:border-hairline-dark dark:bg-white/[0.03]",
              )}
            >
              <ThemePreview kind={t.key} />
              <div className="mt-2.5 flex items-center justify-between">
                <span
                  className={cn(
                    "text-[13px] font-bold",
                    isActive ? "text-primary-600" : "",
                  )}
                >
                  {t.label}
                </span>
                {isActive && <Check size={14} className="text-primary-600" />}
              </div>
              <div className="mt-0.5 text-[11px] text-ink-2 dark:text-dark-ink-2">
                {t.description}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function ThemePreview({ kind }: { kind: ThemeKey }) {
  if (kind === "system") {
    return (
      <div className="flex h-[100px] overflow-hidden rounded-[10px] border border-hairline dark:border-hairline-dark">
        <div className="flex-1 bg-[#FAF7F4] p-2.5">
          <div className="mb-1.5 h-2 w-[70%] rounded-full bg-[rgba(27,22,20,0.10)]" />
          <div
            className="mt-2 h-4 w-4 rounded-md"
            style={{ background: "var(--accent-500)" }}
          />
        </div>
        <div className="flex-1 bg-[#15110F] p-2.5">
          <div className="mb-1.5 h-2 w-[70%] rounded-full bg-white/10" />
          <div
            className="mt-2 h-4 w-4 rounded-md"
            style={{ background: "var(--accent-300)" }}
          />
        </div>
      </div>
    );
  }
  const isDark = kind === "dark";
  return (
    <div
      className={cn(
        "flex h-[100px] overflow-hidden rounded-[10px] border",
        isDark
          ? "border-white/10 bg-[#15110F]"
          : "border-[rgba(27,22,20,0.10)] bg-[#FAF7F4]",
      )}
    >
      <div className="flex-1 p-2.5">
        <div
          className={cn(
            "mb-1.5 h-2 w-[60%] rounded-full",
            isDark ? "bg-white/10" : "bg-[rgba(27,22,20,0.10)]",
          )}
        />
        <div
          className={cn(
            "mb-3 h-1.5 w-[40%] rounded-full",
            isDark ? "bg-white/10" : "bg-[rgba(27,22,20,0.10)]",
          )}
        />
        <div className="flex gap-1.5">
          <div
            className={cn(
              "h-7 w-14 rounded-md border",
              isDark
                ? "border-white/10 bg-[#241D1A]"
                : "border-[rgba(27,22,20,0.10)] bg-white",
            )}
          />
          <div
            className="h-7 w-14 rounded-md"
            style={{ background: "var(--accent-500)" }}
          />
        </div>
      </div>
    </div>
  );
}

function AccentCard() {
  const { accent, setAccent } = useAccent();

  return (
    <Card radius={20}>
      <SectionHead
        title="Color de acento"
        subtitle="Define el color principal de la marca en toda la app."
        icon={<Palette size={16} />}
      />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ACCENT_LIST.map((p) => {
          const isActive = accent === p.name;
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => setAccent(p.name)}
              className={cn(
                "rounded-[14px] p-3 text-left transition-all",
                isActive
                  ? "border-2 bg-bg-2 dark:bg-white/[0.04]"
                  : "border border-hairline bg-bg-2 hover:brightness-95 dark:border-hairline-dark dark:bg-white/[0.03]",
              )}
              style={isActive ? { borderColor: p.shades[500] } : undefined}
            >
              <div
                className="h-12 w-full rounded-[10px]"
                style={{
                  background: `linear-gradient(135deg, ${p.shades[500]} 0%, ${p.gradMid} 55%, ${p.gradEnd} 100%)`,
                }}
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "truncate text-[12px] font-bold sm:text-[13px]",
                    isActive ? "text-ink dark:text-dark-ink" : "text-ink-2 dark:text-dark-ink-2",
                  )}
                >
                  {p.label}
                </span>
                {isActive && (
                  <span
                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: p.shades[500] }}
                  >
                    <Check size={11} />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
