/**
 * Tipos compartidos por la capa de servicios.
 *
 * `AppErr` reproduce el shape de los errors que devolvía Django/Graphene
 * (code, userMessage, developerMessage, etc.). Las funciones Supabase
 * lo devuelven siempre como `[]` vacío — los errores reales se propagan
 * con `throw`.
 */
/**
 * Misma shape que `GraphQLAppError` en `@/lib/error-service` para que las
 * pantallas que pasan `errors` a `processGraphQLErrors(...)` compilen sin
 * fricción. Valores obligatorios → string vacío si no aplica.
 */
export interface AppErr {
    code: string;
    userMessage: string;
    developerMessage?: string;
    detail?: string;
    path?: string;
    incidentId: string;
    timestamp: string;
    message?: string;
}

export type AppErrList = AppErr[];

/**
 * `NO_ERRORS` se usa tanto como **valor** (`return { errors: NO_ERRORS }`)
 * como **tipo** (`Promise<{ errors: NO_ERRORS }>`) en los servicios. TS
 * permite que un identificador represente ambos vía declaration merging.
 */
export type NO_ERRORS = AppErrList;
export const NO_ERRORS: AppErrList = [];
