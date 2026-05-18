import { NO_ERRORS, type AppErrList } from "@/lib/data/types";
/**
 * Servicios Supabase para polls, answers, observations, evaluations.
 */
import { supabase } from "@/lib/supabase";

// =====================================================================
// Tipos UI
// =====================================================================

export interface UIObservation {
    id: string;
    observationText: string | null;
    photos: Array<{ photo: string }>;
    /** Compat: el shape legacy permitía `photo` además de `photos`. Lo emulamos como string vacío para no romper consumers. */
    photo?: string;
}

export interface UIAnswer {
    id: string;
    answerText: string;
    question: { id: string };
    poll?: { id: string };
    observation: UIObservation | null;
}

export interface UIEvaluation {
    id: string;
    totalScore: number;
    maxPossibleScore: number;
    percentage: number;
    rating: string;
}

export interface UIPoll {
    id: string;
    status: string;
    evaluation: UIEvaluation | null;
    answers: { edges: Array<{ node: UIAnswer }> };
    question?: {
        edges: Array<{
            node: {
                id: string;
                questionText: string;
                header: { id: string; headerText: string };
                answer: { edges: Array<{ node: UIAnswer }> };
            };
        }>;
    };
}

interface Connection<T> {
    totalCount?: number;
    edges: Array<{ node: T }>;
}

// =====================================================================
// Helpers
// =====================================================================

const POLL_BASE_SELECT = `
  id, status,
  evaluation:evaluations(id, total_score, max_possible_score, percentage, rating),
  poll_questions(question:questions(id, question_text, header:headers(id, header_text))),
  answers(id, answer_text, question:questions(id), observation:observations(id, observation_text, photos:observation_photos(storage_path)))
`;

interface RawPollRow {
    id: string;
    status: string;
    evaluation:
        | {
              id: string;
              total_score: number;
              max_possible_score: number;
              percentage: number | string | null;
              rating: string | null;
          }
        | Array<{
              id: string;
              total_score: number;
              max_possible_score: number;
              percentage: number | string | null;
              rating: string | null;
          }>
        | null;
    poll_questions: Array<{
        question: {
            id: string;
            question_text: string;
            header: { id: string; header_text: string } | null;
        } | null;
    }>;
    answers: Array<{
        id: string;
        answer_text: string;
        question: { id: string } | null;
        observation: {
            id: string;
            observation_text: string | null;
            photos: Array<{ storage_path: string }>;
        } | null;
    }>;
}

function mapEvaluation(
    e: RawPollRow["evaluation"],
): UIEvaluation | null {
    if (!e) return null;
    const item = Array.isArray(e) ? e[0] : e;
    if (!item) return null;
    return {
        id: item.id,
        totalScore: item.total_score,
        maxPossibleScore: item.max_possible_score,
        percentage: item.percentage === null ? 0 : Number(item.percentage),
        rating: item.rating ?? "",
    };
}

function mapObservation(
    o: RawPollRow["answers"][number]["observation"],
): UIObservation | null {
    if (!o) return null;
    return {
        id: o.id,
        observationText: o.observation_text,
        photos: (o.photos ?? []).map((p) => ({ photo: p.storage_path })),
        photo: o.photos?.[0]?.storage_path ?? "",
    };
}

function mapAnswer(a: RawPollRow["answers"][number]): UIAnswer {
    return {
        id: a.id,
        answerText: a.answer_text,
        question: a.question ?? { id: "" },
        observation: mapObservation(a.observation),
    };
}

function mapPoll(r: RawPollRow): UIPoll {
    const answersByQuestion = new Map<string, UIAnswer>();
    for (const a of r.answers) {
        if (a.question?.id) answersByQuestion.set(a.question.id, mapAnswer(a));
    }

    return {
        id: r.id,
        // Uppercase para compat con la UI legacy ("COMPLETED" / "PENDING").
        status: (r.status ?? "").toUpperCase(),
        evaluation: mapEvaluation(r.evaluation),
        answers: {
            edges: r.answers.map((a) => ({ node: mapAnswer(a) })),
        },
        question: {
            edges: r.poll_questions
                .filter((pq) => pq.question)
                .map((pq) => {
                    const q = pq.question!;
                    const ans = answersByQuestion.get(q.id);
                    return {
                        node: {
                            id: q.id,
                            questionText: q.question_text,
                            header: q.header
                                ? {
                                      id: q.header.id,
                                      headerText: q.header.header_text,
                                  }
                                : { id: "", headerText: "" },
                            answer: {
                                edges: ans ? [{ node: ans }] : [],
                            },
                        },
                    };
                }),
        },
    };
}

// =====================================================================
// Queries
// =====================================================================

