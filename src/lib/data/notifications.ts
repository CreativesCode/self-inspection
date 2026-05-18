import { NO_ERRORS, type AppErrList } from "@/lib/data/types";
/**
 * Servicios Supabase para notificaciones.
 *
 * Soporta también realtime: el hook `useNotifications` se suscribe a
 * cambios en la tabla `notifications` para el usuario actual y refresca.
 */
import { supabase } from "@/lib/supabase";

export type NotificationTone = "ok" | "warn" | "bad" | "info" | "neutral";
export type NotificationCategory =
    | "inspections"
    | "team"
    | "system"
    | "critical";
export type NotificationKind =
    | "INSPECTION_CREATED"
    | "INSPECTION_COMPLETED"
    | "INSPECTION_PENDING"
    | "RANKING_CHANGED"
    | "REPORT_READY";

export interface NotificationNode {
    id: string;
    type: NotificationKind;
    tone: NotificationTone;
    category: NotificationCategory;
    title: string;
    body: string;
    actionUrl: string;
    actionLabel: string;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
    inspection: {
        id: string;
        projectCode: string;
        instalationName: string;
    } | null;
    reportJob: {
        id: string;
        status: string;
        downloadUrl: string | null;
    } | null;
}

interface Connection<T> {
    totalCount: number;
    edges: Array<{ node: T }>;
}

interface RawNotificationRow {
    id: string;
    type: string;
    tone: string;
    category: string;
    title: string;
    body: string;
    action_url: string;
    action_label: string;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    inspection:
        | {
              id: string;
              project_code: string;
              instalation_name: string;
          }
        | null;
    report_job:
        | {
              id: string;
              status: string;
              download_url: string | null;
          }
        | null;
}

function mapNotification(r: RawNotificationRow): NotificationNode {
    return {
        id: r.id,
        type: r.type.toUpperCase() as NotificationKind,
        tone: r.tone as NotificationTone,
        category: r.category as NotificationCategory,
        title: r.title,
        body: r.body,
        actionUrl: r.action_url,
        actionLabel: r.action_label,
        isRead: r.is_read,
        readAt: r.read_at,
        createdAt: r.created_at,
        inspection: r.inspection
            ? {
                  id: r.inspection.id,
                  projectCode: r.inspection.project_code,
                  instalationName: r.inspection.instalation_name,
              }
            : null,
        reportJob: r.report_job
            ? {
                  id: r.report_job.id,
                  status: (r.report_job.status ?? "").toUpperCase(),
                  downloadUrl: r.report_job.download_url,
              }
            : null,
    };
}

const SELECT = `
  id, type, tone, category, title, body, action_url, action_label,
  is_read, read_at, created_at,
  inspection:inspections(id, project_code, instalation_name),
  report_job:report_jobs(id, status, download_url)
`;

export async function getNotifications(vars: {
    first?: number;
    isRead?: boolean;
} = {}): Promise<{ notifications: Connection<NotificationNode> }> {
    const first = vars.first ?? 50;
    let q = supabase
        .from("notifications")
        .select(SELECT, { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(first);
    if (vars.isRead !== undefined) q = q.eq("is_read", vars.isRead);
    const { data, error, count } = await q;
    if (error) throw error;
    return {
        notifications: {
            totalCount: count ?? 0,
            edges: ((data ?? []) as unknown as RawNotificationRow[]).map((r) => ({
                node: mapNotification(r),
            })),
        },
    };
}

export async function getUnreadNotificationsCount(): Promise<{
    unreadNotificationsCount: number;
}> {
    const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
    if (error) throw error;
    return { unreadNotificationsCount: count ?? 0 };
}

export async function markNotificationRead(vars: {
    id: string;
}): Promise<{
    markNotificationRead: {
        notification: { id: string; isRead: boolean; readAt: string | null };
        errors: AppErrList;
    };
}> {
    const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", vars.id)
        .select("id, is_read, read_at")
        .single();
    if (error) throw error;
    return {
        markNotificationRead: {
            notification: {
                id: data.id,
                isRead: data.is_read,
                readAt: data.read_at,
            },
            errors: NO_ERRORS,
        },
    };
}

export async function markAllNotificationsRead(): Promise<{
    markAllNotificationsRead: { count: number; errors: NO_ERRORS };
}> {
    const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("is_read", false)
        .select("id");
    if (error) throw error;
    return {
        markAllNotificationsRead: {
            count: data?.length ?? 0,
            errors: NO_ERRORS,
        },
    };
}

export async function dismissNotification(vars: {
    id: string;
}): Promise<{ dismissNotification: { success: boolean; errors: NO_ERRORS } }> {
    const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", vars.id);
    if (error) throw error;
    return { dismissNotification: { success: true, errors: NO_ERRORS } };
}
