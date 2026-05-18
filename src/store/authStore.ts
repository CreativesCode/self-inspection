/**
 * Auth store basado en Supabase Auth.
 *
 * Sustituye al anterior basado en Django + Apollo. Conserva la API pública
 * (`user`, `isAuthenticated`, `login`, `logout`, etc.) para no romper los
 * 36 archivos del frontend mientras se migran las queries.
 *
 * Mapeo de roles:
 *   Supabase enum (BD)   →   user.userType (frontend, formato legacy)
 *   ------------------------------------------------------------------
 *   administrador        →   ADMINISTRADOR
 *   jefe_de_obra         →   JEFE_DE_OBRA
 *   tecnico              →   TECNICO
 *   jefe_de_trabajo      →   JEFE_DE_TRABAJO
 *
 * Persistencia: el SDK de Supabase guarda la sesión en localStorage
 * (storageKey="sb-self-inspection-auth"). No usamos `zustand/persist`
 * porque la fuente de verdad es el SDK.
 */
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import { create } from "zustand";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type UserRoleEnum = Database["public"]["Enums"]["user_role"];

// Tipo que ven los componentes (compatible con el código existente).
interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: string;          // formato legacy uppercase (ADMINISTRADOR, etc.)
    isActive: boolean;
    isStaff: boolean;          // legacy: ya no se usa en Supabase, siempre = userType === ADMINISTRADOR
    isSuperuser: boolean;      // legacy: igual
    mustChangePassword: boolean;
    profile: {
        phoneNumber: string;
        address: string;
        profilePicture: string;
        bio: string;
    };
}

interface AuthState {
    user: User | null;
    token: string | null;              // legacy field: ahora = supabase access_token
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;

    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    clearSession: () => void;
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    setLoading: (loading: boolean) => void;
    refetchMe: () => Promise<void>;
    checkAuth: () => Promise<void>;
    initialize: () => Promise<void>;
    changePassword: (newPassword: string) => Promise<void>;
    /** Legacy helper: con Supabase ya no hace falta envolver requests porque
     *  el SDK adjunta el token automáticamente. Se mantiene la firma para
     *  no tocar los componentes que la invocan. */
    makeAuthenticatedRequest: <T>(request: () => Promise<T>) => Promise<T>;
}

// ---------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------

const ROLE_MAP: Record<UserRoleEnum, string> = {
    administrador: "ADMINISTRADOR",
    jefe_de_obra: "JEFE_DE_OBRA",
    tecnico: "TECNICO",
    jefe_de_trabajo: "JEFE_DE_TRABAJO",
};

function profileToUser(
    profile: ProfileRow,
    supabaseUser: { email?: string | null; user_metadata?: Record<string, unknown> } | null,
): User {
    const userType = ROLE_MAP[profile.user_type] ?? "JEFE_DE_TRABAJO";
    return {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        userType,
        isActive: profile.is_active,
        isStaff: userType === "ADMINISTRADOR",
        isSuperuser: userType === "ADMINISTRADOR",
        mustChangePassword:
            !!(supabaseUser?.user_metadata as { must_change_password?: boolean })
                ?.must_change_password,
        profile: {
            phoneNumber: profile.phone_number ?? "",
            address: profile.address ?? "",
            profilePicture: profile.profile_picture ?? "",
            bio: profile.bio ?? "",
        },
    };
}

async function loadProfileForCurrentSession(): Promise<User | null> {
    const {
        data: { user: supabaseUser },
    } = await supabase.auth.getUser();
    if (!supabaseUser) return null;

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", supabaseUser.id)
        .single();
    if (error || !profile) {
        console.warn("No se pudo cargar profile:", error?.message);
        return null;
    }
    return profileToUser(profile, supabaseUser);
}

// ---------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------

export const useAuthStore = create<AuthState>()((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    isInitialized: false,

    initialize: async () => {
        // Lee la sesión que el SDK haya rehidratado de localStorage.
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (session) {
            const user = await loadProfileForCurrentSession();
            set({
                user,
                token: session.access_token,
                isAuthenticated: !!user,
                isLoading: false,
                isInitialized: true,
            });
        } else {
            set({ user: null, token: null, isAuthenticated: false, isLoading: false, isInitialized: true });
        }

        // Suscripción global: sincroniza el store con cambios del SDK
        // (login, logout, autorefresh, updateUser, etc.).
        supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (event === "SIGNED_OUT" || !newSession) {
                set({ user: null, token: null, isAuthenticated: false });
                return;
            }
            const user = await loadProfileForCurrentSession();
            set({
                user,
                token: newSession.access_token,
                isAuthenticated: !!user,
            });
        });
    },

    login: async (email, password) => {
        set({ isLoading: true });
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;

            const user = await loadProfileForCurrentSession();
            const {
                data: { session },
            } = await supabase.auth.getSession();
            set({
                user,
                token: session?.access_token ?? null,
                isAuthenticated: !!user,
            });
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        set({ isLoading: true });
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            set({ user: null, token: null, isAuthenticated: false });
        } finally {
            set({ isLoading: false });
        }
    },

    clearSession: () => {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        // No await — fire and forget
        void supabase.auth.signOut();
    },

    setUser: (user) => set({ user, isAuthenticated: !!user }),
    setToken: (token) => set({ token }),
    setLoading: (isLoading) => set({ isLoading }),

    refetchMe: async () => {
        const user = await loadProfileForCurrentSession();
        if (user) set({ user });
    },

    checkAuth: async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
            return;
        }
        const user = await loadProfileForCurrentSession();
        set({
            user,
            token: session.access_token,
            isAuthenticated: !!user,
            isLoading: false,
        });
    },

    changePassword: async (newPassword) => {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
            data: { must_change_password: false },
        });
        if (error) throw error;
        // Refrescar el user del store para reflejar el nuevo metadata
        await get().refetchMe();
    },

    makeAuthenticatedRequest: async <T,>(request: () => Promise<T>): Promise<T> => {
        // El SDK de Supabase ya adjunta el token a cada query/mutation; este
        // wrapper queda solo como compatibilidad con componentes legacy.
        return request();
    },
}));

export const initializeAuthStore = async () => {
    await useAuthStore.getState().initialize();
};
