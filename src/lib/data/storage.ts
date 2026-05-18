/**
 * Helpers para subir y resolver fotos en el bucket `media` de Supabase Storage.
 *
 * Estrategia:
 *  - El bucket es público (igual que el S3 legacy), así que `getPublicUrl`
 *    devuelve una URL estable que puede consumirse directamente desde
 *    web/móvil sin renovar signed URLs.
 *  - Los paths siguen la convención:
 *      `inspections/<inspectionId>/<uuid>.<ext>`   ← fotos de observación
 *      `profile_pics/<userId>/<uuid>.<ext>`         ← fotos de perfil
 *  - Lo que se guarda en `observation_photos.storage_path` es la **URL
 *    pública completa** (no el path), para que el frontend la pueda mostrar
 *    sin lógica extra (`getFullImageUrl` ya devuelve URLs http(s) tal cual).
 *  - Las fotos legacy migradas del Django siguen funcionando porque su path
 *    se compone vía `NEXT_PUBLIC_IMAGES_URL`.
 */
import { supabase } from "@/lib/supabase";

const MEDIA_BUCKET = "media";

function extFromMime(mime: string): string {
    if (mime === "image/jpeg") return "jpg";
    if (mime === "image/png") return "png";
    if (mime === "image/webp") return "webp";
    if (mime === "image/heic") return "heic";
    if (mime === "image/heif") return "heif";
    return "jpg";
}

function randomId(): string {
    // crypto.randomUUID está en navegadores modernos. Fallback simple para
    // entornos donde no exista.
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Sube un Blob al bucket `media` y devuelve la URL pública.
 * Lanza si la subida falla.
 */
export async function uploadObservationPhoto(
    blob: Blob,
    inspectionId: string,
): Promise<string> {
    const ext = extFromMime(blob.type);
    const path = `inspections/${inspectionId}/${randomId()}.${ext}`;
    const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, blob, {
            contentType: blob.type || "image/jpeg",
            upsert: false,
        });
    if (error) throw error;
    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

export async function uploadProfilePhoto(
    blob: Blob,
    userId: string,
): Promise<string> {
    const ext = extFromMime(blob.type);
    const path = `profile_pics/${userId}/${randomId()}.${ext}`;
    const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, blob, {
            contentType: blob.type || "image/jpeg",
            upsert: true,
        });
    if (error) throw error;
    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

/**
 * Convierte una imagen Base64 (`data:image/...;base64,...`) a Blob, para
 * poder subir capturas de cámara antiguas (capturePhoto del hook devolvía
 * Base64) sin tener que reescribir todo el componente de una vez.
 */
export function base64ToBlob(base64: string): Blob | null {
    const m = base64.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
    if (!m) return null;
    const mime = m[1];
    const binary = atob(m[2]);
    const buf = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
    return new Blob([buf], { type: mime });
}

/** true si la cadena ya es una URL http(s) o un data:image inline. */
export function isResolvedPhotoUrl(value: string): boolean {
    return value.startsWith("http://") ||
           value.startsWith("https://") ||
           value.startsWith("data:");
}

/**
 * Extrae el path interno del bucket `media` a partir de una URL pública de
 * Supabase Storage. Devuelve `null` si la URL no pertenece a este bucket
 * (p.ej. fotos legacy en S3 o data:URLs), para evitar borrados accidentales.
 *
 * Una URL pública tiene la forma:
 *   `https://<proj>.supabase.co/storage/v1/object/public/media/<path>`
 */
export function extractMediaPath(urlOrPath: string): string | null {
    if (!urlOrPath) return null;
    // Si ya es un path crudo (no http/https/data), asumimos que es del bucket.
    if (!urlOrPath.startsWith("http") && !urlOrPath.startsWith("data:")) {
        return urlOrPath;
    }
    const marker = "/storage/v1/object/public/media/";
    const idx = urlOrPath.indexOf(marker);
    if (idx === -1) return null;
    return urlOrPath.slice(idx + marker.length);
}

/**
 * Borra un objeto del bucket `media` por su URL pública (o path).
 * Es seguro llamarlo con URLs legacy (S3): no hace nada en ese caso.
 * Nunca lanza — los fallos los reporta a consola, porque dejar un huérfano
 * en Storage es preferible a romper el flujo de UI por una limpieza.
 */
export async function deleteMediaByUrl(urlOrPath: string): Promise<void> {
    const path = extractMediaPath(urlOrPath);
    if (!path) return; // no es del bucket Supabase, no tocamos.
    const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    if (error && process.env.NODE_ENV === "development") {
        console.warn("deleteMediaByUrl:", error.message);
    }
}
