import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
        "Faltan variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
            "Revísalas en frontend/.env.local"
    );
}

// Singleton: el SDK guarda sesión y refresca tokens en localStorage.
// Capacitor también soporta localStorage, así que el mismo cliente sirve para web y móvil.
export const supabase: SupabaseClient<Database> = createClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false, // SPA estática → no usamos magic links con query params
            storageKey: "sb-self-inspection-auth", // prefijo propio para no chocar con otros proyectos
        },
    }
);

export type { Database } from "@/types/database.types";
