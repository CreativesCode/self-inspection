"use client";

import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/contexts/ThemeContext";
import { fromGenericError, notifyError } from "@/lib/error-service";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { GradientBorder } from "@/components/ui/GradientBorder";
import { Logo } from "@/components/ui/Logo";

const HERO_STATS = [
  { k: "1,284", l: "Inspecciones este mes" },
  { k: "98.4%", l: "Cobertura del checklist" },
  { k: "37s", l: "Por pregunta en promedio" },
];

export default function LoginPageClient() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const login = useAuthStore((s) => s.login);
  const { addNotification } = useApp();
  const { isDark } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  // Redirección post-login (lógica idéntica a la versión anterior)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (user?.userType === "ADMINISTRADOR") {
      router.push("/profile/admin");
    } else if (
      user?.userType === "TECNICO" ||
      user?.userType === "JEFE_DE_TRABAJO"
    ) {
      router.push("/profile/worker");
    } else {
      router.push("/");
    }
  }, [isAuthenticated, router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      addNotification({
        message: "¡Inicio de sesión exitoso!",
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        !error.message.includes("Error de autenticación")
      ) {
        notifyError(fromGenericError(error, "Error al iniciar sesión"));
      }
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen w-full keyboard-adjust",
        "grid grid-cols-1 lg:grid-cols-2",
        "bg-bg dark:bg-dark-bg",
        "text-ink dark:text-dark-ink",
      )}
    >
      {/* ─── Lado izquierdo: artwork + headline (oculto en mobile) ─── */}
      <aside
        className={cn(
          "relative hidden flex-col justify-between p-14 lg:flex",
          "border-r border-hairline dark:border-hairline-dark",
        )}
        style={{
          background: isDark
            ? "radial-gradient(120% 80% at 20% 0%, rgba(var(--accent-rgb),0.18), transparent 50%), radial-gradient(80% 60% at 80% 100%, rgba(247,140,124,0.10), transparent 60%), #1B1614"
            : "radial-gradient(120% 80% at 20% 0%, rgba(var(--accent-rgb),0.10), transparent 50%), radial-gradient(80% 60% at 80% 100%, rgba(247,140,124,0.18), transparent 60%), #FAF7F4",
        }}
      >
        <Logo size={44} />

        <div>
          <span
            className={cn(
              "mb-7 inline-flex items-center gap-2 rounded-full px-3 py-1.5",
              "border border-[rgba(var(--accent-rgb),0.24)] bg-[rgba(var(--accent-rgb),0.08)]",
              "text-[12px] font-semibold tracking-tight text-primary-500",
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
            Plataforma de auto-inspección
          </span>
          <h1 className="m-0 text-[56px] font-extrabold leading-[1.02] tracking-tightest text-ink dark:text-white">
            Inspecciones más{" "}
            <span className="text-grad-brand">seguras, simples</span> y
            trazables.
          </h1>
          <p className="mt-5 max-w-[460px] text-[17px] leading-[1.55] text-ink-2 dark:text-dark-ink-2">
            Safe 360 digitaliza el proceso de auto-inspección de 360 Ingeco —
            desde la captura en campo hasta el ranking y los reportes
            inteligentes.
          </p>

          <div className="mt-9 flex gap-7">
            {HERO_STATS.map((s) => (
              <div key={s.l}>
                <div className="text-[28px] font-extrabold tracking-tightest">
                  {s.k}
                </div>
                <div className="mt-0.5 text-xs text-ink-2 dark:text-dark-ink-2">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-ink-2 dark:text-dark-ink-2">
          © 2026 Safe 360 · 360 Ingeco
        </div>
      </aside>

      {/* ─── Lado derecho: form ─── */}
      <main className="flex items-center justify-center p-6 sm:p-14">
        <div className="w-full max-w-[420px]">
          {/* Logo (solo móvil — el desktop ya lo muestra el aside) */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size={40} />
          </div>

          <div className="text-[13px] font-medium text-ink-2 dark:text-dark-ink-2">
            Bienvenido de vuelta
          </div>
          <h2 className="m-0 text-[36px] font-extrabold tracking-tighter text-ink dark:text-white">
            Iniciar sesión
          </h2>
          <p className="mb-8 mt-2 text-sm text-ink-2 dark:text-dark-ink-2">
            Accede con tu cuenta corporativa para continuar.
          </p>

          <GradientBorder radius={18}>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 p-7"
              autoComplete="on"
            >
              <Field
                label="Correo electrónico"
                type="email"
                icon={<Mail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.correo@360ingeco.com"
                autoComplete="email"
                required
              />

              <Field
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                icon={<Lock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    className="text-ink-2 hover:text-ink dark:text-dark-ink-2"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <div className="mt-1 flex items-center justify-between text-[13px]">
                <button
                  type="button"
                  onClick={() => setRemember((r) => !r)}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 text-ink-2 dark:text-dark-ink-2",
                    "outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
                    "rounded-md p-0.5 -m-0.5",
                  )}
                  aria-pressed={remember}
                >
                  <span
                    className={cn(
                      "inline-flex h-[18px] w-[18px] items-center justify-center rounded-md",
                      remember
                        ? "bg-grad-brand text-white"
                        : "border border-hairline bg-transparent dark:border-hairline-dark",
                    )}
                  >
                    {remember && <Check size={12} strokeWidth={3} />}
                  </span>
                  Recordarme
                </button>
                <a
                  href="#"
                  className="font-semibold text-primary-500 hover:text-primary-600"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <Button
                type="submit"
                size="lg"
                block
                disabled={isLoading}
                icon={<ArrowRight size={16} />}
                iconPosition="right"
                className="mt-2"
              >
                {isLoading ? "Entrando…" : "Entrar a Safe 360"}
              </Button>
            </form>
          </GradientBorder>

          <p className="mt-7 text-center text-xs text-ink-2 dark:text-dark-ink-2">
            ¿Necesitas acceso? Contacta al administrador de tu obra.
          </p>
        </div>
      </main>
    </div>
  );
}
