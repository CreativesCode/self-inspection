import { NO_ERRORS, type AppErrList } from "@/lib/data/types";
/**
 * Servicios Supabase para los catálogos:
 *   inspection_types, clients, activities, subcontrate_names,
 *   headers, questions.
 *
 * Devuelven shape Relay para encajar con las pantallas legacy.
 */
import { supabase } from "@/lib/supabase";

// =====================================================================
// Tipos UI (mantienen camelCase para compatibilidad con código existente)
// =====================================================================

export interface UIInspectionType {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface UIInspectionTypeWithActivities extends UIInspectionType {
    activities: {
        edges: Array<{
            node: {
                id: string;
                activityText: string;
                createdAt: string;
                updatedAt: string;
            };
        }>;
    };
}

export interface UIInspectionTypeWithHeaders extends UIInspectionType {
    headers: {
        edges: Array<{
            node: {
                id: string;
                headerText: string;
                createdAt: string;
                updatedAt: string;
            };
        }>;
    };
}

export interface UIClient {
    id: string;
    clientName: string;
    createdAt: string;
    updatedAt: string;
    inspectionSet?: {
        edges: Array<{ node: { id: string; projectCode: string; instalationName: string; dateTime: string } }>;
    };
}

export interface UIActivity {
    id: string;
    activityText: string;
    createdAt: string;
    updatedAt: string;
    inspectionType?: { id: string; name: string };
}

export interface UIHeader {
    id: string;
    headerText: string;
    createdAt: string;
    updatedAt: string;
    inspectionType?: { id: string; name: string };
    questions: Array<{
        id: string;
        questionText: string;
        header: { id: string; headerText: string };
        createdAt: string;
        updatedAt: string;
    }>;
}

export interface UIQuestion {
    id: string;
    questionText: string;
    header: { id: string; headerText: string };
    createdAt: string;
    updatedAt: string;
}

export interface UISubcontract {
    id: string;
    subcontrateName: string;
    createdAt: string;
    updatedAt: string;
}

interface Connection<T> {
    totalCount: number;
    edges: Array<{ node: T }>;
}

// =====================================================================
// INSPECTION TYPES
// =====================================================================

export async function getInspectionTypes(vars: {
    name_Icontains?: string;
} = {}): Promise<{ inspectionTypes: Connection<UIInspectionType> }> {
    let q = supabase
        .from("inspection_types")
        .select("id, name, created_at, updated_at", { count: "exact" });
    if (vars.name_Icontains)
        q = q.ilike("name", `%${vars.name_Icontains}%`);
    q = q.order("name");
    const { data, error, count } = await q;
    if (error) throw error;
    return {
        inspectionTypes: {
            totalCount: count ?? 0,
            edges: (data ?? []).map((r) => ({
                node: {
                    id: r.id,
                    name: r.name,
                    createdAt: r.created_at ?? "",
                    updatedAt: r.updated_at ?? "",
                },
            })),
        },
    };
}

export async function getInspectionType(vars: {
    id: string;
}): Promise<{ inspectionType: UIInspectionType | null }> {
    const { data, error } = await supabase
        .from("inspection_types")
        .select("id, name, created_at, updated_at")
        .eq("id", vars.id)
        .maybeSingle();
    if (error) throw error;
    return {
        inspectionType: data
            ? {
                  id: data.id,
                  name: data.name,
                  createdAt: data.created_at ?? "",
                  updatedAt: data.updated_at ?? "",
              }
            : null,
    };
}

export async function createInspectionType(vars: {
    name: string;
}): Promise<{ createInspectionType: { inspectionType: { id: string }; errors: NO_ERRORS } }> {
    const { data, error } = await supabase
        .from("inspection_types")
        .insert({ name: vars.name })
        .select("id")
        .single();
    if (error) throw error;
    return {
        createInspectionType: { inspectionType: { id: data.id }, errors: NO_ERRORS },
    };
}

export async function updateInspectionType(vars: {
    id: string;
    name: string;
}): Promise<{ updateInspectionType: { inspectionType: { id: string }; errors: NO_ERRORS } }> {
    const { error } = await supabase
        .from("inspection_types")
        .update({ name: vars.name })
        .eq("id", vars.id);
    if (error) throw error;
    return {
        updateInspectionType: { inspectionType: { id: vars.id }, errors: NO_ERRORS },
    };
}

export async function deleteInspectionType(vars: {
    id: string;
}): Promise<{ deleteInspectionType: { success: boolean; errors: NO_ERRORS } }> {
    const { error } = await supabase
        .from("inspection_types")
        .delete()
        .eq("id", vars.id);
    if (error) throw error;
    return { deleteInspectionType: { success: true, errors: NO_ERRORS } };
}

export async function getInspectionTypesWithActivities(): Promise<{
    inspectionTypes: Connection<UIInspectionTypeWithActivities>;
}> {
    const { data, error, count } = await supabase
        .from("inspection_types")
        .select(
            "id, name, created_at, updated_at, activities(id, activity_text, created_at, updated_at)",
            { count: "exact" },
        )
        .order("name");
    if (error) throw error;
    return {
        inspectionTypes: {
            totalCount: count ?? 0,
            edges: (data ?? []).map((r) => ({
                node: {
                    id: r.id,
                    name: r.name,
                    createdAt: r.created_at ?? "",
                    updatedAt: r.updated_at ?? "",
                    activities: {
                        edges: (r.activities ?? []).map(
                            (a: {
                                id: string;
                                activity_text: string;
                                created_at: string;
                                updated_at: string;
                            }) => ({
                                node: {
                                    id: a.id,
                                    activityText: a.activity_text,
                                    createdAt: a.created_at ?? "",
                                    updatedAt: a.updated_at ?? "",
                                },
                            }),
                        ),
                    },
                },
            })),
        },
    };
}

export async function getInspectionTypesWithHeaders(): Promise<{
    inspectionTypes: Connection<UIInspectionTypeWithHeaders>;
}> {
    const { data, error, count } = await supabase
        .from("inspection_types")
        .select(
            "id, name, created_at, updated_at, headers(id, header_text, sort_order, created_at, updated_at)",
            { count: "exact" },
        )
        .eq("headers.is_active", true)
        .order("name")
        .order("sort_order", { referencedTable: "headers" });
    if (error) throw error;
    return {
        inspectionTypes: {
            totalCount: count ?? 0,
            edges: (data ?? []).map((r) => ({
                node: {
                    id: r.id,
                    name: r.name,
                    createdAt: r.created_at ?? "",
                    updatedAt: r.updated_at ?? "",
                    headers: {
                        edges: (r.headers ?? []).map(
                            (h: {
                                id: string;
                                header_text: string;
                                created_at: string;
                                updated_at: string;
                            }) => ({
                                node: {
                                    id: h.id,
                                    headerText: h.header_text,
                                    createdAt: h.created_at ?? "",
                                    updatedAt: h.updated_at ?? "",
                                },
                            }),
                        ),
                    },
                },
            })),
        },
    };
}

// =====================================================================
// CLIENTS
// =====================================================================

export async function getClients(vars: {
    first?: number;
    pageOffset?: number;
    clientName_Icontains?: string;
} = {}): Promise<{ clients: Connection<UIClient> }> {
    const first = vars.first ?? 20;
    const offset = vars.pageOffset ?? 0;
    let q = supabase
        .from("clients")
        .select("id, client_name, created_at, updated_at", { count: "exact" });
    if (vars.clientName_Icontains)
        q = q.ilike("client_name", `%${vars.clientName_Icontains}%`);
    q = q.order("client_name").range(offset, offset + first - 1);
    const { data, error, count } = await q;
    if (error) throw error;
    return {
        clients: {
            totalCount: count ?? 0,
            edges: (data ?? []).map((r) => ({
                node: {
                    id: r.id,
                    clientName: r.client_name,
                    createdAt: r.created_at ?? "",
                    updatedAt: r.updated_at ?? "",
                },
            })),
        },
    };
}

export async function getClient(vars: {
    id: string;
}): Promise<{ client: UIClient | null }> {
    const { data, error } = await supabase
        .from("clients")
        .select(
            "id, client_name, created_at, updated_at, inspectionSet:inspections(id, project_code, instalation_name, date_time)",
        )
        .eq("id", vars.id)
        .maybeSingle();
    if (error) throw error;
    if (!data) return { client: null };
    return {
        client: {
            id: data.id,
            clientName: data.client_name,
            createdAt: data.created_at ?? "",
            updatedAt: data.updated_at ?? "",
            inspectionSet: {
                edges: (
                    data.inspectionSet as Array<{
                        id: string;
                        project_code: string;
                        instalation_name: string;
                        date_time: string;
                    }>
                ).map((i) => ({
                    node: {
                        id: i.id,
                        projectCode: i.project_code,
                        instalationName: i.instalation_name,
                        dateTime: i.date_time,
                    },
                })),
            },
        },
    };
}

export async function createClient(vars: {
    clientName: string;
}): Promise<{ createClient: { client: { id: string }; errors: NO_ERRORS } }> {
    const { data, error } = await supabase
        .from("clients")
        .insert({ client_name: vars.clientName })
        .select("id")
        .single();
    if (error) throw error;
    return { createClient: { client: { id: data.id }, errors: NO_ERRORS } };
}

export async function updateClient(vars: {
    id: string;
    clientName: string;
}): Promise<{ updateClient: { client: { id: string }; errors: NO_ERRORS } }> {
    const { error } = await supabase
        .from("clients")
        .update({ client_name: vars.clientName })
        .eq("id", vars.id);
    if (error) throw error;
    return { updateClient: { client: { id: vars.id }, errors: NO_ERRORS } };
}

export async function deleteClient(vars: {
    id: string;
}): Promise<{ deleteClient: { success: boolean; errors: NO_ERRORS } }> {
    const { error } = await supabase.from("clients").delete().eq("id", vars.id);
    if (error) throw error;
    return { deleteClient: { success: true, errors: NO_ERRORS } };
}

// =====================================================================
// ACTIVITIES
// =====================================================================

export async function getActivities(vars: {
    first?: number;
    pageOffset?: number;
    activityText_Icontains?: string;
    inspectionType?: string;
} = {}): Promise<{ activities: Connection<UIActivity> }> {
    const first = vars.first ?? 20;
    const offset = vars.pageOffset ?? 0;
    let q = supabase
        .from("activities")
        .select(
            "id, activity_text, created_at, updated_at, inspection_type:inspection_types(id, name)",
            { count: "exact" },
        );
    if (vars.activityText_Icontains)
        q = q.ilike("activity_text", `%${vars.activityText_Icontains}%`);
    if (vars.inspectionType)
        q = q.eq("inspection_type_id", vars.inspectionType);
    q = q.order("activity_text").range(offset, offset + first - 1);
    const { data, error, count } = await q;
    if (error) throw error;
    return {
        activities: {
            totalCount: count ?? 0,
            edges: (data ?? []).map((r) => ({
                node: {
                    id: r.id,
                    activityText: r.activity_text,
                    createdAt: r.created_at ?? "",
                    updatedAt: r.updated_at ?? "",
                    inspectionType: r.inspection_type
                        ? {
                              id: (r.inspection_type as { id: string; name: string }).id,
                              name: (r.inspection_type as { id: string; name: string }).name,
                          }
                        : undefined,
                },
            })),
        },
    };
}

export async function getActivity(vars: {
    id: string;
}): Promise<{ activity: UIActivity | null }> {
    const { data, error } = await supabase
        .from("activities")
        .select(
            "id, activity_text, created_at, updated_at, inspection_type:inspection_types(id, name)",
        )
        .eq("id", vars.id)
        .maybeSingle();
    if (error) throw error;
    if (!data) return { activity: null };
    return {
        activity: {
            id: data.id,
            activityText: data.activity_text,
            createdAt: data.created_at ?? "",
            updatedAt: data.updated_at ?? "",
            inspectionType: data.inspection_type
                ? {
                      id: (data.inspection_type as { id: string; name: string }).id,
                      name: (data.inspection_type as { id: string; name: string }).name,
                  }
                : undefined,
        },
    };
}

export async function createActivity(vars: {
    inspectionTypeId: string;
    activityText: string;
}): Promise<{ createActivity: { activity: { id: string }; errors: NO_ERRORS } }> {
    const { data, error } = await supabase
        .from("activities")
        .insert({
            inspection_type_id: vars.inspectionTypeId,
            activity_text: vars.activityText,
        })
        .select("id")
        .single();
    if (error) throw error;
    return { createActivity: { activity: { id: data.id }, errors: NO_ERRORS } };
}

export async function updateActivity(vars: {
    id: string;
    inspectionTypeId: string;
    activityText: string;
}): Promise<{ updateActivity: { activity: { id: string }; errors: NO_ERRORS } }> {
    const { error } = await supabase
        .from("activities")
        .update({
            inspection_type_id: vars.inspectionTypeId,
            activity_text: vars.activityText,
        })
        .eq("id", vars.id);
    if (error) throw error;
    return { updateActivity: { activity: { id: vars.id }, errors: NO_ERRORS } };
}

export async function deleteActivity(vars: {
    id: string;
}): Promise<{ deleteActivity: { success: boolean; errors: NO_ERRORS } }> {
    const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", vars.id);
    if (error) throw error;
    return { deleteActivity: { success: true, errors: NO_ERRORS } };
}

// =====================================================================
// HEADERS
// =====================================================================

export async function getHeaders(vars: {
    first?: number;
    offset?: number;
    inspectionType?: string;
} = {}): Promise<{ headers: Connection<UIHeader> }> {
    const first = vars.first ?? 50;
    const offset = vars.offset ?? 0;
    let q = supabase
        .from("headers")
        .select(
            "id, header_text, sort_order, created_at, updated_at, inspection_type:inspection_types(id, name), questions(id, question_text, sort_order, created_at, updated_at, header:headers(id, header_text))",
            { count: "exact" },
        )
        // Solo encabezados/preguntas activos (Rev02). Los desactivados quedan
        // en la BD para conservar el histórico, pero no forman parte de las
        // inspecciones nuevas.
        .eq("is_active", true)
        .eq("questions.is_active", true);
    if (vars.inspectionType) q = q.eq("inspection_type_id", vars.inspectionType);
    q = q
        .order("sort_order")
        .order("sort_order", { referencedTable: "questions" })
        .range(offset, offset + first - 1);
    const { data, error, count } = await q;
    if (error) throw error;
    return {
        headers: {
            totalCount: count ?? 0,
            edges: (data ?? []).map((r) => ({
                node: {
                    id: r.id,
                    headerText: r.header_text,
                    createdAt: r.created_at ?? "",
                    updatedAt: r.updated_at ?? "",
                    inspectionType: r.inspection_type
                        ? {
                              id: (r.inspection_type as { id: string; name: string }).id,
                              name: (r.inspection_type as { id: string; name: string }).name,
                          }
                        : undefined,
                    questions: (r.questions ?? []).map(
                        (q: {
                            id: string;
                            question_text: string;
                            created_at: string;
                            updated_at: string;
                            header: { id: string; header_text: string };
                        }) => ({
                            id: q.id,
                            questionText: q.question_text,
                            header: q.header
                                ? {
                                      id: q.header.id,
                                      headerText: q.header.header_text,
                                  }
                                : { id: r.id, headerText: r.header_text },
                            createdAt: q.created_at ?? "",
                            updatedAt: q.updated_at ?? "",
                        }),
                    ),
                },
            })),
        },
    };
}

export async function getHeader(vars: {
    id: string;
}): Promise<{ header: UIHeader | null }> {
    const { data, error } = await supabase
        .from("headers")
        .select(
            "id, header_text, created_at, updated_at, inspection_type:inspection_types(id, name), questions(id, question_text, created_at, updated_at)",
        )
        .eq("id", vars.id)
        .maybeSingle();
    if (error) throw error;
    if (!data) return { header: null };
    return {
        header: {
            id: data.id,
            headerText: data.header_text,
            createdAt: data.created_at ?? "",
            updatedAt: data.updated_at ?? "",
            inspectionType: data.inspection_type
                ? {
                      id: (data.inspection_type as { id: string; name: string }).id,
                      name: (data.inspection_type as { id: string; name: string }).name,
                  }
                : undefined,
            questions: (data.questions ?? []).map(
                (q: {
                    id: string;
                    question_text: string;
                    created_at: string;
                    updated_at: string;
                }) => ({
                    id: q.id,
                    questionText: q.question_text,
                    header: { id: data.id, headerText: data.header_text },
                    createdAt: q.created_at ?? "",
                    updatedAt: q.updated_at ?? "",
                }),
            ),
        },
    };
}

export async function createHeader(vars: {
    headerText: string;
    inspectionTypeId: string;
}): Promise<{ createHeader: { header: { id: string }; errors: NO_ERRORS } }> {
    // Coloca el nuevo encabezado al final del orden del tipo de inspección.
    const { data: last } = await supabase
        .from("headers")
        .select("sort_order")
        .eq("inspection_type_id", vars.inspectionTypeId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
    const nextOrder = (last?.sort_order ?? 0) + 1;
    const { data, error } = await supabase
        .from("headers")
        .insert({
            header_text: vars.headerText,
            inspection_type_id: vars.inspectionTypeId,
            sort_order: nextOrder,
        })
        .select("id")
        .single();
    if (error) throw error;
    return { createHeader: { header: { id: data.id }, errors: NO_ERRORS } };
}

export async function updateHeader(vars: {
    id: string;
    headerText: string;
    inspectionTypeId: string;
}): Promise<{ updateHeader: { header: { id: string }; errors: NO_ERRORS } }> {
    const { error } = await supabase
        .from("headers")
        .update({
            header_text: vars.headerText,
            inspection_type_id: vars.inspectionTypeId,
        })
        .eq("id", vars.id);
    if (error) throw error;
    return { updateHeader: { header: { id: vars.id }, errors: NO_ERRORS } };
}

export async function deleteHeader(vars: {
    id: string;
}): Promise<{ deleteHeader: { success: boolean; errors: NO_ERRORS } }> {
    const { error } = await supabase.from("headers").delete().eq("id", vars.id);
    if (error) throw error;
    return { deleteHeader: { success: true, errors: NO_ERRORS } };
}

// =====================================================================
// QUESTIONS
// =====================================================================

export async function getQuestions(vars: {
    first?: number;
    offset?: number;
    header?: string;
} = {}): Promise<{ questions: Connection<UIQuestion> }> {
    const first = vars.first ?? 50;
    const offset = vars.offset ?? 0;
    let q = supabase
        .from("questions")
        .select(
            "id, question_text, sort_order, created_at, updated_at, header:headers(id, header_text)",
            { count: "exact" },
        )
        // Solo preguntas activas (Rev02); las congeladas se mantienen para el
        // histórico pero no se listan en la administración de catálogos.
        .eq("is_active", true);
    if (vars.header) q = q.eq("header_id", vars.header);
    q = q
        .order("sort_order")
        .order("question_text")
        .range(offset, offset + first - 1);
    const { data, error, count } = await q;
    if (error) throw error;
    return {
        questions: {
            totalCount: count ?? 0,
            edges: (data ?? []).map((r) => ({
                node: {
                    id: r.id,
                    questionText: r.question_text,
                    createdAt: r.created_at ?? "",
                    updatedAt: r.updated_at ?? "",
                    header: r.header
                        ? {
                              id: (r.header as { id: string; header_text: string }).id,
                              headerText: (r.header as { id: string; header_text: string })
                                  .header_text,
                          }
                        : { id: "", headerText: "" },
                },
            })),
        },
    };
}

export async function getQuestion(vars: {
    id: string;
}): Promise<{ question: UIQuestion | null }> {
    const { data, error } = await supabase
        .from("questions")
        .select(
            "id, question_text, created_at, updated_at, header:headers(id, header_text)",
        )
        .eq("id", vars.id)
        .maybeSingle();
    if (error) throw error;
    if (!data) return { question: null };
    return {
        question: {
            id: data.id,
            questionText: data.question_text,
            createdAt: data.created_at ?? "",
            updatedAt: data.updated_at ?? "",
            header: data.header
                ? {
                      id: (data.header as { id: string; header_text: string }).id,
                      headerText: (data.header as { id: string; header_text: string })
                          .header_text,
                  }
                : { id: "", headerText: "" },
        },
    };
}

export async function createQuestion(vars: {
    questionText: string;
    headerId: string;
}): Promise<{ createQuestion: { question: { id: string }; errors: NO_ERRORS } }> {
    // Coloca la nueva pregunta al final del orden de su encabezado.
    const { data: last } = await supabase
        .from("questions")
        .select("sort_order")
        .eq("header_id", vars.headerId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
    const nextOrder = (last?.sort_order ?? 0) + 1;
    const { data, error } = await supabase
        .from("questions")
        .insert({
            question_text: vars.questionText,
            header_id: vars.headerId,
            sort_order: nextOrder,
        })
        .select("id")
        .single();
    if (error) throw error;
    return { createQuestion: { question: { id: data.id }, errors: NO_ERRORS } };
}

export async function updateQuestion(vars: {
    id: string;
    questionText: string;
    headerId: string;
}): Promise<{ updateQuestion: { question: { id: string } } }> {
    const { error } = await supabase
        .from("questions")
        .update({ question_text: vars.questionText, header_id: vars.headerId })
        .eq("id", vars.id);
    if (error) throw error;
    return { updateQuestion: { question: { id: vars.id } } };
}

export async function deleteQuestion(vars: {
    id: string;
}): Promise<{ deleteQuestion: { success: boolean } }> {
    const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", vars.id);
    if (error) throw error;
    return { deleteQuestion: { success: true } };
}
