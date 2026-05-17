/**
 * admin-create-user
 *
 * Crea un usuario en `auth.users` usando la API admin con `service_role`.
 * El trigger `on_auth_user_created` poblará `public.profiles` con
 * first_name / last_name / user_type a partir de `user_metadata`. Tras eso,
 * actualizamos los campos opcionales (phone, address, bio).
 *
 * Solo admins / jefes_de_obra pueden invocar este endpoint.
 */
import { preflight, json } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/auth.ts";

type UserRole = "administrador" | "jefe_de_obra" | "tecnico" | "jefe_de_trabajo";

interface CreateUserPayload {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userType: UserRole;
    phoneNumber?: string;
    address?: string;
    bio?: string;
    /** Si true, fuerza al usuario a cambiar la contraseña en su primer login. */
    mustChangePassword?: boolean;
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

    let payload: CreateUserPayload;
    try {
        payload = await req.json();
    } catch {
        return json({ error: "JSON inválido" }, 400);
    }

    if (!payload.email || !payload.password || !payload.firstName) {
        return json(
            { error: "email, password y firstName son obligatorios" },
            400,
        );
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: payload.email,
        password: payload.password,
        email_confirm: true,
        user_metadata: {
            first_name: payload.firstName,
            last_name: payload.lastName ?? "",
            user_type: payload.userType ?? "jefe_de_trabajo",
            must_change_password: payload.mustChangePassword ?? false,
        },
    });

    if (createErr || !created.user) {
        return json(
            { error: createErr?.message ?? "No se pudo crear el usuario" },
            400,
        );
    }

    // Trigger `on_auth_user_created` ya creó el profile con first_name,
    // last_name y user_type. Solo nos queda completar los opcionales.
    const optional: Record<string, string | null> = {};
    if (payload.phoneNumber !== undefined) optional.phone_number = payload.phoneNumber || null;
    if (payload.address !== undefined) optional.address = payload.address || null;
    if (payload.bio !== undefined) optional.bio = payload.bio || null;

    if (Object.keys(optional).length > 0) {
        const { error: updErr } = await admin
            .from("profiles")
            .update(optional)
            .eq("id", created.user.id);
        if (updErr) {
            // No abortamos: el usuario ya está creado. Reportamos warning.
            return json({
                id: created.user.id,
                warning: `Usuario creado pero falló al actualizar profile: ${updErr.message}`,
            });
        }
    }

    return json({ id: created.user.id });
});
