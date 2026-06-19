"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { useAuthStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { GradientBorder } from "@/components/ui/GradientBorder";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPageClient() {
    const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset);

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await requestPasswordReset(email.trim());
            // Mostramos siempre éxito aunque el correo no exista, para no
            // revelar qué emails están registrados (enumeración de usuarios).
            setSent(true);
        } catch {
            setError(
                "No se pudo enviar el correo. Revisa la dirección e inténtalo de nuevo.",
            );
        } finally {
            setLoading(false);
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
            <div className="w-full max-w-[440px]">
                <div className="mb-8 flex justify-center">
                    <Logo size={40} />
                </div>

                {sent ? (
                    <>
                        <div className="mb-3 flex justify-center">
                            <CheckCircle2
                                size={48}
                                className="text-emerald-500"
                            />
                        </div>
                        <h2 className="m-0 text-center text-[30px] font-extrabold tracking-tighter text-ink dark:text-white">
                            Revisa tu correo
                        </h2>
                        <p className="mb-8 mt-3 text-center text-sm leading-relaxed text-ink-2 dark:text-dark-ink-2">
                            Si <strong>{email}</strong> tiene una cuenta, te
                            enviamos un enlace para restablecer tu contraseña.
                            Revisa también la carpeta de spam.
                        </p>
                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-2 text-sm font-semibold text-primary-500 hover:text-primary-600"
                        >
                            <ArrowLeft size={16} /> Volver a iniciar sesión
                        </Link>
                    </>
                ) : (
                    <>
                        <div className="text-[13px] font-medium text-ink-2 dark:text-dark-ink-2">
                            ¿Olvidaste tu contraseña?
                        </div>
                        <h2 className="m-0 text-[32px] font-extrabold tracking-tighter text-ink dark:text-white">
                            Recupérala
                        </h2>
                        <p className="mb-8 mt-2 text-sm text-ink-2 dark:text-dark-ink-2">
                            Introduce tu correo y te enviaremos un enlace para
                            crear una nueva contraseña.
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

                                {error && (
                                    <p className="text-sm font-medium text-red-500">
                                        {error}
                                    </p>
                                )}

                                <Button
                                    type="submit"
                                    size="lg"
                                    block
                                    disabled={loading}
                                    icon={<ArrowRight size={16} />}
                                    iconPosition="right"
                                    className="mt-2"
                                >
                                    {loading
                                        ? "Enviando…"
                                        : "Enviar enlace de recuperación"}
                                </Button>
                            </form>
                        </GradientBorder>

                        <p className="mt-7 text-center text-sm">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 font-semibold text-ink-2 hover:text-ink dark:text-dark-ink-2 dark:hover:text-dark-ink"
                            >
                                <ArrowLeft size={16} /> Volver a iniciar sesión
                            </Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
