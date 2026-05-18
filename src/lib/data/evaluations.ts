/**
 * Servicios Supabase para evaluations.
 *
 * `getEvaluationsSummary` reemplaza la query GraphQL `evaluationsSummaryByUser`
 * del backend Django. Hace fetch de evaluations + inspections + profiles y
 * agrupa/agrega en el cliente.
 *
 * Volumen actual (~5 evaluations, 12 usuarios, 9 inspecciones) hace que
 * agrupar en cliente sea trivial. Si crece, mover a una RPC Postgres.
 */
import { supabase } from "@/lib/supabase";

export interface EvaluationsSummaryUser {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        userType: string;
    };
    // Media de los porcentajes de las evaluaciones del usuario (escala 0–100).
    averageScore: number;
    // Máximo de la escala de averageScore (siempre 100 — los porcentajes son
    // 0–100). Lo expone el dashboard como "promedio X / Y" en el tooltip.
    averageMaxScore: number;
    // Nº de filas de evaluations agregadas para este usuario.
    totalEvaluations: number;
    // Nº de inspections distintas (una inspección puede tener varias
    // evaluations si se re-evalúa).
    totalInspections: number;
    overallPercentage: number;
    overallRating: string;
    minScore: number;
    maxScore: number;
    totalScoreSum: number;
    totalMaxScoreSum: number;
    evaluations: Array<{
        id: string;
        totalScore: number;
        maxPossibleScore: number;
        percentage: number;
        rating: string;
        inspection: {
            id: string;
            projectCode: string;
            instalationName: string;
            dateTime: string;
            client: { clientName: string } | null;
            activities: {
                edges: Array<{
                    node: { id: string; activityText: string };
                }>;
            };
            observation: { observationText: string } | null;
        };
    }>;
}

export interface EvaluationsSummary {
    users: EvaluationsSummaryUser[];
    totalInspections: number;
    inspectionsMonth1: number;
    inspectionsMonth2: number;
    inspectionsMonth3: number;
}

export interface GetEvaluationsVars {
    userId?: string;
    orderBy?: string;
    orderDirection?: string;
    limit?: number;
    projectCode?: string;
    installationName?: string;
    clientName?: string;
    activityName?: string;
    userEmail?: string;
    inspectionDateFrom?: string;
    inspectionDateTo?: string;
    minimumScore?: number;
    maximumScore?: number;
    percentageRange?: string;
    minimumPercentage?: number;
    maximumPercentage?: number;
    rating?: string;
    hasObservation?: boolean;
    subcontractor?: string;
    searchText?: string;
    evaluationCountMin?: number;
    gpsRadius?: string;
}

const ROLE_MAP: Record<string, string> = {
    administrador: "ADMINISTRADOR",
    jefe_de_obra: "JEFE_DE_OBRA",
    tecnico: "TECNICO",
    jefe_de_trabajo: "JEFE_DE_TRABAJO",
};

