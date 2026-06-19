"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react";
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

type Status = "validating" | "ready" | "invalid";

export default function ResetPasswordPageClient() {
    const router = useRouter();
    const recoverSessionFromTokens = useAuthStore(
        (s) => s.recoverSessionFromTokens,
    );
    const changePassword = useAuthStore((s) => s.changePassword);

    const [status, setStatus] = useState<Status>("validating");
    const [pwd, setPwd] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Procesa el enlace del correo: los tokens vienen en el hash de la URL
    // (#access_token=...&refresh_token=...&type=recovery). Como el cliente usa
    // detectSessionInUrl:false, los leemos y establecemos la sesión a mano.
    useEffect(() => {
        const hash = window.location.hash.startsWith("#")
            ? window.location.hash.slice(1)
            : window.location.hash;
        const params = new URLSearchParams(hash);

        const errorDescription = params.get("error_description");
        if (errorDescription) {
            setStatus("invalid");
            return;
        }

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const type = params.get("type");

        if (type !== "recovery" || !accessToken || !refreshToken) {
            setStatus("invalid");
            return;
        }

        recoverSessionFromTokens(accessToken, refreshToken)
            .then(() => {
                setStatus("ready");
                // Limpia los tokens de la URL para no dejarlos en el historial.
                window.history.replaceState(
                    null,
                    "",
                    window.location.pathname,
                );
            })
            .catch(() => setStatus("invalid"));
    }, [recoverSessionFromTokens]);

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
        setSubmitting(true);
        try {
            await changePassword(pwd);
            setSuccess(true);
            // El usuario ya tiene sesión válida; /login lo redirige a su home.
            setTimeout(() => router.replace("/login"), 1200);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo restablecer la contraseña. Inténtalo de nuevo.",
            );
        } finally {
            setSubmitting(false);
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

                {status === "validating" && (
                    <div className="flex items-center justify-center gap-2 text-sm text-ink-2 dark:text-dark-ink-2">
                        <Loader2 size={18} className="animate-spin" /> Validando
                        enlace…
                    </div>
                )}

                {status === "invalid" && (
                    <>
                        <h2 className="m-0 text-center text-[30px] font-extrabold tracking-tighter text-ink dark:text-white">
                            Enlace no válido o expirado
                        </h2>
                        <p className="mb-8 mt-3 text-center text-sm leading-relaxed text-ink-2 dark:text-dark-ink-2">
                            El enlace para restablecer tu contraseña no es válido
                            o ya caducó. Solicita uno nuevo.
                        </p>
                        <Link
                            href="/recuperar-password"
                            className="flex items-center justify-center gap-2 text-sm font-semibold text-primary-500 hover:text-primary-600"
                        >
                            Solicitar un nuevo enlace
                        </Link>
                        <p className="mt-4 text-center text-sm">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 font-semibold text-ink-2 hover:text-ink dark:text-dark-ink-2 dark:hover:text-dark-ink"
                            >
                                <ArrowLeft size={16} /> Volver a iniciar sesión
                            </Link>
                        </p>
                    </>
                )}

                {status === "ready" && (
                    <>
                        <div className="text-[13px] font-medium text-ink-2 dark:text-dark-ink-2">
                            Recuperación de cuenta
                        </div>
                        <h2 className="m-0 text-[32px] font-extrabold tracking-tighter text-ink dark:text-white">
                            Crea tu nueva contraseña
                        </h2>
                        <p className="mb-8 mt-2 text-sm text-ink-2 dark:text-dark-ink-2">
                            Elige una contraseña segura. La usarás para entrar a
                            partir de ahora.
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
                                            aria-label={
                                                showPwd ? "Ocultar" : "Mostrar"
                                            }
                                            className="text-ink-2 hover:text-ink dark:text-dark-ink-2"
                                        >
                                            {showPwd ? (
                                                <EyeOff size={16} />
                                            ) : (
                                                <Eye size={16} />
                                            )}
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
                                        ¡Contraseña restablecida! Redirigiendo…
                                    </p>
                                )}

                                <ul className="ml-1 mt-1 list-disc pl-4 text-xs text-ink-2 dark:text-dark-ink-2">
                                    <li>Mínimo {MIN_LENGTH} caracteres.</li>
                                    <li>
                                        Al menos una mayúscula, una minúscula y
                                        un número.
                                    </li>
                                </ul>

                                <Button
                                    type="submit"
                                    size="lg"
                                    block
                                    disabled={submitting || success}
                                    className="mt-2"
                                >
                                    {submitting
                                        ? "Guardando…"
                                        : success
                                          ? "Contraseña restablecida"
                                          : "Restablecer contraseña"}
                                </Button>
                            </form>
                        </GradientBorder>
                    </>
                )}
            </div>
        </div>
    );
}
