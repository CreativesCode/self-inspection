/**
 * admin-delete-user
 *
 * Borra un usuario de `auth.users`. El cascade FK borra automáticamente
 * el row de `public.profiles` y las inspecciones/answers se mantienen
 * referenciando `user_id` (la FK está en SET NULL / no se borra).
 *
 * Solo admins / jefes_de_obra. Bloqueamos auto-borrado.
 */
import { preflight, json } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/auth.ts";

interface DeleteUserPayload {
    id: string;
}

Deno.serve(async (req) => {
    const pre = preflight(req);
    if (pre) return pre;

    if (req.method !== "POST") {
        return json({ error: "Solo POST" }, 405);
    }

    const auth = await requireAdmin(req);
    if (auth instanceof Response) return auth;
    const { admin, callerId } = auth;

    let payload: DeleteUserPayload;
    try {
        payload = await req.json();
    } catch {
        return json({ error: "JSON inválido" }, 400);
    }

    if (!payload.id) {
        return json({ error: "id requerido" }, 400);
    }

    if (payload.id === callerId) {
        return json(
            { error: "No puedes borrar tu propio usuario desde esta consola." },
            400,
        );
    }

    const { error } = await admin.auth.admin.deleteUser(payload.id);
    if (error) {
        return json({ error: error.message }, 400);
    }

    return json({ success: true });
});