export async function getPoll(vars: {
    id: string;
}): Promise<{ poll: UIPoll | null }> {
    const { data, error } = await supabase
        .from("polls")
        .select(POLL_BASE_SELECT)
        .eq("id", vars.id)
        .maybeSingle();
    if (error) throw error;
    return { poll: data ? mapPoll(data as unknown as RawPollRow) : null };
}

export async function getPolls(vars: {
    poll_status?: string;
    inspection?: string;
} = {}): Promise<{ polls: Connection<UIPoll> }> {
    let q = supabase.from("polls").select(POLL_BASE_SELECT);
    if (vars.poll_status) q = q.eq("status", vars.poll_status.toLowerCase() as "pending" | "completed");
    if (vars.inspection) q = q.eq("inspection_id", vars.inspection);
    const { data, error } = await q;
    if (error) throw error;
    return {
        polls: {
            edges: ((data ?? []) as unknown as RawPollRow[]).map((r) => ({
                node: mapPoll(r),
            })),
        },
    };
}

// =====================================================================
// Mutations: poll
// =====================================================================

export async function createPoll(vars: {
    questionIds?: string[] | null;
    status: string;
    inspectionId: string;
}): Promise<{ createPoll: { poll: { id: string }; errors: NO_ERRORS } }> {
    const { data, error } = await supabase
        .from("polls")
        .insert({
            inspection_id: vars.inspectionId,
            status: vars.status.toLowerCase() as "pending" | "completed",
        })
        .select("id")
        .single();
    if (error) throw error;
    const pollId = data.id;
    if (vars.questionIds?.length) {
        const { error: pqErr } = await supabase
            .from("poll_questions")
            .insert(
                vars.questionIds.map((qid) => ({
                    poll_id: pollId,
                    question_id: qid,
                })),
            );
        if (pqErr) throw pqErr;
    }
    return { createPoll: { poll: { id: pollId }, errors: NO_ERRORS } };
}

export async function updatePoll(vars: {
    id: string;
    questionIds?: string[] | null;
    status?: string;
    inspectionId: string;
}): Promise<{ updatePoll: { poll: { id: string; status: string }; errors: NO_ERRORS } }> {
    const patch: { status?: "pending" | "completed"; inspection_id?: string } = {};
    if (vars.status) patch.status = vars.status.toLowerCase() as "pending" | "completed";
    if (vars.inspectionId) patch.inspection_id = vars.inspectionId;
    if (Object.keys(patch).length) {
        const { error } = await supabase
            .from("polls")
            .update(patch)
            .eq("id", vars.id);
        if (error) throw error;
    }
    if (vars.questionIds) {
        await supabase.from("poll_questions").delete().eq("poll_id", vars.id);
        if (vars.questionIds.length) {
            const { error: pqErr } = await supabase
                .from("poll_questions")
                .insert(
                    vars.questionIds.map((qid) => ({
                        poll_id: vars.id,
                        question_id: qid,
                    })),
                );
            if (pqErr) throw pqErr;
        }
    }
    const { data } = await supabase
        .from("polls")
        .select("status")
        .eq("id", vars.id)
        .single();
    return {
        updatePoll: {
            poll: { id: vars.id, status: (data?.status ?? "").toUpperCase() },
            errors: NO_ERRORS,
        },
    };
}

export async function deletePoll(vars: {
    id: string;
}): Promise<{ deletePoll: { success: boolean; errors: NO_ERRORS } }> {
    const { error } = await supabase.from("polls").delete().eq("id", vars.id);
    if (error) throw error;
    return { deletePoll: { success: true, errors: NO_ERRORS } };
}

// =====================================================================
// Mutations: answers (upsert con observation opcional)
// =====================================================================

async function upsertObservationForAnswer(
    observationId: string | null,
    observationText?: string | null,
    photos?: string[] | null,
): Promise<string | null> {
    const hasText = !!(observationText && observationText.trim());
    const hasPhotos = !!(photos && photos.length);
    if (!hasText && !hasPhotos && !observationId) return null;
    if (!hasText && !hasPhotos && observationId) {
        // Limpiar: borrar la observación previa
        await supabase.from("observations").delete().eq("id", observationId);
        return null;
    }
    if (observationId) {
        await supabase
            .from("observations")
            .update({ observation_text: observationText ?? null })
            .eq("id", observationId);
        await supabase
            .from("observation_photos")
            .delete()
            .eq("observation_id", observationId);
        if (hasPhotos) {
            await supabase.from("observation_photos").insert(
                photos!.map((p) => ({ observation_id: observationId, storage_path: p })),
            );
        }
        return observationId;
    }
    const { data: inserted, error } = await supabase
        .from("observations")
        .insert({ observation_text: observationText ?? null })
        .select("id")
        .single();
    if (error) throw error;
    if (hasPhotos) {
        await supabase.from("observation_photos").insert(
            photos!.map((p) => ({
                observation_id: inserted.id,
                storage_path: p,
            })),
        );
    }
    return inserted.id;
}

