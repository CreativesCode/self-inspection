"use client";

import {
  ProfileShell,
  type ProfileQuickAction,
  type ProfileStat,
  type ProfileTopUser,
} from "@/components/profile/ProfileShell";
import { GetEvaluations } from "@/graphql/inspections";
import { useAuthStore } from "@/store";
import { useQuery } from "@/lib/apollo-compat";
import { ClipboardList, FileText, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface EvaluationUser {
  id: string;
  firstName: string;
  lastName: string;
}

interface UserEvaluationSummary {
  user: EvaluationUser;
  averageScore: number;
  totalEvaluations: number;
  totalInspections: number;
  overallPercentage: number;
}

interface EvaluationsData {
  evaluationsSummaryByUser: {
    users: UserEvaluationSummary[];
  };
}

export default function WorkerProfilePageClient() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  // Top 3 inspectores para sidebar (mismo patrón que admin).
  const { data: evaluationsData, loading } = useQuery<EvaluationsData>(
    GetEvaluations,
    {
      variables: {
        orderBy: "inspections",
        orderDirection: "desc",
        limit: 3,
      },
    },
  );

  // Resumen propio del usuario para los KPIs.
  const { data: myData, loading: loadingMine } = useQuery<EvaluationsData>(
    GetEvaluations,
    {
      variables: { userEmail: user?.email },
      skip: !user?.email,
    },
  );

  useEffect(() => {
    if (
      !isAuthenticated ||
      (user &&
        user.userType !== "JEFE_DE_TRABAJO" &&
        user.userType !== "TECNICO")
    ) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  if (
    !user ||
    (user.userType !== "JEFE_DE_TRABAJO" && user.userType !== "TECNICO")
  )
    return null;

  const mine = myData?.evaluationsSummaryByUser?.users?.[0];
  const top3 = evaluationsData?.evaluationsSummaryByUser?.users ?? [];

  const stats: ProfileStat[] = [
    {
      label: "Mis inspecciones",
      value: (mine?.totalInspections ?? 0).toString(),
      detail: "Total históricas",
      tone: "brand",
      Icon: ClipboardList,
    },
    {
      label: "Cumplimiento",
      value: `${(mine?.overallPercentage ?? 0).toFixed(1)}%`,
      detail: "Promedio personal",
      tone: "ok",
      Icon: TrendingUp,
    },
    {
      label: "Evaluaciones",
      value: (mine?.totalEvaluations ?? 0).toString(),
      detail: "Respondidas",
      tone: "info",
      Icon: FileText,
    },
  ];

  const quickActions: ProfileQuickAction[] = [
    { label: "Mis inspecciones", href: "/inspections", Icon: ClipboardList },
    {
      label: "Mi historial de evaluaciones",
      href: `/evaluations/details?userId=${user.id}`,
      Icon: FileText,
    },
  ];

  const topUsers: ProfileTopUser[] = top3.map((u) => ({
    id: u.user.id,
    name: `${u.user.firstName} ${u.user.lastName}`,
    metricA: u.totalInspections,
    metricB: (u.averageScore ?? 0).toFixed(1),
  }));

  const roleLabel =
    user.userType === "JEFE_DE_TRABAJO" ? "Jefe de trabajo" : "Inspector";

  return (
    <ProfileShell
      roleLabel={roleLabel}
      roleSubtitle="Gestiona tu historial de inspecciones"
      stats={stats}
      quickActions={quickActions}
      topUsers={topUsers}
      topUsersMetricLabels={{ a: "Inspecciones", b: "Promedio" }}
      loadingSidebar={loading || loadingMine}
    />
  );
}

