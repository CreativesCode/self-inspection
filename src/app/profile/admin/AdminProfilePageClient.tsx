"use client";

import {
  ProfileShell,
  type ProfileQuickAction,
  type ProfileStat,
  type ProfileSystemStatusRow,
  type ProfileTopUser,
} from "@/components/profile/ProfileShell";
import { GetUsers } from "@/graphql/auth";
import { GetEvaluations } from "@/graphql/inspections";
import { useAuthStore } from "@/store";
import { useQuery } from "@/lib/apollo-compat";
import {
  Activity,
  ClipboardList,
  FileText,
  ShieldCheck,
  Tags,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface UsersData {
  users: { totalCount: number };
}

interface EvaluationUser {
  id: string;
  firstName: string;
  lastName: string;
}

interface UserEvaluationSummary {
  user: EvaluationUser;
  averageScore: number;
  totalInspections: number;
}

interface EvaluationsData {
  evaluationsSummaryByUser: {
    users: UserEvaluationSummary[];
    totalInspections: number;
    inspectionsMonth1: number;
    inspectionsMonth2: number;
    inspectionsMonth3: number;
  };
}

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function getMonthNames() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthAtOffset = (offset: number) => {
    const d = new Date(currentYear, currentMonth - offset);
    const label = MONTHS_ES[d.getMonth()];
    return d.getFullYear() !== currentYear
      ? `${label} ${d.getFullYear()}`
      : label;
  };
  return {
    month1: monthAtOffset(1),
    month2: monthAtOffset(2),
    month3: monthAtOffset(3),
  };
}

export default function AdminProfilePageClient() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  const { data: usersData, loading: loadingUsers } =
    useQuery<UsersData>(GetUsers);
  const { data: evaluationsData, loading: loadingEvaluations } =
    useQuery<EvaluationsData>(GetEvaluations, {
      variables: {
        orderBy: "inspections",
        orderDirection: "desc",
        limit: 3,
      },
    });

  useEffect(() => {
    if (!isAuthenticated || (user && user.userType !== "ADMINISTRADOR")) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  if (!user || user.userType !== "ADMINISTRADOR") return null;

  const { month1, month2, month3 } = getMonthNames();
  const summary = evaluationsData?.evaluationsSummaryByUser;
  const totalInspections = summary?.totalInspections ?? 0;
  const totalUsers = usersData?.users?.totalCount ?? 0;
  const top3 = summary?.users?.slice(0, 3) ?? [];

  const stats: ProfileStat[] = [
    {
      label: "Inspecciones totales",
      value: totalInspections.toLocaleString("es-ES"),
      detail: `${summary?.inspectionsMonth1 ?? 0} en ${month1}`,
      tone: "brand",
      Icon: ClipboardList,
    },
    {
      label: "Usuarios activos",
      value: totalUsers,
      detail: "Equipo registrado en Safe 360",
      tone: "info",
      Icon: Users,
    },
    {
      label: "Top score equipo",
      value:
        top3.length > 0 ? (top3[0].averageScore ?? 0).toFixed(1) : "—",
      detail:
        top3.length > 0
          ? `${top3[0].user.firstName} ${top3[0].user.lastName}`
          : "Sin evaluaciones",
      tone: "ok",
      Icon: TrendingUp,
    },
  ];

  const quickActions: ProfileQuickAction[] = [
    { label: "Gestionar usuarios", href: "/admin/users", Icon: Users },
    { label: "Gestionar clientes", href: "/admin/clients", Icon: ShieldCheck },
    {
      label: "Tipos de inspección",
      href: "/admin/inspection-types",
      Icon: Tags,
    },
    { label: "Actividades", href: "/admin/activities", Icon: Activity },
    { label: "Encabezados", href: "/admin/headers", Icon: FileText },
    {
      label: "Ver inspecciones",
      href: "/inspections",
      Icon: ClipboardList,
    },
  ];

  const systemStatus: ProfileSystemStatusRow[] = [
    {
      label: "Usuarios activos",
      value: loadingUsers ? "…" : totalUsers.toString(),
      tone: "ok",
    },
    {
      label: "Inspecciones totales",
      value: loadingEvaluations ? "…" : totalInspections.toString(),
      tone: "ok",
    },
    {
      label: `Inspecciones · ${month1}`,
      value: (summary?.inspectionsMonth1 ?? 0).toString(),
      tone: "info",
    },
    {
      label: `Inspecciones · ${month2}`,
      value: (summary?.inspectionsMonth2 ?? 0).toString(),
      tone: "info",
    },
    {
      label: `Inspecciones · ${month3}`,
      value: (summary?.inspectionsMonth3 ?? 0).toString(),
      tone: "neutral",
    },
  ];

  const topUsers: ProfileTopUser[] = top3.map((u) => ({
    id: u.user.id,
    name: `${u.user.firstName} ${u.user.lastName}`,
    metricA: u.totalInspections,
    metricB: (u.averageScore ?? 0).toFixed(1),
  }));

  return (
    <ProfileShell
      roleLabel="Administrador"
      roleSubtitle="Gestiona el sistema y los usuarios"
      stats={stats}
      quickActions={quickActions}
      systemStatus={systemStatus}
      topUsers={topUsers}
      topUsersMetricLabels={{ a: "Inspecciones", b: "Promedio" }}
      loadingSidebar={loadingUsers || loadingEvaluations}
    />
  );
}