export async function getEvaluationsSummary(
    vars: GetEvaluationsVars = {},
): Promise<{ evaluationsSummaryByUser: EvaluationsSummary }> {
    // Cargamos todas las evaluations con su inspection y user (profile).
    // El dataset es pequeño hoy; el cliente filtra y agrupa.
    type Row = {
        id: string;
        percentage: number | string | null;
        total_score: number;
        max_possible_score: number;
        rating: string | null;
        created_at: string;
        inspection: {
            id: string;
            project_code: string;
            instalation_name: string;
            date_time: string;
            user_id: string;
            client: { client_name: string } | null;
            user: {
                id: string;
                first_name: string;
                last_name: string;
                user_type: string;
                email: string;
            } | null;
            activities: Array<{ activity: { activity_text: string } | null }>;
            subcontracts: Array<{
                subcontrate_name: { subcontrate_name: string } | null;
            }>;
            observation: { observation_text: string | null } | null;
        } | null;
    };

    const { data, error } = await supabase
        .from("evaluations")
        .select(
            `id, percentage, total_score, max_possible_score, rating, created_at,
            inspection:inspections(
                id, project_code, instalation_name, date_time, user_id,
                client:clients(client_name),
                user:profiles!inspections_user_id_fkey(id, first_name, last_name, user_type, email),
                activities:inspection_activities(activity:activities(activity_text)),
                subcontracts:inspection_subcontracts(subcontrate_name:subcontrate_names(subcontrate_name)),
                observation:observations(observation_text)
            )`,
        );
    if (error) throw error;

    let rows = ((data ?? []) as unknown as Row[]).filter((r) => !!r.inspection);

    // Filtros
    if (vars.userId) {
        rows = rows.filter((r) => r.inspection!.user_id === vars.userId);
    }
    if (vars.projectCode) {
        const needle = vars.projectCode.toLowerCase();
        rows = rows.filter((r) =>
            r.inspection!.project_code.toLowerCase().includes(needle),
        );
    }
    if (vars.installationName) {
        const needle = vars.installationName.toLowerCase();
        rows = rows.filter((r) =>
            r.inspection!.instalation_name.toLowerCase().includes(needle),
        );
    }
    if (vars.clientName) {
        const needle = vars.clientName.toLowerCase();
        rows = rows.filter((r) =>
            (r.inspection!.client?.client_name ?? "")
                .toLowerCase()
                .includes(needle),
        );
    }
    if (vars.userEmail) {
        const needle = vars.userEmail.toLowerCase();
        rows = rows.filter((r) =>
            (r.inspection!.user?.email ?? "").toLowerCase().includes(needle),
        );
    }
    if (vars.activityName) {
        const needle = vars.activityName.toLowerCase();
        rows = rows.filter((r) =>
            r.inspection!.activities.some((a) =>
                (a.activity?.activity_text ?? "").toLowerCase().includes(needle),
            ),
        );
    }
    if (vars.subcontractor) {
        const needle = vars.subcontractor.toLowerCase();
        rows = rows.filter((r) =>
            r.inspection!.subcontracts.some((s) =>
                (s.subcontrate_name?.subcontrate_name ?? "")
                    .toLowerCase()
                    .includes(needle),
            ),
        );
    }
    if (vars.searchText) {
        const needle = vars.searchText.toLowerCase();
        rows = rows.filter((r) => {
            const i = r.inspection!;
            return (
                i.project_code.toLowerCase().includes(needle) ||
                i.instalation_name.toLowerCase().includes(needle) ||
                (i.client?.client_name ?? "").toLowerCase().includes(needle) ||
                (i.user?.email ?? "").toLowerCase().includes(needle)
            );
        });
    }
    if (vars.inspectionDateFrom) {
        const from = new Date(vars.inspectionDateFrom).getTime();
        rows = rows.filter(
            (r) => new Date(r.inspection!.date_time).getTime() >= from,
        );
    }
    if (vars.inspectionDateTo) {
        const to = new Date(vars.inspectionDateTo).getTime();
        rows = rows.filter(
            (r) => new Date(r.inspection!.date_time).getTime() <= to,
        );
    }
    if (vars.minimumScore !== undefined) {
        rows = rows.filter((r) => r.total_score >= vars.minimumScore!);
    }
    if (vars.maximumScore !== undefined) {
        rows = rows.filter((r) => r.total_score <= vars.maximumScore!);
    }
    if (vars.minimumPercentage !== undefined) {
        rows = rows.filter(
            (r) => Number(r.percentage ?? 0) >= vars.minimumPercentage!,
        );
    }
    if (vars.maximumPercentage !== undefined) {
        rows = rows.filter(
            (r) => Number(r.percentage ?? 0) <= vars.maximumPercentage!,
        );
    }
    if (vars.rating) {
        rows = rows.filter((r) => (r.rating ?? "") === vars.rating);
    }
    if (vars.hasObservation !== undefined) {
        rows = rows.filter((r) =>
            vars.hasObservation
                ? !!(r.inspection!.observation?.observation_text ?? "").trim()
                : !(r.inspection!.observation?.observation_text ?? "").trim(),
        );
    }

    // Rating cualitativo derivado del porcentaje. Las páginas (Dashboard,
    // Detalle) esperan los valores en mayúsculas y mapean MALO → "bad".
    const ratingFromPercentage = (pct: number): string => {
        if (pct >= 95) return "EXCELENTE";
        if (pct >= 80) return "BUENO";
        if (pct >= 60) return "REGULAR";
        return "MALO";
    };

    // Agrupar por usuario
    type Slot = {
        user: EvaluationsSummaryUser["user"];
        pctSum: number;
        scoreSum: number;
        maxScoreSum: number;
        count: number;
        minPct: number;
        maxPct: number;
        inspectionIds: Set<string>;
        evaluations: EvaluationsSummaryUser["evaluations"];
    };
    const byUser = new Map<string, Slot>();
    for (const r of rows) {
        const u = r.inspection!.user;
        if (!u) continue;
        const key = u.id;
        const pct = Number(r.percentage ?? 0);
        const slot: Slot =
            byUser.get(key) ??
            {
                user: {
                    id: u.id,
                    email: u.email,
                    firstName: u.first_name,
                    lastName: u.last_name,
                    userType: ROLE_MAP[u.user_type] ?? u.user_type,
                },
                pctSum: 0,
                scoreSum: 0,
                maxScoreSum: 0,
                count: 0,
                minPct: Number.POSITIVE_INFINITY,
                maxPct: Number.NEGATIVE_INFINITY,
                inspectionIds: new Set<string>(),
                evaluations: [],
            };
        slot.pctSum += pct;
        slot.scoreSum += Number(r.total_score ?? 0);
        slot.maxScoreSum += Number(r.max_possible_score ?? 0);
        slot.count += 1;
        if (pct < slot.minPct) slot.minPct = pct;
        if (pct > slot.maxPct) slot.maxPct = pct;
        slot.inspectionIds.add(r.inspection!.id);
        slot.evaluations.push({
            id: r.id,
            totalScore: Number(r.total_score ?? 0),
            maxPossibleScore: Number(r.max_possible_score ?? 0),
            percentage: pct,
            rating: (r.rating ?? "").toString().toUpperCase(),
            inspection: {
                id: r.inspection!.id,
                projectCode: r.inspection!.project_code,
                instalationName: r.inspection!.instalation_name,
                dateTime: r.inspection!.date_time,
                client: r.inspection!.client
                    ? { clientName: r.inspection!.client.client_name }
                    : null,
                activities: {
                    edges: r.inspection!.activities
                        .filter((a) => !!a.activity)
                        .map((a, idx) => ({
                            node: {
                                id: `${r.inspection!.id}-act-${idx}`,
                                activityText: a.activity!.activity_text,
                            },
                        })),
                },
                observation: r.inspection!.observation?.observation_text
                    ? {
                          observationText:
                              r.inspection!.observation!.observation_text!,
                      }
                    : null,
            },
        });
        byUser.set(key, slot);
    }
    let users: EvaluationsSummaryUser[] = [...byUser.values()].map((s) => {
        const avgPct = s.count ? Math.round((s.pctSum / s.count) * 100) / 100 : 0;
        return {
            user: s.user,
            averageScore: avgPct,
            averageMaxScore: 100,
            totalEvaluations: s.count,
            totalInspections: s.inspectionIds.size,
            overallPercentage: avgPct,
            overallRating: s.count ? ratingFromPercentage(avgPct) : "",
            minScore: s.count ? Math.round(s.minPct * 100) / 100 : 0,
            maxScore: s.count ? Math.round(s.maxPct * 100) / 100 : 0,
            totalScoreSum: s.scoreSum,
            totalMaxScoreSum: s.maxScoreSum,
            evaluations: s.evaluations,
        };
    });

    // evaluationCountMin
    if (vars.evaluationCountMin !== undefined) {
        users = users.filter(
            (u) => u.totalInspections >= vars.evaluationCountMin!,
        );
    }

    // Orden
    const direction = (vars.orderDirection ?? "DESC").toUpperCase();
    const orderBy = vars.orderBy ?? "averageScore";
    users.sort((a, b) => {
        const va =
            orderBy === "totalInspections"
                ? a.totalInspections
                : a.averageScore;
        const vb =
            orderBy === "totalInspections"
                ? b.totalInspections
                : b.averageScore;
        return direction === "ASC" ? va - vb : vb - va;
    });

    if (vars.limit) users = users.slice(0, vars.limit);

    // Inspecciones por mes (últimos 3 meses) — opcional, lo dejamos en 0
    // por ahora; lo reactivamos si las pantallas lo usan en algún sitio.
    const now = new Date();
    const startOf = (offsetMonths: number) => {
        const d = new Date(now.getFullYear(), now.getMonth() - offsetMonths, 1);
        return d.getTime();
    };
    const endOf = (offsetMonths: number) => {
        const d = new Date(
            now.getFullYear(),
            now.getMonth() - offsetMonths + 1,
            1,
        );
        return d.getTime();
    };
    let m1 = 0,
        m2 = 0,
        m3 = 0;
    const totalInspectionIds = new Set<string>();
    for (const r of rows) {
        const t = new Date(r.inspection!.date_time).getTime();
        totalInspectionIds.add(r.inspection!.id);
        if (t >= startOf(0) && t < endOf(0)) m1++;
        else if (t >= startOf(1) && t < endOf(1)) m2++;
        else if (t >= startOf(2) && t < endOf(2)) m3++;
    }

    return {
        evaluationsSummaryByUser: {
            users,
            totalInspections: totalInspectionIds.size,
            inspectionsMonth1: m1,
            inspectionsMonth2: m2,
            inspectionsMonth3: m3,
        },
    };
}
