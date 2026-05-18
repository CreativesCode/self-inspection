import { NO_ERRORS, type AppErrList } from "@/lib/data/types";
/**
 * Servicios Supabase para users / profiles.
 *
 * NOTA: la creación/borrado real de usuarios requiere la Admin API (service_role)
 * y debería hacerse desde una Edge Function en producción. Aquí mantenemos
 * los CRUDs sobre la tabla `profiles` para que las pantallas admin sigan
 * funcionando. La creación de un user nuevo crea solo el `profile`; en
 * producción se complementará con un endpoint Edge Function que llame a
 * `auth.admin.createUser`.
 */
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

type UserRoleEnum = Database["public"]["Enums"]["user_role"];

export interface UIUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: string; // UPPERCASE legacy format
    isActive: boolean;
    isStaff: boolean;
    isSuperuser: boolean;
    profile: {
        phoneNumber: string;
        address: string;
        profilePicture: string;
        bio: string;
    };
}

interface Connection<T> {
    totalCount: number;
    edges: Array<{ node: T }>;
}

const ROLE_DB_TO_UI: Record<UserRoleEnum, string> = {
    administrador: "ADMINISTRADOR",
    jefe_de_obra: "JEFE_DE_OBRA",
    tecnico: "TECNICO",
    jefe_de_trabajo: "JEFE_DE_TRABAJO",
};

const ROLE_UI_TO_DB: Record<string, UserRoleEnum> = {
    ADMINISTRADOR: "administrador",
    JEFE_DE_OBRA: "jefe_de_obra",
    TECNICO: "tecnico",
    JEFE_DE_TRABAJO: "jefe_de_trabajo",
};

interface RawProfileRow {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    user_type: UserRoleEnum;
    is_active: boolean;
    phone_number: string | null;
    address: string | null;
    profile_picture: string | null;
    bio: string | null;
}

function mapUser(r: RawProfileRow): UIUser {
    const userType = ROLE_DB_TO_UI[r.user_type] ?? "JEFE_DE_TRABAJO";
    return {
        id: r.id,
        email: r.email,
        firstName: r.first_name,
        lastName: r.last_name,
        userType,
        isActive: r.is_active,
        isStaff: userType === "ADMINISTRADOR",
        isSuperuser: userType === "ADMINISTRADOR",
        profile: {
            phoneNumber: r.phone_number ?? "",
            address: r.address ?? "",
            profilePicture: r.profile_picture ?? "",
            bio: r.bio ?? "",
        },
    };
}

const SELECT = "id, email, first_name, last_name, user_type, is_active, phone_number, address, profile_picture, bio";

// =====================================================================
// Queries
// =====================================================================

export async function getMe(): Promise<{ me: UIUser | null }> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { me: null };
    const { data, error } = await supabase
        .from("profiles")
        .select(SELECT)
        .eq("id", user.id)
        .maybeSingle();
    if (error) throw error;
    return { me: data ? mapUser(data as unknown as RawProfileRow) : null };
}

export async function getUsers(vars: {
    first?: number;
    pageOffset?: number;
    email_Icontains?: string;
    firstName_Icontains?: string;
    lastName_Icontains?: string;
    userType?: string;
} = {}): Promise<{ users: Connection<UIUser> }> {
    const first = vars.first ?? 50;
    const offset = vars.pageOffset ?? 0;
    let q = supabase.from("profiles").select(SELECT, { count: "exact" });
    if (vars.email_Icontains) q = q.ilike("email", `%${vars.email_Icontains}%`);
    if (vars.firstName_Icontains)
        q = q.ilike("first_name", `%${vars.firstName_Icontains}%`);
    if (vars.lastName_Icontains)
        q = q.ilike("last_name", `%${vars.lastName_Icontains}%`);
    if (vars.userType) {
        const dbRole = ROLE_UI_TO_DB[vars.userType] ?? vars.userType;
        q = q.eq("user_type", dbRole);
    }
    q = q.order("first_name").range(offset, offset + first - 1);
    const { data, error, count } = await q;
    if (error) throw error;
    return {
        users: {
            totalCount: count ?? 0,
            edges: ((data ?? []) as unknown as RawProfileRow[]).map((r) => ({
                node: mapUser(r),
            })),
        },
    };
}

export async function getUser(vars: {
    id: string;
}): Promise<{ user: UIUser | null }> {
    const { data, error } = await supabase
        .from("profiles")
        .select(SELECT)
        .eq("id", vars.id)
        .maybeSingle();
    if (error) throw error;
    return { user: data ? mapUser(data as unknown as RawProfileRow) : null };
}

