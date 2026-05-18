"use client";

import { useMutation, useQuery } from "@/lib/apollo-compat";
import { useCallback, useEffect, useMemo } from "react";

import {
  DismissNotification,
  GetNotifications,
  GetUnreadNotificationsCount,
  MarkAllNotificationsRead,
  MarkNotificationRead,
  NotificationNode,
} from "@/graphql/notifications";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";

interface NotificationsQueryData {
  notifications: {
    totalCount: number;
    edges: { node: NotificationNode }[];
  };
}

interface UnreadCountQueryData {
  unreadNotificationsCount: number;
}

/**
 * Suscripción Realtime de Supabase a `public.notifications`. Cuando llega
 * un INSERT/UPDATE/DELETE sobre filas del usuario actual, ejecuta `onChange`.
 *
 * Devuelve un cleanup que desuscribe el canal.
 */
function subscribeToOwnNotifications(
  userId: string,
  onChange: () => void,
): () => void {
  // Nombre único por suscripción: Supabase cachea canales por nombre, así que
  // reutilizar `notifications:<uid>` entre hooks (o entre el doble-mount de
  // StrictMode) intenta añadir un `.on()` sobre un canal ya subscrito y lanza
  // "cannot add postgres_changes callbacks after subscribe()".
  const channelName = `notifications:${userId}:${Math.random()
    .toString(36)
    .slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `recipient_id=eq.${userId}`,
      },
      () => {
        onChange();
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function useNotifications({ first = 50 }: { first?: number } = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);

  const { data, loading, error, refetch } = useQuery<NotificationsQueryData>(
    GetNotifications,
    {
      variables: { first },
      fetchPolicy: "cache-and-network",
      skip: !isAuthenticated,
    },
  );

  // Realtime: en lugar de polling, reaccionamos cuando el servidor empuja
  // un cambio en notifications del usuario actual.
  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    const cleanup = subscribeToOwnNotifications(userId, () => {
      void refetch();
    });
    return cleanup;
  }, [isAuthenticated, userId, refetch]);

  const notifications = useMemo<NotificationNode[]>(
    () => data?.notifications.edges.map((e) => e.node) ?? [],
    [data],
  );

  const unread = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const refetchAfter = [
    { query: GetNotifications, variables: { first } },
    { query: GetUnreadNotificationsCount },
  ];

  const [markReadMutation] = useMutation(MarkNotificationRead, {
    refetchQueries: refetchAfter,
  });
  const [markAllReadMutation] = useMutation(MarkAllNotificationsRead, {
    refetchQueries: refetchAfter,
  });
  const [dismissMutation] = useMutation(DismissNotification, {
    refetchQueries: refetchAfter,
  });

  const markAsRead = useCallback(
    async (id: string) => {
      await markReadMutation({ variables: { id } });
      await refetch();
    },
    [markReadMutation, refetch],
  );

  const markAllAsRead = useCallback(async () => {
    await markAllReadMutation();
    await refetch();
  }, [markAllReadMutation, refetch]);

  const dismiss = useCallback(
    async (id: string) => {
      await dismissMutation({ variables: { id } });
      await refetch();
    },
    [dismissMutation, refetch],
  );

  return {
    notifications,
    unread,
    totalCount: data?.notifications.totalCount ?? 0,
    loading,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    dismiss,
  };
}

/**
 * Versión ligera para el badge en la campana. Solo trae el contador y se
 * actualiza por Realtime sin polling.
 */
export function useUnreadNotificationsCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const { data, refetch } = useQuery<UnreadCountQueryData>(
    GetUnreadNotificationsCount,
    {
      skip: !isAuthenticated,
      fetchPolicy: "cache-and-network",
    },
  );

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    const cleanup = subscribeToOwnNotifications(userId, () => {
      void refetch();
    });
    return cleanup;
  }, [isAuthenticated, userId, refetch]);

  return data?.unreadNotificationsCount ?? 0;
}
