/**
 * Re-exports legacy de notificaciones hacia los servicios Supabase.
 */
export {
    getNotifications as GetNotifications,
    getUnreadNotificationsCount as GetUnreadNotificationsCount,
    markNotificationRead as MarkNotificationRead,
    markAllNotificationsRead as MarkAllNotificationsRead,
    dismissNotification as DismissNotification,
} from "@/lib/data/notifications";

export type {
    NotificationTone,
    NotificationCategory,
    NotificationKind,
    NotificationNode,
} from "@/lib/data/notifications";