// =====================================================================
// Mutations
// =====================================================================

/**
 * Crear un usuario nuevo. Invoca la Edge Function `admin-create-user`, que
 * usa `service_role` para llamar a `auth.admin.createUser`. El trigger SQL
 * `on_auth_user_created` puebla `public.profiles` automáticamente.
 *
 * Solo admins / jefes_de_obra pueden invocarla (la propia Edge Function
 * valida el rol del caller con su JWT).
 */
export async function createUser(vars: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userType: string;
    phoneNumber?: string;
    address?: string;
    bio?: string;
    mustChangePassword?: boolean;
}): Promise<{ createUser: { user: { id: string }; errors: NO_ERRORS } }> {
    const dbRole = ROLE_UI_TO_DB[vars.userType] ?? "jefe_de_trabajo";
    const { data, error } = await supabase.functions.invoke<{
        id: string;
        error?: string;
        warning?: string;
    }>("admin-create-user", {
        body: {
            email: vars.email,
            password: vars.password,
            firstName: vars.firstName,
            lastName: vars.lastName,
            userType: dbRole,
            phoneNumber: vars.phoneNumber,
            address: vars.address,
            bio: vars.bio,
            mustChangePassword: vars.mustChangePassword ?? false,
        },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (!data?.id) throw new Error("La función no devolvió un id");
    return { createUser: { user: { id: data.id }, errors: NO_ERRORS } };
}

export async function updateUser(vars: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: string;
    phoneNumber?: string;
    address?: string;
    bio?: string;
    /** No se actualiza desde aquí — para password usar el flow /cambiar-password. */
    password?: string;
}): Promise<{ updateUser: { user: { id: string }; errors: NO_ERRORS } }> {
    void vars.password;
    const dbRole = ROLE_UI_TO_DB[vars.userType] ?? "jefe_de_trabajo";
    const { error } = await supabase
        .from("profiles")
        .update({
            email: vars.email,
            first_name: vars.firstName,
            last_name: vars.lastName,
            user_type: dbRole,
            phone_number: vars.phoneNumber ?? null,
            address: vars.address ?? null,
            bio: vars.bio ?? null,
        })
        .eq("id", vars.id);
    if (error) throw error;
    return { updateUser: { user: { id: vars.id }, errors: NO_ERRORS } };
}

export async function deleteUser(vars: {
    id: string;
}): Promise<{ deleteUser: { success: boolean; errors: NO_ERRORS } }> {
    const { data, error } = await supabase.functions.invoke<{
        success?: boolean;
        error?: string;
    }>("admin-delete-user", { body: { id: vars.id } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return { deleteUser: { success: !!data?.success, errors: NO_ERRORS } };
}

/**
 * Sube una imagen de perfil al bucket Supabase Storage `media` y actualiza
 * `profiles.profile_picture` con su path.
 *
 * @param image — base64 dataURL o base64 puro
 * @param fileName — nombre original (usado para extraer extensión)
 */
export async function uploadProfilePicture(vars: {
    image: string;
    fileName: string;
}): Promise<{
    uploadProfilePicture: {
        success: boolean;
        profilePictureUrl: string;
        errors: AppErrList;
    };
}> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    // Aceptar tanto dataURL ("data:image/jpeg;base64,...") como base64 puro
    const base64 = vars.image.includes(",")
        ? vars.image.split(",")[1]
        : vars.image;
    const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const ext = (vars.fileName.split(".").pop() || "jpg").toLowerCase();
    const path = `profile_pics/${user.id}/${crypto.randomUUID()}.${ext}`;
    const contentType =
        ext === "png"
            ? "image/png"
            : ext === "webp"
              ? "image/webp"
              : ext === "heic" || ext === "heif"
                ? "image/heic"
                : "image/jpeg";

    const { error: upErr } = await supabase.storage
        .from("media")
        .upload(path, binary, {
            contentType,
            upsert: false,
        });
    if (upErr) throw upErr;

    const { error: profErr } = await supabase
        .from("profiles")
        .update({ profile_picture: path })
        .eq("id", user.id);
    if (profErr) throw profErr;

    const { data: signed } = await supabase.storage
        .from("media")
        .createSignedUrl(path, 60 * 60 * 24 * 7); // 1 semana
    return {
        uploadProfilePicture: {
            success: true,
            profilePictureUrl: signed?.signedUrl ?? path,
            errors: NO_ERRORS,
        },
    };
}
