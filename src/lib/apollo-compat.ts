/**
 * Compat layer que reemplaza `@apollo/client` con la misma API
 * (`useQuery`, `useMutation`, `useLazyQuery`, `gql`).
 *
 * En el modelo Supabase, las "queries" y "mutations" son **funciones**
 * `(vars) => Promise<data>` definidas en `src/lib/data/*` y reexportadas
 * desde `src/graphql/*` con los nombres que las pantallas ya usan
 * (`GetInspections`, `CreateInspection`, etc.).
 *
 * Este módulo es lo que cada archivo importa cuando antes hacía
 * `from "@apollo/client"`. Find-replace mecánico:
 *     `@apollo/client` → `@/lib/apollo-compat`
 *
 * No hay backend GraphQL ni cliente Apollo en ningún punto.
 */
import { useCallback, useRef } from "react";
import {
    useSupabaseQuery,
    useSupabaseMutation,
    useSupabaseLazyQuery,
} from "@/lib/data/hooks";


// ---------------------------------------------------------------------
// useQuery — recibe la función directamente, con opciones similares a Apollo
// ---------------------------------------------------------------------

interface UseQueryOptions<TVars> {
    variables?: TVars;
    skip?: boolean;
    fetchPolicy?: string; // ignorado (Supabase no tiene caché Apollo)
    notifyOnNetworkStatusChange?: boolean; // ignorado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCompleted?: (data: any) => void;
    pollInterval?: number; // ignorado
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useQuery<TData = any, TVars = any>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetcher: (...args: any[]) => Promise<any>,
    options: UseQueryOptions<TVars> = {},
) {
    return useSupabaseQuery<TData, TVars>(
        fetcher as (vars: TVars) => Promise<TData>,
        {
            variables: options.variables,
            skip: options.skip,
            onCompleted: options.onCompleted,
        },
    );
}

// ---------------------------------------------------------------------
// useMutation — devuelve [mutate, state]. `mutate({ variables })` ejecuta.
// ---------------------------------------------------------------------

interface UseMutationOptions {
    /** Callbacks compatibles con Apollo. La invalidación de cache la
     *  reemplazamos con un `refetch()` manual desde la página. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCompleted?: (data: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError?: (error: any) => void;
    /** `update`/`refetchQueries`/etc. son no-ops aquí. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update?: (...args: any[]) => void;
    refetchQueries?: unknown[];
    awaitRefetchQueries?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useMutation<TData = any, TVars = any>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutator: (...args: any[]) => Promise<any>,
    options: UseMutationOptions = {},
) {
    const [run, state] = useSupabaseMutation<TData, TVars>(
        mutator as (vars: TVars) => Promise<TData>,
    );

    // Apollo expone un `mutate` con **referencia estable** entre renders.
    // Si devolvemos un closure fresco cada render, los consumers que lo meten
    // en deps de useEffect/useCallback re-ejecutan el efecto en cada render
    // (lo que provoca, p.ej., que `loadAnswers` re-corra y pise el estado del
    // usuario en QuestionsPageClient).
    const optionsRef = useRef(options);
    optionsRef.current = options;

    // Adaptamos run para aceptar el shape Apollo: `mutate({ variables })`.
    // Apollo también acepta `mutate(variables)` directo y `mutate()` sin args.
    const mutate = useCallback(
        async (
            args?:
                | { variables?: TVars; [key: string]: unknown }
                | TVars
                | undefined,
        ) => {
            const isApolloShape =
                args !== null &&
                typeof args === "object" &&
                "variables" in (args as Record<string, unknown>);
            const vars = isApolloShape
                ? ((args as { variables?: TVars }).variables as TVars)
                : (args as TVars);
            const result = await run(vars);
            const opts = optionsRef.current;
            if (!result.error && opts.onCompleted) {
                opts.onCompleted(result.data);
            } else if (result.error && opts.onError) {
                opts.onError(result.error);
            }
            return result;
        },
        [run],
    );

    return [mutate, state] as [typeof mutate, typeof state];
}

// ---------------------------------------------------------------------
// useLazyQuery — `[run, state]` con `run({ variables })` o `run(variables)`.
// ---------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useLazyQuery<TData = any, TVars = any>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetcher: (...args: any[]) => Promise<any>,
    options: UseQueryOptions<TVars> = {},
) {
    void options.fetchPolicy;
    const [run, state] = useSupabaseLazyQuery<TData, TVars>(
        fetcher as (vars: TVars) => Promise<TData>,
    );
    // Referencia estable — ver explicación en useMutation arriba.
    const wrapped = useCallback(
        async (
            args?:
                | { variables?: TVars; [key: string]: unknown }
                | TVars
                | undefined,
        ) => {
            const isApolloShape =
                args !== null &&
                typeof args === "object" &&
                "variables" in (args as Record<string, unknown>);
            const vars = isApolloShape
                ? ((args as { variables?: TVars }).variables as TVars)
                : (args as TVars);
            return run(vars);
        },
        [run],
    );
    return [wrapped, state] as [typeof wrapped, typeof state];
}

// ---------------------------------------------------------------------
// gql — no-op. Los `src/graphql/*` ya no devuelven strings GraphQL.
// Cuando algún módulo legacy invoca `gql` por reflejo, retornamos
// el primer argumento sin tocar.
// ---------------------------------------------------------------------

export function gql<T = unknown>(strings: TemplateStringsArray, ...values: unknown[]): T {
    void strings;
    void values;
    return undefined as unknown as T;
}

// ---------------------------------------------------------------------
// Tipos compat (mínimos)
// ---------------------------------------------------------------------

/**
 * Stub de `ApolloError`. Apollo distinguía entre `graphQLErrors` y
 * `networkError`; en Supabase todos los errores se propagan como
 * `Error` plain. Mantenemos las propiedades como undefined/empty para
 * que el código de manejo legacy compile sin tocar.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApolloError extends Error {
    graphQLErrors?: Array<{ message: string }>;
    networkError?: Error | null;
}
export interface FetchResult<TData = unknown> {
    data?: TData;
    errors?: Error[];
}
export type Observable<T> = {
    subscribe: (observer: {
        next?: (value: T) => void;
        error?: (err: Error) => void;
        complete?: () => void;
    }) => void;
};

// `createHttpLink`, `setContext`, `onError`, `ApolloClient`, `InMemoryCache`
// solo los usaba el viejo `lib/apollo-client.ts`. Como ese archivo se elimina,
// no necesitamos esos exports.

// ---------------------------------------------------------------------
// useApolloClient — algunas pantallas lo importan para invocar resetStore()
// tras una mutation. En Supabase no hay caché global, así que devolvemos
// un stub con métodos no-op.
// ---------------------------------------------------------------------

export interface ApolloClient {
    resetStore: () => Promise<void>;
    clearStore: () => Promise<void>;
    refetchQueries: (...args: unknown[]) => Promise<unknown[]>;
}

const apolloClientStub: ApolloClient = {
    resetStore: async () => {},
    clearStore: async () => {},
    refetchQueries: async () => [],
};

export function useApolloClient(): ApolloClient {
    return apolloClientStub;
}

// ApolloProvider stub (algunos sitios podrían importarlo). Es un pass-through.
import type { ReactNode } from "react";
export function ApolloProvider({ children }: { children: ReactNode; client?: unknown }) {
    return children as unknown as JSX.Element;
}
