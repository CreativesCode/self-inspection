/**
 * Generación de informes PDF en cliente.
 *
 * Flujo:
 *   1. Carga inspection + poll + answers + observations vía el data layer ya existente.
 *   2. Convierte a `InspectionReportPdfData`.
 *   3. Renderiza el PDF con `@react-pdf/renderer` (sólo en navegador).
 *   4. Sube al bucket `reports` (público, mismo razonamiento que `media`).
 *   5. Crea/actualiza un row en `public.report_jobs` con `status='done'` y
 *      `download_url=<URL pública>`.
 *
 * Si el PDF ya existe (jobs previos con `status='done'`) devolvemos esa URL
 * sin regenerar, para no duplicar ficheros.
 */
import { supabase } from "@/lib/supabase";
import { getInspection } from "@/lib/data/inspections";
import { getPolls } from "@/lib/data/polls";
import { getFullImageUrl } from "@/lib/utils";
import {
    InspectionReportPdf,
    type InspectionReportPdfData,
    type PdfSection,
    type PdfQuestionItem,
} from "@/components/pdf/InspectionReportPdf";

const REPORTS_BUCKET = "reports";

function randomId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fmtDateTime(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

/**
 * Construye el shape `InspectionReportPdfData` desde el data layer Supabase.
 * Exportado por si alguna pantalla quiere mostrar el PDF en preview antes
 * de subirlo (no se usa todavía).
 */
export async function buildInspectionReportData(
    inspectionId: string,
): Promise<InspectionReportPdfData | null> {
    const { inspection } = await getInspection({ id: inspectionId });
    if (!inspection) return null;

    const { polls } = await getPolls({ inspection: inspectionId });
    const poll = polls.edges[0]?.node;

    // Si hay evaluation embebida en el poll la usamos; si no, leemos directo
    // de la tabla (más simple que añadir un select extra a getPolls).
    let evaluation: InspectionReportPdfData["evaluation"] = poll?.evaluation
        ? {
              totalScore: poll.evaluation.totalScore,
              maxPossibleScore: poll.evaluation.maxPossibleScore,
              percentage: poll.evaluation.percentage,
              rating: poll.evaluation.rating,
          }
        : null;

    if (!evaluation && poll) {
        const { data } = await supabase
            .from("evaluations")
            .select("total_score, max_possible_score, percentage, rating")
            .eq("poll_id", poll.id)
            .maybeSingle();
        if (data) {
            evaluation = {
                totalScore: data.total_score,
                maxPossibleScore: data.max_possible_score,
                percentage: Number(data.percentage ?? 0),
                rating: data.rating ?? "",
            };
        }
    }

    // Agrupar preguntas por header
    const sectionsMap = new Map<
        string,
        { header: string; questions: PdfQuestionItem[] }
    >();
    for (const e of poll?.question?.edges ?? []) {
        const q = e.node;
        const headerName = q.header?.headerText || "Sin sección";
        const ans = q.answer?.edges?.[0]?.node ?? null;
        const item: PdfQuestionItem = {
            question: q.questionText,
            answer: ans?.answerText ?? "not_applicable",
            observation: ans?.observation?.observationText ?? null,
            photos: (ans?.observation?.photos ?? [])
                .map((p) => getFullImageUrl(p.photo) ?? p.photo)
                .filter(Boolean) as string[],
        };
        const slot = sectionsMap.get(headerName) ?? {
            header: headerName,
            questions: [],
        };
        slot.questions.push(item);
        sectionsMap.set(headerName, slot);
    }
    const sections: PdfSection[] = Array.from(sectionsMap.values());

    return {
        projectCode: inspection.projectCode,
        installationName: inspection.instalationName,
        inspectionType: inspection.inspectionType?.name ?? "—",
        clientName: inspection.client?.clientName ?? "—",
        dateLabel: fmtDateTime(inspection.dateTime),
        inspectorName:
            [inspection.user?.firstName, inspection.user?.lastName]
                .filter(Boolean)
                .join(" ")
                .trim() || inspection.user?.email || "—",
        inspectorEmail: inspection.user?.email ?? "—",
        gpsLatitude: inspection.GPSLatitude,
        gpsLongitude: inspection.GPSLongitude,
        generatedAtLabel: fmtDateTime(new Date().toISOString()),
        activities:
            inspection.activities?.edges?.map((e) => e.node.activityText) ?? [],
        subcontractors:
            inspection.subcontrateName?.edges?.map(
                (e) => e.node.subcontrateName,
            ) ?? [],
        evaluation,
        sections,
        observation: inspection.observation
            ? {
                  text: inspection.observation.observationText,
                  photos:
                      inspection.observation.photos
                          .map((p) => getFullImageUrl(p.photo) ?? p.photo)
                          .filter(Boolean) as string[],
              }
            : null,
    };
}

/**
 * Genera el PDF para una inspección. Si ya existe un `report_jobs` con
 * `status='done'` se devuelve su `download_url` sin regenerar.
 *
 * Devuelve la URL final (pública en bucket `reports`, o legacy S3 si era
 * un report ya existente del Django viejo).
 */
export async function generateOrFetchInspectionPdf(
    inspectionId: string,
): Promise<string> {
    // 1. ¿Existe ya un report listo?
    const { data: existing } = await supabase
        .from("report_jobs")
        .select("id, status, download_url")
        .eq("inspection_id", inspectionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (existing?.status === "done" && existing.download_url) {
        return existing.download_url;
    }

    // 2. Construir datos
    const data = await buildInspectionReportData(inspectionId);
    if (!data) throw new Error("Inspección no encontrada");

    // 3. Render (import dinámico — `@react-pdf/renderer` solo navegador)
    const { pdf } = await import("@react-pdf/renderer");
    const blob = await pdf(<InspectionReportPdf data={data} />).toBlob();

    // 4. Upload al bucket `reports`
    const path = `inspections/${inspectionId}/${randomId()}.pdf`;
    const { error: upErr } = await supabase.storage
        .from(REPORTS_BUCKET)
        .upload(path, blob, {
            contentType: "application/pdf",
            upsert: false,
        });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage
        .from(REPORTS_BUCKET)
        .getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    // 5. Crear/actualizar report_jobs
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (existing?.id) {
        await supabase
            .from("report_jobs")
            .update({
                status: "done",
                download_url: publicUrl,
                error: null,
            })
            .eq("id", existing.id);
    } else {
        await supabase.from("report_jobs").insert({
            inspection_id: inspectionId,
            requested_by: user?.id ?? null,
            format: "pdf",
            locale: "es",
            status: "done",
            download_url: publicUrl,
        });
    }

    return publicUrl;
}
