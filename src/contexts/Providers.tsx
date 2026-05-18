"use client";

import { ReactNode, useEffect } from "react";
import { AccentProvider } from "./AccentContext";
import { AppProvider } from "./AppContext";
import { ErrorProvider } from "./ErrorContext";
import { ThemeProvider } from "./ThemeContext";

import {
    initializeAuthStore,
    initializeErrorStore,
    initializeThemeStore,
} from "@/store";

interface ProvidersProps {
    children: ReactNode;
}

/**
 * Maneja la inicialización de stores Zustand y contextos.
 *
 * Auth: gestión completa via `authStore` (Supabase SDK debajo).
 * No usa ApolloProvider — el data layer es directo a Supabase.
 */
export function Providers({ children }: ProvidersProps) {
    useEffect(() => {
        const cleanupErrorStore = initializeErrorStore();
        const cleanupThemeStore = initializeThemeStore();

        initializeAuthStore().catch((error) => {
            console.error("Error initializing auth store:", error);
        });

        return () => {
            cleanupErrorStore();
            if (typeof cleanupThemeStore === "function") {
                cleanupThemeStore();
            }
        };
    }, []);

    return (
        <ErrorProvider>
            <AppProvider>
                <ThemeProvider>
                    <AccentProvider>{children}</AccentProvider>
                </ThemeProvider>
            </AppProvider>
        </ErrorProvider>
    );
}