export async function createAnswer(vars: {
    answerText: string;
    questionId: string;
    pollId: string;
    observationText?: string | null;
    photos?: string[] | null;
}): Promise<{ createAnswer: { answer: { id: string }; errors: NO_ERRORS } }> {
    const observationId = await upsertObservationForAnswer(
        null,
        vars.observationText,
        vars.photos,
    );
    const { data, error } = await supabase
        .from("answers")
        .upsert(
            {
                poll_id: vars.pollId,
                question_id: vars.questionId,
                answer_text: vars.answerText.toLowerCase() as "good" | "regular" | "bad" | "not_applicable",
                observation_id: observationId,
            },
            { onConflict: "poll_id,question_id" },
        )
        .select("id")
        .single();
    if (error) throw error;
    return { createAnswer: { answer: { id: data.id }, errors: NO_ERRORS } };
}

export async function updateAnswer(vars: {
    id: string;
    answerText: string;
    questionId: string;
    pollId: string;
    observationText?: string | null;
    observationPhotos?: string[] | null;
}): Promise<{ updateAnswer: { answer: { id: string }; errors: NO_ERRORS } }> {
    const { data: current, error: curErr } = await supabase
        .from("answers")
        .select("observation_id")
        .eq("id", vars.id)
        .single();
    if (curErr) throw curErr;
    const observationId = await upsertObservationForAnswer(
        current.observation_id,
        vars.observationText,
        vars.observationPhotos,
    );
    const { error } = await supabase
        .from("answers")
        .update({
            answer_text: vars.answerText.toLowerCase() as "good" | "regular" | "bad" | "not_applicable",
            observation_id: observationId,
        })
        .eq("id", vars.id);
    if (error) throw error;
    return { updateAnswer: { answer: { id: vars.id }, errors: NO_ERRORS } };
}

export async function deleteAnswer(vars: {
    id: string;
}): Promise<{ deleteAnswer: { success: boolean; errors: NO_ERRORS } }> {
    const { error } = await supabase.from("answers").delete().eq("id", vars.id);
    if (error) throw error;
    return { deleteAnswer: { success: true, errors: NO_ERRORS } };
}

// =====================================================================
// Mutations: observations standalone (para Inspection.observation)
// =====================================================================

export async function createObservation(vars: {
    observationText?: string | null;
    photos?: string[] | null;
    inspectionId?: string | null;
    answerId?: string | null;
}): Promise<{ createObservation: { observation: { id: string }; errors: NO_ERRORS } }> {
    const { data, error } = await supabase
        .from("observations")
        .insert({ observation_text: vars.observationText ?? null })
        .select("id")
        .single();
    if (error) throw error;
    if (vars.photos?.length) {
        await supabase.from("observation_photos").insert(
            vars.photos.map((p) => ({
                observation_id: data.id,
                storage_path: p,
            })),
        );
    }
    if (vars.inspectionId) {
        await supabase
            .from("inspections")
            .update({ observation_id: data.id })
            .eq("id", vars.inspectionId);
    }
    if (vars.answerId) {
        await supabase
            .from("answers")
            .update({ observation_id: data.id })
            .eq("id", vars.answerId);
    }
    return {
        createObservation: { observation: { id: data.id }, errors: NO_ERRORS },
    };
}

export async function updateObservation(vars: {
    id: string;
    observationText?: string | null;
    photos?: string[] | null;
}): Promise<{ updateObservation: { observation: { id: string }; errors: NO_ERRORS } }> {
    const { error } = await supabase
        .from("observations")
        .update({ observation_text: vars.observationText ?? null })
        .eq("id", vars.id);
    if (error) throw error;
    await supabase
        .from("observation_photos")
        .delete()
        .eq("observation_id", vars.id);
    if (vars.photos?.length) {
        await supabase.from("observation_photos").insert(
            vars.photos.map((p) => ({
                observation_id: vars.id,
                storage_path: p,
            })),
        );
    }
    return { updateObservation: { observation: { id: vars.id }, errors: NO_ERRORS } };
}

export async function deleteObservation(vars: {
    id: string;
}): Promise<{ deleteObservation: { success: boolean; errors: NO_ERRORS } }> {
    const { error } = await supabase
        .from("observations")
        .delete()
        .eq("id", vars.id);
    if (error) throw error;
    return { deleteObservation: { success: true, errors: NO_ERRORS } };
}
