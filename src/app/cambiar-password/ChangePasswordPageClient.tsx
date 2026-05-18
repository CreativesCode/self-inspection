"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { GradientBorder } from "@/components/ui/GradientBorder";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const MIN_LENGTH = 8;

function validatePassword(pwd: string): string | null {
    if (pwd.length < MIN_LENGTH) return `Mínimo ${MIN_LENGTH} caracteres.`;
    if (!/[A-Z]/.test(pwd)) return "Incluye al menos una mayúscula.";
    if (!/[a-z]/.test(pwd)) return "Incluye al menos una minúscula.";
    if (!/[0-9]/.test(pwd)) return "Incluye al menos un número.";
    return null;
}

export default function ChangePasswordPageClient() {
    const router = useRouter();
    const changePassword = useAuthStore((s) => s.changePassword);
    const user = useAuthStore((s) => s.user);
    const isLoading = useAuthStore((s) => s.isLoading);

    const [pwd, setPwd] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const v = validatePassword(pwd);
        if (v) {
            setError(v);
            return;
        }
        if (pwd !== confirm) {
            setError("Las contraseñas no coinciden.");
            return;
        }
        try {
            await changePassword(pwd);
            setSuccess(true);
            // Pequeña pausa para que el usuario vea el feedback
            setTimeout(() => {
                router.replace("/");
            }, 1200);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo cambiar la contraseña. Inténtalo de nuevo.",
            );
        }
    };

    return (
        <div
            className={cn(
                "min-h-screen w-full keyboard-adjust",
                "flex items-center justify-center p-6 sm:p-14",
                "bg-bg dark:bg-dark-bg text-ink dark:text-dark-ink",
            )}
        >
            <div className="w-full max-w-[480px]">
                <div className="mb-8 flex justify-center">
                    <Logo size={40} />
                </div>

                <div className="text-[13px] font-medium text-ink-2 dark:text-dark-ink-2">
                    Bienvenido, {user?.firstName || user?.email}
                </div>
                <h2 className="m-0 text-[32px] font-extrabold tracking-tighter text-ink dark:text-white">
                    Cambia tu contraseña
                </h2>
                <p className="mb-8 mt-2 text-sm text-ink-2 dark:text-dark-ink-2">
                    Por seguridad, debes establecer una contraseña personal antes
                    de seguir usando la plataforma.
                </p>

                <GradientBorder radius={18}>
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-4 p-7"
                        autoComplete="off"
                    >
                        <Field
                            label="Nueva contraseña"
                            type={showPwd ? "text" : "password"}
                            icon={<Lock size={16} />}
                            value={pwd}
                            onChange={(e) => setPwd(e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            autoComplete="new-password"
                            required
                            suffix={
                                <button
                                    type="button"
                                    onClick={() => setShowPwd((s) => !s)}
                                    aria-label={showPwd ? "Ocultar" : "Mostrar"}
                                    className="text-ink-2 hover:text-ink dark:text-dark-ink-2"
                                >
                                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            }
                        />

                        <Field
                            label="Confirmar contraseña"
                            type={showPwd ? "text" : "password"}
                            icon={<ShieldCheck size={16} />}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Repite la contraseña"
                            autoComplete="new-password"
                            required
                        />

                        {error && (
                            <p className="text-sm font-medium text-red-500">
                                {error}
                            </p>
                        )}
                        {success && (
                            <p className="text-sm font-medium text-emerald-500">
                                ¡Contraseña actualizada! Redirigiendo…
                            </p>
                        )}

                        <ul className="ml-1 mt-1 list-disc pl-4 text-xs text-ink-2 dark:text-dark-ink-2">
                            <li>Mínimo {MIN_LENGTH} caracteres.</li>
                            <li>Al menos una mayúscula, una minúscula y un número.</li>
                        </ul>

                        <Button
                            type="submit"
                            size="lg"
                            block
                            disabled={isLoading || success}
                            className="mt-2"
                        >
                            {isLoading
                                ? "Guardando…"
                                : success
                                  ? "Contraseña actualizada"
                                  : "Guardar nueva contraseña"}
                        </Button>
                    </form>
                </GradientBorder>
            </div>
        </div>
    );
}
