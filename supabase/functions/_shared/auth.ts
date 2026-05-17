/**
 * Helpers compartidos para autorizar Edge Functions de administración.
 *
 * `requireAdmin(req)` verifica el JWT del header `Authorization` contra el
 * proyecto Supabase y consulta `public.profiles.user_type` para asegurar
 * que el caller es `administrador` o `jefe_de_obra`.
 */
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export interface AdminCheck {
    /** Cliente con rol `service_role` para operaciones privilegiadas. */
    admin: SupabaseClient;
    /** UUID del usuario autenticado (el admin que invoca la función). */
    callerId: string;
}

/**
 * Lanza un Response con status 401/403 si la petición no viene de un admin.
 * Devuelve el cliente service-role + el id del caller para auditar.
 */
export async function requireAdmin(req: Request): Promise<AdminCheck | Response> {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
        return jsonError(401, "Falta cabecera Authorization Bearer");
    }
    const token = authHeader.slice("Bearer ".length);

    // Cliente con el anon key, usado solo para validar el JWT del caller.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
        data: { user },
        error,
    } = await userClient.auth.getUser(token);
    if (error || !user) {
        return jsonError(401, "Token inválido");
    }

    // Cliente service_role: salta RLS y puede usar `auth.admin.*`.
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile } = await admin
        .from("profiles")
        .select("user_type, is_active")
        .eq("id", user.id)
        .maybeSingle();

    if (!profile || !profile.is_active) {
        return jsonError(403, "Usuario sin profile activo");
    }
    if (
        profile.user_type !== "administrador" &&
        profile.user_type !== "jefe_de_obra"
    ) {
        return jsonError(403, "Requiere rol administrador o jefe_de_obra");
    }

    return { admin, callerId: user.id };
}

function jsonError(status: number, message: string): Response {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
    });
}
