"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store";

/**
 * Bloquea la navegación a cualquier ruta que no sea /cambiar-password
 * cuando el usuario tiene `must_change_password=true` en los metadatos.
 *
 * Se monta una sola vez en RootLayoutContent; no renderiza nada.
 *
 * Edge cases:
 *  - Mientras el store no está inicializado, no hace nada (evita falsos
 *    positivos antes de que el SDK rehidrate la sesión).
 *  - Si el usuario ya está en /cambiar-password, no redirige (no loops).
 *  - Si el flag pasa a false (tras un cambio exitoso), deja de redirigir.
 */
export function PasswordChangeGuard() {
    const router = useRouter();
    const pathname = usePathname();
    const initialized = useAuthStore((s) => s.isInitialized);
    const isAuthed = useAuthStore((s) => s.isAuthenticated);
    const mustChange = useAuthStore((s) => s.user?.mustChangePassword);

    useEffect(() => {
        if (!initialized || !isAuthed || !mustChange) return;
        if (pathname === "/cambiar-password") return;
        router.replace("/cambiar-password");
    }, [initialized, isAuthed, mustChange, pathname, router]);

    return null;
}
