/**
 * Re-exports legacy: las "queries" y "mutations" GraphQL ya no existen.
 * Ahora cada export es la función Supabase equivalente, manteniendo el
 * mismo nombre para que las pantallas no requieran cambios.
 *
 * Las interfaces `UnifiedHeader`, `UnifiedPoll`, `UnifiedInspectionData`,
 * etc. se preservan porque varias pantallas las importan como tipos.
 */
export {
    getInspections as GetInspections,
    getInspection as GetInspection,
    createInspection as CreateInspection,
    updateInspection as UpdateInspection,
    deleteInspection as DeleteInspection,
} from "@/lib/data/inspections";

export {
    getInspectionTypes as GetInspectionTypes,
    getInspectionType as GetInspectionType,
    createInspectionType as CreateInspectionType,
    updateInspectionType as UpdateInspectionType,
    deleteInspectionType as DeleteInspectionType,
    getInspectionTypesWithActivities as GetInspectionTypesWithActivities,
    getInspectionTypesWithHeaders as GetInspectionTypesWithHeaders,
    getClients as GetClients,
    getClient as GetClient,
    createClient as CreateClient,
    updateClient as UpdateClient,
    deleteClient as DeleteClient,
    getActivities as GetActivities,
    getActivity as GetActivity,
    createActivity as CreateActivity,
    updateActivity as UpdateActivity,
    deleteActivity as DeleteActivity,
    getHeaders as GetHeaders,
    getHeader as GetHeader,
    createHeader as CreateHeader,
    updateHeader as UpdateHeader,
    deleteHeader as DeleteHeader,
    getQuestions as GetQuestions,
    getQuestion as GetQuestion,
    createQuestion as CreateQuestion,
    updateQuestion as UpdateQuestion,
    deleteQuestion as DeleteQuestion,
} from "@/lib/data/catalogs";

export { getEvaluationsSummary as GetEvaluations } from "@/lib/data/evaluations";

/**
 * Combinación inspection + headers/questions/polls que algunas pantallas
 * usan para renderizar el cuestionario. Hace los joins necesarios.
 */
import { getInspection } from "@/lib/data/inspections";
import { getHeaders } from "@/lib/data/catalogs";
import { getPolls } from "@/lib/data/polls";

export async function GetInspectionWithQuestions(vars: { id: string }) {
    const { inspection } = await getInspection(vars);
    if (!inspection) return { inspection: null };

    const inspectionTypeId = inspection.inspectionType.id;

    const { headers } = await getHeaders({
        inspectionType: inspectionTypeId,
        first: 500,
    });
    const { polls } = await getPolls({ inspection: vars.id });

    return {
        inspection: {
            ...inspection,
            headers,
            polls,
        },
    };
}

// =====================================================================
// Tipos UI legacy preservados
// =====================================================================

export interface UnifiedQuestion {
    id: string;
    questionText: string;
    header: {
        id: string;
        headerText: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface UnifiedHeader {
    id: string;
    headerText: string;
    createdAt: string;
    updatedAt: string;
    inspectionType: {
        id: string;
        name: string;
    };
    questions: UnifiedQuestion[];
}

export interface UnifiedPoll {
    id: string;
    status: string;
    answers: {
        edges: {
            node: {
                id: string;
                answerText: string;
                question: {
                    id: string;
                };
                observation: {
                    id: string;
                    observationText: string;
                    photos: {
                        photo: string;
                    }[];
                } | null;
            };
        }[];
    };
}

export interface UnifiedInspectionData {
    inspection: {
        id: string;
        projectCode: string;
        instalationName: string;
        inspectionType: {
            id: string;
            name: string;
        };
        dateTime: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        client: {
            id: string;
            clientName: string;
        };
        activities: {
            edges: {
                node: {
                    id: string;
                    activityText: string;
                };
            }[];
        };
        headers: {
            edges: {
                node: UnifiedHeader;
            }[];
        };
        polls: {
            edges: {
                node: UnifiedPoll;
            }[];
        };
    };
}

export interface UnifiedActivity {
    id: string;
    activityText: string;
    createdAt: string;
    updatedAt: string;
}

export interface UnifiedInspectionTypeWithActivities {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    activities: {
        edges: {
            node: UnifiedActivity;
        }[];
    };
}

export interface UnifiedInspectionTypesWithActivitiesData {
    inspectionTypes: {
        edges: {
            node: UnifiedInspectionTypeWithActivities;
        }[];
    };
}

export interface UnifiedInspectionTypeWithHeaders {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    headers: {
        edges: {
            node: UnifiedHeader;
        }[];
    };
}

export interface UnifiedInspectionTypesWithHeadersData {
    inspectionTypes: {
        edges: {
            node: UnifiedInspectionTypeWithHeaders;
        }[];
    };
}
