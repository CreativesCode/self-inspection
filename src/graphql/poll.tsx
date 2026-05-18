/**
 * Re-exports legacy de poll/answer/observation hacia los servicios Supabase.
 */
export {
    getPoll as GetPoll,
    getPolls as GetPolls,
    createPoll as CreatePoll,
    updatePoll as UpdatePoll,
    deletePoll as DeletePoll,
    createAnswer as CreateAnswer,
    updateAnswer as UpdateAnswer,
    deleteAnswer as DeleteAnswer,
    createObservation as CreateObservation,
    updateObservation as UpdateObservation,
    deleteObservation as DeleteObservation,
} from "@/lib/data/polls";

import { supabase } from "@/lib/supabase";

// Queries puntuales que estaban en el .gql legacy pero que solo se
// usan en sitios muy concretos. Se implementan inline para evitar
// crear más archivos.

export async function GetAnswer(vars: { id: string }) {
    const { data, error } = await supabase
        .from("answers")
        .select(
            "id, answer_text, question:questions(id), poll:polls(id), observation:observations(id, observation_text, photos:observation_photos(storage_path))",
        )
        .eq("id", vars.id)
        .maybeSingle();
    if (error) throw error;
    if (!data) return { answer: null };
    return {
        answer: {
            id: data.id,
            answerText: data.answer_text,
            question: data.question ?? { id: "" },
            poll: data.poll ?? { id: "" },
            observation: data.observation
                ? {
                      id: (data.observation as { id: string }).id,
                      observationText: (
                          data.observation as { observation_text: string | null }
                      ).observation_text,
                      photos: (
                          (data.observation as {
                              photos: Array<{ storage_path: string }>;
                          }).photos ?? []
                      ).map((p) => ({ photo: p.storage_path })),
                  }
                : null,
        },
    };
}

export async function GetAnswers(vars: { question?: string; poll?: string }) {
    let q = supabase
        .from("answers")
        .select(
            "id, answer_text, question:questions(id), poll:polls(id), observation:observations(id, observation_text, photos:observation_photos(storage_path))",
        );
    if (vars.question) q = q.eq("question_id", vars.question);
    if (vars.poll) q = q.eq("poll_id", vars.poll);
    const { data, error } = await q;
    if (error) throw error;
    return {
        answers: {
            edges: (data ?? []).map((r) => ({
                node: {
                    id: r.id,
                    answerText: r.answer_text,
                    question: r.question ?? { id: "" },
                    poll: r.poll ?? { id: "" },
                    observation: r.observation
                        ? {
                              id: (r.observation as { id: string }).id,
                              observationText: (
                                  r.observation as {
                                      observation_text: string | null;
                                  }
                              ).observation_text,
                              photos: (
                                  (r.observation as {
                                      photos: Array<{ storage_path: string }>;
                                  }).photos ?? []
                              ).map((p) => ({ photo: p.storage_path })),
                          }
                        : null,
                },
            })),
        },
    };
}

export async function GetObservation(vars: { id: string }) {
    const { data, error } = await supabase
        .from("observations")
        .select(
            "id, observation_text, photos:observation_photos(storage_path)",
        )
        .eq("id", vars.id)
        .maybeSingle();
    if (error) throw error;
    if (!data) return { observation: null };
    return {
        observation: {
            id: data.id,
            observationText: data.observation_text,
            photos: (data.photos ?? []).map(
                (p: { storage_path: string }) => ({ photo: p.storage_path }),
            ),
        },
    };
}

export async function GetObservations(vars: {
    inspectionId?: string;
    answerId?: string;
}) {
    void vars;
    // El backend Django tenía un endpoint custom; en Supabase, las
    // observations se fetchan ya embebidas en inspection/poll/answer.
    // Devolvemos vacío por compatibilidad — ninguna pantalla actual
    // depende de esto.
    return { observations: { edges: [] as Array<{ node: never }> } };
}
