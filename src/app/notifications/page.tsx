"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NotificationCategory, NotificationNode } from "@/graphql/notifications";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Settings,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent } from "react";

type FilterKey = "all" | NotificationCategory;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "inspections", label: "Inspecciones" },
  { key: "team", label: "Equipo" },
  { key: "system", label: "Sistema" },
  { key: "critical", label: "Críticas" },
];

function iconFor(n: NotificationNode) {
  const props = { size: 17 };
  switch (n.type) {
    case "INSPECTION_CREATED":
      return <FileText {...props} />;
    case "INSPECTION_COMPLETED":
      return <CheckCircle2 {...props} />;
    case "INSPECTION_PENDING":
      return <Clock {...props} />;
    case "RANKING_CHANGED":
      return n.tone === "warn" ? (
        <TrendingDown {...props} />
      ) : (
        <TrendingUp {...props} />
      );
    case "REPORT_READY":
      return <FileText {...props} />;
    default:
      return <Bell {...props} />;
  }
}

const TONE_BG: Record<NotificationNode["tone"], string> = {
  bad: "bg-grad-brand text-white",
  warn: "bg-[rgba(232,163,61,0.16)] text-[#9C6B19] dark:bg-[rgba(232,163,61,0.20)] dark:text-[#E8A33D]",
  ok: "bg-[rgba(47,158,106,0.14)] text-[#1F7A50] dark:bg-[rgba(47,158,106,0.20)] dark:text-[#2F9E6A]",
  info: "bg-[rgba(58,116,233,0.12)] text-[#1B4FB8] dark:bg-[rgba(58,116,233,0.20)] dark:text-[#7AA3F2]",
  neutral:
    "bg-bg-2 text-ink-2 dark:bg-white/[0.06] dark:text-dark-ink-2",
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "ahora";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `hace ${diffD} d`;
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

function dayGroupKey(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diffDays = Math.round(
    (startOfDay(today).getTime() - startOfDay(d).getTime()) / 86_400_000,
  );
  if (diffDays <= 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return "Esta semana";
  if (diffDays < 30) return "Este mes";
  return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

export default function NotificationsPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");

  const {
    notifications,
    unread,
    loading,
    markAsRead,
    markAllAsRead,
    dismiss,
  } = useNotifications();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  const filtered = useMemo(() => {
    if (filter === "all") return notifications;
    return notifications.filter((n) => n.category === filter);
  }, [filter, notifications]);

  const groups = useMemo(() => {
    const map = new Map<string, NotificationNode[]>();
    for (const n of filtered) {
      const key = dayGroupKey(n.createdAt);
      const arr = map.get(key) ?? [];
      arr.push(n);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const handleItemClick = async (n: NotificationNode) => {
    if (!n.isRead) {
      try {
        await markAsRead(n.id);
      } catch {
        // noop — the link still works
      }
    }
  };

  const handleDismiss =
    (n: NotificationNode) =>
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await dismiss(n.id);
      } catch {
        // noop
      }
    };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-2 dark:text-dark-ink-2">
        <Loader2 size={18} className="mr-2 animate-spin" /> Cargando…
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      <div className="mx-auto max-w-[820px] px-3 pb-16 pt-5 sm:px-8 sm:pt-8">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
              Bandeja
            </div>
            <h1 className="m-0 mt-1.5 text-3xl font-extrabold tracking-tighter sm:text-[34px]">
              Notificaciones
            </h1>
            <p className="m-0 mt-1.5 text-sm text-ink-2 dark:text-dark-ink-2">
              {unread > 0
                ? `${unread} sin leer · ${notifications.length} total`
                : `Todo al día · ${notifications.length} total`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<Settings size={13} />}
              onClick={() => router.push("/settings")}
            >
              Preferencias
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<CheckCheck size={13} />}
              onClick={() => markAllAsRead()}
              disabled={unread === 0}
            >
              Marcar todo como leído
            </Button>
          </div>
        </header>

        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = f.key === filter;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-grad-brand text-white border-0"
                    : "border border-hairline bg-bg-2 text-ink-2 hover:brightness-95 " +
                        "dark:border-hairline-dark dark:bg-white/[0.04] dark:text-dark-ink-2",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {loading && notifications.length === 0 ? (
          <Card radius={20}>
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-2 dark:text-dark-ink-2">
              <Loader2 size={16} className="animate-spin" /> Cargando
              notificaciones…
            </div>
          </Card>
        ) : filtered.length === 0 ? (
          <Card radius={20}>
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-bg-2 text-ink-2 dark:bg-white/[0.05] dark:text-dark-ink-2">
                <Bell size={24} />
              </div>
              <div className="text-base font-semibold">
                {filter === "all"
                  ? "No tienes notificaciones"
                  : "Sin notificaciones en esta categoría"}
              </div>
              <p className="m-0 max-w-[420px] text-[13px] leading-relaxed text-ink-2 dark:text-dark-ink-2">
                Cuando ocurra algo relevante en tus inspecciones o tu
                cumplimiento cambie, te avisaremos aquí.
              </p>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map(([day, items]) => (
              <div key={day}>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-ink-2 dark:text-dark-ink-2">
                  {day}
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((n) => {
                    const inner = (
                      <Card
                        radius={16}
                        padding={16}
                        className={cn(
                          "transition-colors hover:brightness-[1.02]",
                          !n.isRead &&
                            "border-primary-500/40 dark:border-primary-500/40",
                        )}
                      >
                        <div className="flex gap-3">
                          <div
                            className={cn(
                              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]",
                              TONE_BG[n.tone],
                            )}
                          >
                            {iconFor(n)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">
                                  {n.title}
                                </span>
                                {!n.isRead && (
                                  <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-xs text-ink-2 dark:text-dark-ink-2">
                                  {timeAgo(n.createdAt)}
                                </span>
                                <button
                                  type="button"
                                  onClick={handleDismiss(n)}
                                  aria-label="Descartar notificación"
                                  className={cn(
                                    "inline-flex h-6 w-6 items-center justify-center rounded-full",
                                    "text-ink-2 hover:bg-bg-2 hover:text-ink",
                                    "dark:text-dark-ink-2 dark:hover:bg-white/[0.06] dark:hover:text-dark-ink",
                                  )}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                            {n.body && (
                              <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-ink-2 dark:text-dark-ink-2">
                                {n.body}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    );

                    if (n.actionUrl) {
                      return (
                        <Link
                          key={n.id}
                          href={n.actionUrl}
                          onClick={() => handleItemClick(n)}
                          className="block focus:outline-none"
                        >
                          {inner}
                        </Link>
                      );
                    }
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleItemClick(n)}
                        className="block w-full text-left focus:outline-none"
                      >
                        {inner}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
