/**
 * Re-exports legacy de auth/users hacia los servicios Supabase.
 *
 * `TokenAuth`, `RefreshToken`, `VerifyToken`, `Logout` ya no se necesitan —
 * el `authStore` los gestiona via el SDK de Supabase directamente. Los
 * exportamos como funciones no-op por compatibilidad si algún archivo
 * los importa.
 */
export {
    getMe as me,
    getUsers as GetUsers,
    getUser as GetUser,
    createUser as CreateUser,
    updateUser as UpdateUser,
    deleteUser as DeleteUser,
    uploadProfilePicture as UploadProfilePicture,
} from "@/lib/data/users";

export async function TokenAuth(_vars: { email: string; password: string }) {
    void _vars;
    throw new Error("TokenAuth no se usa: el flujo de login va por authStore.login (Supabase).");
}
export async function RefreshToken() {
    throw new Error("RefreshToken no se usa: el SDK Supabase refresca el token automáticamente.");
}
export async function VerifyToken(_vars: { token: string }) {
    void _vars;
    throw new Error("VerifyToken no se usa.");
}
export async function Logout() {
    throw new Error("Logout no se usa: usar authStore.logout (Supabase).");
}
