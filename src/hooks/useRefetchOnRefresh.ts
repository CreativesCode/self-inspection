import { useEffect, useRef } from "react";
import { useRefreshStore } from "@/store";

/**
 * Suscribe una lista al `tick` del [[refreshStore]]. Cuando otra parte
 * de la app llama a `bump()` tras un create/update/delete exitoso,
 * esta lista vuelve a pedir sus datos sin que el usuario tenga que F5.
 *
 * No dispara en el mount inicial: `useSupabaseQuery` ya hace fetch al
 * montar, así que sólo refetcheamos cuando el tick efectivamente cambia.
 */
export function useRefetchOnRefresh(refetch: () => void | Promise<void>) {
  const tick = useRefreshStore((s) => s.tick);
  const lastTickRef = useRef(tick);

  useEffect(() => {
    if (lastTickRef.current !== tick) {
      lastTickRef.current = tick;
      void refetch();
    }
  }, [tick, refetch]);
}
