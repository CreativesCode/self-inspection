/**
 * Hooks genéricos para queries y mutations Supabase con shape similar a Apollo
 * (`{ loading, error, data, refetch }`) para minimizar el refactor de las
 * pantallas que antes usaban `@apollo/client`.
 */
import { useCallback, useEffect, useRef, useState } from "react";

type Fetcher<TVars, TData> = (vars: TVars) => Promise<TData>;

/**
 * Shape de error compatible con `ApolloError` para que el código que aún
 * accede a `error.graphQLErrors`/`error.networkError` compile sin tocar.
 * En Supabase estos campos quedan undefined — los errores se propagan
 * como mensajes simples.
 */
export interface QueryError extends Error {
    graphQLErrors?: Array<{ message: string }>;
    networkError?: Error | null;
}

interface QueryResult<TData> {
    loading: boolean;
    error: QueryError | null;
    data: TData | undefined;
    refetch: () => Promise<void>;
}

interface QueryOptions<TVars> {
    variables?: TVars;
    /** Si es false, no ejecuta la query hasta que cambie a true. */
    skip?: boolean;
    /** Se llama tras una ejecución exitosa. */
    onCompleted?: (data: unknown) => void;
}

/**
 * Hook similar a `useQuery` de Apollo. Recibe una función `fetcher(variables)`.
 *
 * - Re-ejecuta cuando cambian las `variables` (compara por JSON).
 * - `refetch()` permite forzar reload.
 * - `skip=true` evita la primera ejecución hasta que pase a false.
 */
export function useSupabaseQuery<TData, TVars = void>(
    fetcher: Fetcher<TVars, TData>,
    options: QueryOptions<TVars> = {},
): QueryResult<TData> {
    const { variables, skip = false, onCompleted } = options;

    const [data, setData] = useState<TData | undefined>(undefined);
    const [error, setError] = useState<QueryError | null>(null);
    const [loading, setLoading] = useState<boolean>(!skip);

    // Stringificamos variables para detectar cambios profundos
    const varsKey = JSON.stringify(variables ?? null);
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;
    const onCompletedRef = useRef(onCompleted);
    onCompletedRef.current = onCompleted;

    const run = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetcherRef.current(variables as TVars);
            setData(result);
            onCompletedRef.current?.(result);
        } catch (e) {
            setError(e instanceof Error ? (e as QueryError) : (new Error(String(e)) as QueryError));
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [varsKey]);

    useEffect(() => {
        if (skip) {
            setLoading(false);
            return;
        }
        void run();
    }, [run, skip]);

    return { loading, error, data, refetch: run };
}

// ---------------------------------------------------------------------
// useSupabaseMutation
// ---------------------------------------------------------------------

interface MutationResult<TData> {
    loading: boolean;
    error: QueryError | null;
    data: TData | undefined;
}

type MutationTuple<TData, TVars> = [
    mutate: (variables: TVars) => Promise<{ data?: TData; error?: QueryError }>,
    state: MutationResult<TData>,
];

/**
 * Hook similar a `useMutation` de Apollo. Tupla `[mutate, { loading, error, data }]`.
 *
 * `mutate(variables)` devuelve `{ data, error }` para que el código que antes
 * usaba `.then(({ data }) => ...)` siga funcionando.
 */
export function useSupabaseMutation<TData, TVars = void>(
    mutator: (variables: TVars) => Promise<TData>,
): MutationTuple<TData, TVars> {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<QueryError | null>(null);
    const [data, setData] = useState<TData | undefined>(undefined);

    const mutatorRef = useRef(mutator);
    mutatorRef.current = mutator;

    const mutate = useCallback(async (variables: TVars) => {
        setLoading(true);
        setError(null);
        try {
            const result = await mutatorRef.current(variables);
            setData(result);
            return { data: result };
        } catch (e) {
            const err = (
                e instanceof Error ? e : new Error(String(e))
            ) as QueryError;
            setError(err);
            return { error: err };
        } finally {
            setLoading(false);
        }
    }, []);

    return [mutate, { loading, error, data }];
}

// ---------------------------------------------------------------------
// useSupabaseLazyQuery
// ---------------------------------------------------------------------

type LazyQueryTuple<TData, TVars> = [
    run: (variables: TVars) => Promise<{ data?: TData; error?: Error }>,
    state: QueryResult<TData>,
];

/**
 * Similar a `useLazyQuery` de Apollo. Tupla `[run, state]` — `run(vars)` ejecuta
 * la query bajo demanda en lugar de en el primer render.
 */
export function useSupabaseLazyQuery<TData, TVars = void>(
    fetcher: Fetcher<TVars, TData>,
): LazyQueryTuple<TData, TVars> {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<QueryError | null>(null);
    const [data, setData] = useState<TData | undefined>(undefined);

    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const run = useCallback(async (variables: TVars) => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetcherRef.current(variables);
            setData(result);
            return { data: result };
        } catch (e) {
            const err = (
                e instanceof Error ? e : new Error(String(e))
            ) as QueryError;
            setError(err);
            return { error: err };
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(async () => {
        await run(undefined as TVars);
    }, [run]);

    return [run, { loading, error, data, refetch }];
}
