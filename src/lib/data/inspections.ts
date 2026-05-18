import { NO_ERRORS, type AppErrList } from "@/lib/data/types";
/**
 * Servicios Supabase para el dominio "inspections".
 *
 * Las funciones devuelven datos en el shape Relay (`{ totalCount,
 * edges: [{ node }] }`) que las pantallas legacy esperaban del backend
 * Django/Graphene, para minimizar el refactor de UI.
 *
 * Convenciones:
 *  - snake_case (BD) → camelCase (frontend) hecho por las funciones de mapeo.
 *  - Las M2M se incluyen con el nested select de PostgREST (`activity:activities(...)`).
 */
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

type InspectionRow = Database["public"]["Tables"]["inspections"]["Row"];
type ObservationRow = Database["public"]["Tables"]["observations"]["Row"];

// =====================================================================
// Tipos del frontend (lo que las pantallas esperan)
// =====================================================================

export interface UIUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

export interface UIClient {
    id: string;
    clientName: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface UIActivity {
    id: string;
    activityText: string;
    createdAt?: string;
    updatedAt?: string;
    inspectionType?: { id: string; name: string };
}

export interface UISubcontract {
    id: string;
    subcontrateName: string;
}

export interface UIObservationPhoto {
    photo: string;
}

export interface UIObservation {
    id: string;
    observationText: string | null;
    photos: UIObservationPhoto[];
}

export interface UIInspectionType {
    id: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface UIQuestion {
    id: string;
    questionText: string;
    header: { id: string; headerText: string };
    createdAt: string;
    updatedAt: string;
}

export interface UIHeader {
    id: string;
    headerText: string;
    createdAt: string;
    updatedAt: string;
    inspectionType?: { id: string; name: string };
    questions: UIQuestion[];
}

export interface UIPoll {
    id: string;
    status: string;
    answers?: {
        edges: Array<{
            node: {
                id: string;
                answerText: string;
                question: { id: string };
                observation: UIObservation | null;
            };
        }>;
    };
}

export interface UIInspection {
    id: string;
    projectCode: string;
    instalationName: string;
    inspectionType: UIInspectionType;
    dateTime: string;
    GPSLatitude: number;
    GPSLongitude: number;
    user: UIUser;
    client: UIClient;
    activities: { edges: Array<{ node: UIActivity }> };
    subcontrateName: { edges: Array<{ node: UISubcontract }> };
    observation: UIObservation | null;
    polls?: { edges: Array<{ node: UIPoll }> };
}

export interface InspectionsConnection {
    totalCount: number;
    edges: Array<{ node: UIInspection }>;
}

// =====================================================================
// Helpers
// =====================================================================

type PollRaw = { id: string; status: string };
type ObservationRaw = {
    id: string;
    observation_text: string | null;
    photos: Array<{ storage_path: string }>;
};

interface InspectionRawRow {
    id: string;
    project_code: string;
    instalation_name: string;
    date_time: string;
    gps_latitude: number;
    gps_longitude: number;
    inspection_type: { id: string; name: string } | null;
    user: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
    } | null;
    client: { id: string; client_name: string } | null;
    activities: Array<{
        activity: { id: string; activity_text: string } | null;
    }>;
    subcontracts: Array<{
        subcontrate_name: { id: string; subcontrate_name: string } | null;
    }>;
    // observation: 1-1 (inspections.observation_id es FK), pero PostgREST a veces
    // devuelve array según el sentido del embed. Aceptamos ambos.
    observation: ObservationRaw | ObservationRaw[] | null;
    // polls: PostgREST detecta el UNIQUE de polls.inspection_id y devuelve un
    // único objeto en lugar de array. Aceptamos ambas formas por defensa.
    polls: PollRaw | PollRaw[] | null;
}

function toArray<T>(v: T | T[] | null | undefined): T[] {
    if (v == null) return [];
    return Array.isArray(v) ? v : [v];
}

function mapInspection(r: InspectionRawRow): UIInspection {
    return {
        id: r.id,
        projectCode: r.project_code,
        instalationName: r.instalation_name,
        inspectionType: r.inspection_type
            ? { id: r.inspection_type.id, name: r.inspection_type.name }
            : { id: "", name: "" },
        dateTime: r.date_time,
        GPSLatitude: Number(r.gps_latitude),
        GPSLongitude: Number(r.gps_longitude),
        user: r.user
            ? {
                  id: r.user.id,
                  email: r.user.email,
                  firstName: r.user.first_name,
                  lastName: r.user.last_name,
              }
            : { id: "", email: "", firstName: "", lastName: "" },
        client: r.client
            ? { id: r.client.id, clientName: r.client.client_name }
            : { id: "", clientName: "" },
        activities: {
            edges: r.activities
                .filter((a) => a.activity)
                .map((a) => ({
                    node: {
                        id: a.activity!.id,
                        activityText: a.activity!.activity_text,
                    },
                })),
        },
        subcontrateName: {
            edges: r.subcontracts
                .filter((s) => s.subcontrate_name)
                .map((s) => ({
                    node: {
                        id: s.subcontrate_name!.id,
                        subcontrateName: s.subcontrate_name!.subcontrate_name,
                    },
                })),
        },
        observation: (() => {
            const obs = toArray(r.observation)[0] ?? null;
            if (!obs) return null;
            return {
                id: obs.id,
                observationText: obs.observation_text,
                photos: (obs.photos ?? []).map((p) => ({
                    photo: p.storage_path,
                })),
            };
        })(),
        polls: {
            // Las pantallas legacy comparan status contra "COMPLETED"/"PENDING"
            // (la API GraphQL Django devolvía mayúsculas). En Supabase el enum
            // está en minúsculas, así que normalizamos aquí para no tocar 4
            // archivos de UI.
            edges: toArray(r.polls).map((p) => ({
                node: { id: p.id, status: (p.status ?? "").toUpperCase() },
            })),
        },
    };
}

const INSPECTION_SELECT = `
  id, project_code, instalation_name, date_time,
  gps_latitude, gps_longitude,
  inspection_type:inspection_types(id, name),
  user:profiles!inspections_user_id_fkey(id, email, first_name, last_name),
  client:clients(id, client_name),
  activities:inspection_activities(activity:activities(id, activity_text)),
  subcontracts:inspection_subcontracts(subcontrate_name:subcontrate_names(id, subcontrate_name)),
  observation:observations(id, observation_text, photos:observation_photos(storage_path)),
  polls(id, status)
`;

// =====================================================================
// Queries
// =====================================================================

export interface GetInspectionsVars {
    first?: number;
    pageOffset?: number;
    projectCode_Icontains?: string;
    instalationName_Icontains?: string;
    dateTime?: string;
    dateTime_Gt?: string;
    dateTime_Lt?: string;
    client_ClientName_Icontains?: string;
    activity_ActivityText_Icontains?: string;
    user_Email_Icontains?: string;
    userId?: string;
    inspectionType_Name?: string;
}

export async function getInspections(
    vars: GetInspectionsVars = {},
): Promise<{ inspections: InspectionsConnection }> {
    const first = vars.first ?? 10;
    const offset = vars.pageOffset ?? 0;

    let q = supabase
        .from("inspections")
        .select(INSPECTION_SELECT, { count: "exact" });

    if (vars.projectCode_Icontains) q = q.ilike("project_code", `%${vars.projectCode_Icontains}%`);
    if (vars.instalationName_Icontains)
        q = q.ilike("instalation_name", `%${vars.instalationName_Icontains}%`);
    if (vars.dateTime_Gt) q = q.gt("date_time", vars.dateTime_Gt);
    if (vars.dateTime_Lt) q = q.lt("date_time", vars.dateTime_Lt);
    if (vars.userId) q = q.eq("user_id", vars.userId);

    // Filtros que requieren joins: usar select+filter en relación es limitado en PostgREST.
    // Implementación más robusta via RPC en el futuro; por ahora, fetch + filtro cliente
    // si vienen activos.
    q = q
        .order("date_time", { ascending: false })
        .range(offset, offset + first - 1);

    const { data, error, count } = await q;
    if (error) throw error;

    let rows = (data ?? []) as unknown as InspectionRawRow[];

    // Filtros adicionales en cliente (cuando vienen filtros que postgrest no
    // soporta directo sobre relaciones embebidas con ilike)
    if (vars.client_ClientName_Icontains) {
        const needle = vars.client_ClientName_Icontains.toLowerCase();
        rows = rows.filter((r) =>
            (r.client?.client_name ?? "").toLowerCase().includes(needle),
        );
    }
    if (vars.user_Email_Icontains) {
        const needle = vars.user_Email_Icontains.toLowerCase();
        rows = rows.filter((r) =>
            (r.user?.email ?? "").toLowerCase().includes(needle),
        );
    }
    if (vars.activity_ActivityText_Icontains) {
        const needle = vars.activity_ActivityText_Icontains.toLowerCase();
        rows = rows.filter((r) =>
            r.activities.some((a) =>
                (a.activity?.activity_text ?? "")
                    .toLowerCase()
                    .includes(needle),
            ),
        );
    }
    if (vars.inspectionType_Name) {
        rows = rows.filter(
            (r) => r.inspection_type?.name === vars.inspectionType_Name,
        );
    }

    return {
        inspections: {
            totalCount: count ?? rows.length,
            edges: rows.map((r) => ({ node: mapInspection(r) })),
        },
    };
}

export async function getInspection(vars: {
    id: string;
}): Promise<{ inspection: UIInspection | null }> {
    const { data, error } = await supabase
        .from("inspections")
        .select(INSPECTION_SELECT)
        .eq("id", vars.id)
        .maybeSingle();
    if (error) throw error;
    return {
        inspection: data ? mapInspection(data as unknown as InspectionRawRow) : null,
    };
}

// =====================================================================
// Mutations: create / update / delete inspection
// =====================================================================

export interface InspectionInput {
    projectCode: string;
    instalationName: string;
    inspectionTypeId: string;
    dateTime: string;
    gpsLatitude: number;
    gpsLongitude: number;
    userId: string;
    clientId: string;
    activityIds: string[];
    subcontrateNames?: string[] | null;
    observationText?: string | null;
    photos?: string[] | null;
}

async function upsertObservationWithPhotos(
    observationId: string | null,
    observationText?: string | null,
    photos?: string[] | null,
): Promise<string | null> {
    const hasText = !!(observationText && observationText.trim());
    const hasPhotos = !!(photos && photos.length);
    if (!hasText && !hasPhotos) return null;

    let id = observationId;
    if (id) {
        const { error: upErr } = await supabase
            .from("observations")
            .update({ observation_text: observationText ?? null })
            .eq("id", id);
        if (upErr) throw upErr;
        // Reemplazar fotos: borrar las viejas e insertar las nuevas
        const { error: delErr } = await supabase
            .from("observation_photos")
            .delete()
            .eq("observation_id", id);
        if (delErr) throw delErr;
    } else {
        const { data: inserted, error: insErr } = await supabase
            .from("observations")
            .insert({ observation_text: observationText ?? null })
            .select("id")
            .single();
        if (insErr) throw insErr;
        id = inserted.id;
    }
    if (hasPhotos) {
        const { error: phErr } = await supabase
            .from("observation_photos")
            .insert(
                photos!.map((p) => ({ observation_id: id!, storage_path: p })),
            );
        if (phErr) throw phErr;
    }
    return id;
}

async function ensureSubcontracts(
    names: string[] | null | undefined,
): Promise<string[]> {
    if (!names || !names.length) return [];
    const trimmed = names
        .map((n) => n.trim())
        .filter(Boolean);
    if (!trimmed.length) return [];
    const ids: string[] = [];
    for (const name of trimmed) {
        // Buscar existente o crear
        const { data: existing, error: selErr } = await supabase
            .from("subcontrate_names")
            .select("id")
            .eq("subcontrate_name", name)
            .maybeSingle();
        if (selErr) throw selErr;
        if (existing) {
            ids.push(existing.id);
            continue;
        }
        const { data: created, error: insErr } = await supabase
            .from("subcontrate_names")
            .insert({ subcontrate_name: name })
            .select("id")
            .single();
        if (insErr) throw insErr;
        ids.push(created.id);
    }
    return ids;
}

export async function createInspection(
    input: InspectionInput,
): Promise<{ createInspection: { inspection: { id: string }; errors: NO_ERRORS } }> {
    const observationId = await upsertObservationWithPhotos(
        null,
        input.observationText,
        input.photos,
    );

    const { data: inserted, error: insErr } = await supabase
        .from("inspections")
        .insert({
            project_code: input.projectCode,
            instalation_name: input.instalationName,
            inspection_type_id: input.inspectionTypeId,
            date_time: input.dateTime,
            gps_latitude: input.gpsLatitude,
            gps_longitude: input.gpsLongitude,
            user_id: input.userId,
            client_id: input.clientId,
            observation_id: observationId,
        })
        .select("id")
        .single();
    if (insErr) throw insErr;

    const inspectionId = inserted.id;

    if (input.activityIds.length) {
        const { error: aErr } = await supabase
            .from("inspection_activities")
            .insert(
                input.activityIds.map((aid) => ({
                    inspection_id: inspectionId,
                    activity_id: aid,
                })),
            );
        if (aErr) throw aErr;
    }

    const subIds = await ensureSubcontracts(input.subcontrateNames);
    if (subIds.length) {
        const { error: sErr } = await supabase
            .from("inspection_subcontracts")
            .insert(
                subIds.map((sid) => ({
                    inspection_id: inspectionId,
                    subcontrate_name_id: sid,
                })),
            );
        if (sErr) throw sErr;
    }

    return {
        createInspection: { inspection: { id: inspectionId }, errors: NO_ERRORS },
    };
}

export async function updateInspection(
    vars: { id: string } & InspectionInput,
): Promise<{ updateInspection: { inspection: { id: string }; errors: NO_ERRORS } }> {
    const { id, ...input } = vars;

    // Cargar la observation actual para posiblemente reusarla/borrarla
    const { data: current, error: curErr } = await supabase
        .from("inspections")
        .select("observation_id")
        .eq("id", id)
        .single();
    if (curErr) throw curErr;

    const observationId = await upsertObservationWithPhotos(
        current.observation_id,
        input.observationText,
        input.photos,
    );

    const { error: upErr } = await supabase
        .from("inspections")
        .update({
            project_code: input.projectCode,
            instalation_name: input.instalationName,
            inspection_type_id: input.inspectionTypeId,
            date_time: input.dateTime,
            gps_latitude: input.gpsLatitude,
            gps_longitude: input.gpsLongitude,
            user_id: input.userId,
            client_id: input.clientId,
            observation_id: observationId,
        })
        .eq("id", id);
    if (upErr) throw upErr;

    // Reemplazar M2Ms (delete + insert)
    await supabase.from("inspection_activities").delete().eq("inspection_id", id);
    if (input.activityIds.length) {
        const { error: aErr } = await supabase
            .from("inspection_activities")
            .insert(
                input.activityIds.map((aid) => ({
                    inspection_id: id,
                    activity_id: aid,
                })),
            );
        if (aErr) throw aErr;
    }

    await supabase.from("inspection_subcontracts").delete().eq("inspection_id", id);
    const subIds = await ensureSubcontracts(input.subcontrateNames);
    if (subIds.length) {
        const { error: sErr } = await supabase
            .from("inspection_subcontracts")
            .insert(
                subIds.map((sid) => ({
                    inspection_id: id,
                    subcontrate_name_id: sid,
                })),
            );
        if (sErr) throw sErr;
    }

    return {
        updateInspection: { inspection: { id }, errors: NO_ERRORS },
    };
}

export async function deleteInspection(vars: {
    id: string;
}): Promise<{ deleteInspection: { success: boolean; errors: NO_ERRORS } }> {
    const { error } = await supabase.from("inspections").delete().eq("id", vars.id);
    if (error) throw error;
    return { deleteInspection: { success: true, errors: NO_ERRORS } };
}
