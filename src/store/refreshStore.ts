import { create } from "zustand";

interface RefreshState {
  tick: number;
  bump: () => void;
}

/**
 * Señal global de "datos sucios". Cualquier create/update/delete llama a
 * `bump()` tras completarse con éxito. Las listas se suscriben a `tick`
 * y disparan `refetch()` cuando cambia, de modo que al volver a la lista
 * (o si ya está montada) se ven los cambios sin necesidad de F5.
 *
 * Reemplaza el patrón Apollo `refetchQueries` (que es no-op en el compat
 * layer Supabase, ver `src/lib/apollo-compat.ts`).
 */
export const useRefreshStore = create<RefreshState>((set) => ({
  tick: 0,
  bump: () => set((s) => ({ tick: s.tick + 1 })),
}));
