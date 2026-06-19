/**
 * admin-update-password
 *
 * Cambia la contraseña de un usuario en `auth.users` usando la API admin con
 * `service_role` (`auth.admin.updateUserById`). La capa de datos / RLS no puede
 * tocar `auth.users`, por eso este cambio debe ir por una Edge Function.
 *
 * Solo admins / jefes_de_obra pueden invocar este endpoint.
 */
import { preflight, json } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/auth.ts";

interface UpdatePasswordPayload {
    id: string;
    password: string;
}

Deno.serve(async (req) => {
    const pre = preflight(req);
    if (pre) return pre;

    if (req.method !== "POST") {
        return json({ error: "Solo POST" }, 405);
    }

    const auth = await requireAdmin(req);
    if (auth instanceof Response) return auth;
    const { admin } = auth;

    let payload: UpdatePasswordPayload;
    try {
        payload = await req.json();
    } catch {
        return json({ error: "JSON inválido" }, 400);
    }

    if (!payload.id || !payload.password) {
        return json({ error: "id y password son obligatorios" }, 400);
    }

    const { error } = await admin.auth.admin.updateUserById(payload.id, {
        password: payload.password,
    });
    if (error) {
        return json({ error: error.message }, 400);
    }

    return json({ success: true });
});
