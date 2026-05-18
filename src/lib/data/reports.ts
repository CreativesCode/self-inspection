import { NO_ERRORS, type AppErrList } from "@/lib/data/types";
/**
 * Servicios Supabase para reportes (report_jobs).
 *
 * NOTA: la generación real del PDF se hará en el cliente con
 * `@react-pdf/renderer` (Fase 8). De momento estos endpoints solo manejan
 * el estado en la tabla `report_jobs`. Las pantallas siguen funcionando
 * mostrando el estado y, si existe, una signed URL.
 */
import { supabase } from "@/lib/supabase";

export interface UIReportJob {
    id: string;
    status: string; // 'queued' | 'running' | 'done' | 'failed'
    format: string;
    downloadUrl: string | null;
    expiresAt: string | null;
    error: string | null;
    createdAt: string;
}

interface RawReportJobRow {
    id: string;
    status: string;
    format: string;
    download_url: string | null;
    expires_at: string | null;
    error: string | null;
    created_at: string;
}

function mapReportJob(r: RawReportJobRow): UIReportJob {
    return {
        id: r.id,
        // La UI legacy compara contra "DONE"/"QUEUED"/"RUNNING"/"FAILED"
        // (mayúsculas, convención GraphQL Django). El enum en Supabase está
        // en minúsculas, así que normalizamos aquí.
        status: (r.status ?? "").toUpperCase(),
        format: (r.format ?? "").toUpperCase(),
        downloadUrl: r.download_url,
        expiresAt: r.expires_at,
        error: r.error,
        createdAt: r.created_at,
    };
}

/**
 * Devuelve el último report job de una inspection (si existe).
 */
export async function getInspectionReport(vars: {
    inspectionId: string;
}): Promise<{ inspectionReport: UIReportJob | null }> {
    const { data, error } = await supabase
        .from("report_jobs")
        .select("id, status, format, download_url, expires_at, error, created_at")
        .eq("inspection_id", vars.inspectionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    return {
        inspectionReport: data
            ? mapReportJob(data as unknown as RawReportJobRow)
            : null,
    };
}

/**
 * Encola un nuevo report job. En la arquitectura final el cliente generará
 * el PDF y subirá su path. De momento crea el row con status='queued'.
 */
export async function generateReport(vars: {
    inspectionId: string;
    format?: string;
    locale?: string;
}): Promise<{
    generateReport: { job: UIReportJob; errors: NO_ERRORS };
}> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
        .from("report_jobs")
        .insert({
            inspection_id: vars.inspectionId,
            requested_by: user?.id ?? null,
            format: (vars.format ?? "pdf").toLowerCase() as "pdf" | "docx",
            locale: vars.locale ?? "es",
            status: "queued",
        })
        .select("id, status, format, download_url, expires_at, error, created_at")
        .single();
    if (error) throw error;
    return {
        generateReport: {
            job: mapReportJob(data as unknown as RawReportJobRow),
            errors: NO_ERRORS,
        },
    };
}
