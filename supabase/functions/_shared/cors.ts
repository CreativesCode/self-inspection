/**
 * Headers CORS reutilizables para las Edge Functions invocadas desde el
 * frontend (Next.js dev server, builds estáticos, Capacitor mobile).
 *
 * Permitimos cualquier origen porque la autenticación va por JWT — ningún
 * navegador puede invocar la función sin un access_token válido.
 */
export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function preflight(req: Request): Response | null {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }
    return null;
}

export function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}
