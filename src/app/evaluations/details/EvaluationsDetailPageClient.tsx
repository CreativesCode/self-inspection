"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GradientBorder } from "@/components/ui/GradientBorder";
import { IconBtn } from "@/components/ui/IconBtn";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { SectionHead } from "@/components/ui/SectionHead";
import { GetEvaluations } from "@/graphql/inspections";
import { cn } from "@/lib/utils";
import { useQuery } from "@/lib/apollo-compat";
import {
  BarChart3,
  ChevronLeft,
  Eye,
  FileText,
  Loader2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType?: string;
}

interface Observation {
  observationText: string;
}

interface Client {
  clientName: string;
}

interface Inspection {
  projectCode: string;
  instalationName: string;
  client: Client;
  activities: {
    edges: Array<{
      node: {
        id: string;
        activityText: string;
      };
    }>;
  };
  observation?: Observation;
}

interface Evaluation {
  id: string;
  inspection: Inspection;
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  rating: string;
}

interface UserEvaluation {
  user: User;
  totalEvaluations: number;
  averageScore: number;
  averageMaxScore: number;
  overallPercentage: number;
  overallRating: string;
  evaluations: Evaluation[];
}

const RATING_TONE: Record<string, PillTone> = {
  EXCELENTE: "ok",
  BUENO: "info",
  REGULAR: "warn",
  MALO: "bad",
};

const getInitials = (firstName: string, lastName: string) =>
  `${(firstName || "").charAt(0)}${(lastName || "").charAt(0)}`.toUpperCase();

const ratingTone = (rating: string): PillTone =>
  RATING_TONE[(rating || "").toUpperCase()] || "neutral";

/**
 * SparkLine SVG inline: dibuja la serie de porcentajes de las evaluaciones
 * más recientes para visualizar la evolución del cumplimiento.
 */
function LineChart({
  data,
  labels,
}: {
  data: number[];
  labels: string[];
}) {
  if (data.length < 2) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-[14px] border border-dashed border-hairline text-sm text-ink-2 dark:border-hairline-dark dark:text-dark-ink-2">
        Necesitamos al menos 2 evaluaciones para mostrar la evolución.
      </div>
    );
  }
  const W = 720;
  const H = 240;
  const P = 28;
  const max = Math.min(100, Math.max(...data) + 5);
  const min = Math.max(0, Math.min(...data) - 5);
  const span = Math.max(1, max - min);
  const pts = data.map((v, i) => {
    const x = P + (i / Math.max(1, data.length - 1)) * (W - P * 2);
    const y = H - P - ((v - min) / span) * (H - P * 2);
    return [x, y] as [number, number];
  });
  const path = pts
    .map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`))
    .join(" ");
  const area = `${path} L ${pts[pts.length - 1][0]} ${H - P} L ${pts[0][0]} ${H - P} Z`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      style={{ display: "block" }}
      className="text-primary-500"
      aria-label="Evolución del cumplimiento"
    >
      <defs>
        <linearGradient id="ln-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.30" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1={P}
          x2={W - P}
          y1={P + i * ((H - P * 2) / 3)}
          y2={P + i * ((H - P * 2) / 3)}
          stroke="currentColor"
          className="text-[rgba(27,22,20,0.08)] dark:text-white/10"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      ))}
      <path d={area} fill="url(#ln-area)" />
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p[0]}
          cy={p[1]}
          r="3.5"
          fill="#fff"
          stroke="currentColor"
          strokeWidth="2"
        />
      ))}
      {labels.map((l, i) => (
        <text
          key={i}
          x={pts[i][0]}
          y={H - 8}
          textAnchor="middle"
          fontSize="10"
          className="fill-ink-2 dark:fill-dark-ink-2"
        >
          {l}
        </text>
      ))}
      {[max, max - span / 3, max - (2 * span) / 3, min].map((v, i) => (
        <text
          key={i}
          x={4}
          y={P + i * ((H - P * 2) / 3) + 4}
          fontSize="10"
          className="fill-ink-2 dark:fill-dark-ink-2"
        >
          {Math.round(v)}%
        </text>
      ))}
    </svg>
  );
}

export default function EvaluationsDetailPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");

  const { data, loading, error } = useQuery(GetEvaluations, {
    variables: { userId },
    fetchPolicy: "network-only",
  });

  const handleBack = () => router.push("/evaluations");

  // ─── Guard rails ───
  if (!userId) {
    return (
      <div className="bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
        <div className="mx-auto max-w-[1320px] px-6 py-12">
          <Button
            variant="ghost"
            size="sm"
            icon={<ChevronLeft size={13} />}
            onClick={handleBack}
            className="mb-4"
          >
            Volver a evaluaciones
          </Button>
          <Card radius={16}>
            <p className="m-0 text-sm text-ink-2 dark:text-dark-ink-2">
              No se especificó un usuario para mostrar detalles.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="inline-flex items-center gap-3 text-sm text-ink-2 dark:text-dark-ink-2">
          <Loader2 size={18} className="animate-spin" />
          Cargando detalles…
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="px-6 py-8">
        <Card
          radius={16}
          className="!border-[rgba(var(--accent-rgb),0.32)] !bg-[rgba(var(--accent-rgb),0.06)]"
        >
          <div className="text-sm text-primary-700">
            Error: {error.message}
          </div>
        </Card>
      </div>
    );
  }

  const userEvaluation: UserEvaluation | undefined =
    data?.evaluationsSummaryByUser?.users?.find(
      (e: UserEvaluation) => e.user.id === userId,
    );

  if (!userEvaluation) {
    return (
      <div className="bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
        <div className="mx-auto max-w-[1320px] px-6 py-12">
          <Button
            variant="ghost"
            size="sm"
            icon={<ChevronLeft size={13} />}
            onClick={handleBack}
            className="mb-4"
          >
            Volver a evaluaciones
          </Button>
          <Card radius={16}>
            <p className="m-0 text-sm text-ink-2 dark:text-dark-ink-2">
              No se encontraron evaluaciones para este usuario.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const { user, evaluations = [] } = userEvaluation;
  const initials = getInitials(user.firstName, user.lastName);
  // Defensas: el backend puede devolver campos undefined si no hay
  // evaluaciones todavía o si el resolver aún no calcula los agregados.
  const safeTotalEvaluations = userEvaluation.totalEvaluations ?? 0;
  const safeAverageScore = userEvaluation.averageScore ?? 0;
  const safeAverageMaxScore = userEvaluation.averageMaxScore ?? 0;
  const safeOverallRating = userEvaluation.overallRating || "—";

  // Línea evolutiva: porcentajes en orden cronológico inverso → invertimos
  // para tener "más antiguo → más reciente". Filtramos NaN/undefined.
  const trend = [...evaluations]
    .slice(0, 12)
    .reverse()
    .map((e) => Number(e.percentage) || 0)
    .filter((n) => !Number.isNaN(n));
  const trendLabels = trend.map((_, i) => `E${i + 1}`);

  // Distribución por calificación (categorías).
  const ratingCounts: Record<string, number> = {};
  evaluations.forEach((e) => {
    const k = (e.rating || "—").toUpperCase();
    ratingCounts[k] = (ratingCounts[k] || 0) + 1;
  });
  const ratingTotals = Object.entries(ratingCounts).map(([rating, count]) => ({
    rating,
    count,
  }));
  ratingTotals.sort((a, b) => b.count - a.count);
  const totalForBars = evaluations.length || 1;
  const ratingMeta: Record<string, { label: string; color: string }> = {
    EXCELENTE: { label: "👍 Excelente", color: "#2F9E6A" },
    BUENO: { label: "🙂 Bueno", color: "#4F75E1" },
    REGULAR: { label: "😐 Regular", color: "#E8A33D" },
    MALO: { label: "👎 Malo", color: "#DA291C" },
  };

  // Por cliente — top 5.
  const clientCounts: Record<string, number> = {};
  evaluations.forEach((e) => {
    const name = e.inspection.client?.clientName || "—";
    clientCounts[name] = (clientCounts[name] || 0) + 1;
  });
  const topClients = Object.entries(clientCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Delta vs evaluación previa (para chip "+x pts").
  let deltaText = "—";
  if (trend.length >= 2) {
    const last = trend[trend.length - 1];
    const prev = trend[trend.length - 2];
    const delta = last - prev;
    deltaText = `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} pts vs evaluación previa`;
  }

  const cumplimientoPct = Math.max(
    0,
    Math.min(100, userEvaluation.overallPercentage || 0),
  );
  const cumplimientoTone: PillTone =
    cumplimientoPct >= 90
      ? "ok"
      : cumplimientoPct >= 75
      ? "info"
      : cumplimientoPct >= 60
      ? "warn"
      : "bad";

  return (
    <div className="bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      <div className="mx-auto max-w-[1320px] px-3 pb-16 pt-5 sm:px-8 sm:pt-8">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-sm text-ink-2 dark:text-dark-ink-2">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 hover:text-ink dark:hover:text-dark-ink"
          >
            <ChevronLeft size={13} /> Evaluaciones
          </button>
          <span>·</span>
          <span className="font-semibold text-ink dark:text-dark-ink">
            {user.firstName} {user.lastName}
          </span>
        </nav>

        {/* Hero */}
        <GradientBorder radius={26} className="mb-5">
          <div className="flex flex-col items-stretch gap-5 p-6 lg:flex-row lg:items-center lg:gap-6">
            <Avatar name={initials} size={88} />
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <Pill tone="brand">
                  <ShieldCheck size={11} />{" "}
                  {user.userType?.replaceAll("_", " ") || "Inspector"}
                </Pill>
                <Pill tone={cumplimientoTone}>{safeOverallRating}</Pill>
              </div>
              <h1 className="m-0 text-[28px] font-extrabold tracking-tighter sm:text-3xl">
                {user.firstName} {user.lastName}
              </h1>
              <div className="mt-1 text-[13px] text-ink-2 dark:text-dark-ink-2">
                {user.email}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-[18px] border border-hairline bg-bg-2 px-5 py-3.5 dark:border-hairline-dark dark:bg-white/[0.03] sm:grid-cols-4">
              <HeroStat
                label="Evaluaciones"
                value={String(safeTotalEvaluations)}
              />
              <HeroStat
                label="Cumplimiento"
                value={`${cumplimientoPct.toFixed(1)}%`}
              />
              <HeroStat
                label="Promedio"
                value={String(safeAverageScore)}
                detail={`/ ${safeAverageMaxScore}`}
              />
              <HeroStat label="Calificación" value={safeOverallRating} />
            </div>
          </div>
        </GradientBorder>

        {/* Trend + breakdown */}
        <div className="mb-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <Card radius={22}>
            <div className="flex flex-col items-start justify-between gap-2.5 sm:flex-row sm:items-center">
              <SectionHead
                title="Evolución del cumplimiento"
                subtitle={`Últimas ${trend.length} evaluaciones`}
                icon={<TrendingUp size={16} />}
              />
              <Pill
                tone={
                  deltaText.startsWith("+") && deltaText !== "+0.0 pts" ? "ok" : "neutral"
                }
              >
                {deltaText}
              </Pill>
            </div>
            <div className="mt-4 text-ink-2 dark:text-dark-ink-2">
              <LineChart data={trend} labels={trendLabels} />
            </div>
          </Card>

          <Card radius={22}>
            <SectionHead
              title="Distribución por calificación"
              icon={<BarChart3 size={16} />}
            />
            <div className="mt-4 grid gap-3">
              {ratingTotals.length === 0 ? (
                <div className="text-sm text-ink-2 dark:text-dark-ink-2">
                  Sin datos.
                </div>
              ) : (
                ratingTotals.map((r) => {
                  const meta =
                    ratingMeta[r.rating] || {
                      label: r.rating,
                      color: "#857974",
                    };
                  const pct = (r.count * 100) / totalForBars;
                  return (
                    <div key={r.rating}>
                      <div className="mb-1.5 flex items-center justify-between text-[13px]">
                        <span className="font-semibold">{meta.label}</span>
                        <span className="text-ink-2 dark:text-dark-ink-2">
                          {r.count}{" "}
                          <span className="font-bold text-ink dark:text-dark-ink">
                            · {pct.toFixed(0)}%
                          </span>
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(27,22,20,0.06)] dark:bg-white/[0.06]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: meta.color }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {topClients.length > 0 && (
              <>
                <div className="my-5 h-px bg-hairline dark:bg-hairline-dark" />
                <div className="text-[11px] font-bold uppercase tracking-widest text-ink-2 dark:text-dark-ink-2">
                  Por cliente
                </div>
                <div className="mt-2.5 grid gap-1">
                  {topClients.map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between py-1 text-[13px]"
                    >
                      <span className="truncate text-ink dark:text-dark-ink">
                        {c.name}
                      </span>
                      <span className="font-semibold text-ink-2 dark:text-dark-ink-2">
                        {c.count} ev.
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Lista de evaluaciones */}
        {/* padding 0 + !p-3 sm:!p-6: el padding fijo 24 del Card sumado al
            padding de los button cards internos hacía que en móvil la Pill y
            el % se salieran del card. */}
        <Card radius={22} padding={0} className="overflow-hidden !p-3 sm:!p-6">
          <SectionHead
            title="Evaluaciones realizadas"
            subtitle={`${evaluations.length} ${evaluations.length === 1 ? "evaluación" : "evaluaciones"} · ordenadas por fecha`}
            icon={<FileText size={16} />}
          />

          {evaluations.length === 0 ? (
            <div className="mt-4 rounded-[14px] border border-dashed border-hairline bg-bg-2 p-6 text-center text-sm text-ink-2 dark:border-hairline-dark dark:bg-white/[0.03] dark:text-dark-ink-2">
              No hay evaluaciones disponibles para este usuario.
            </div>
          ) : (
            <>
              {/* Cards mobile (< sm) */}
              <div className="mt-5 grid gap-2.5 sm:hidden">
                {evaluations.map((e) => {
                  const pct = Math.max(
                    0,
                    Math.min(100, Number(e.percentage) || 0),
                  );
                  const totalScore = e.totalScore ?? 0;
                  const maxScore = e.maxPossibleScore ?? 0;
                  const tone = ratingTone(e.rating);
                  const barClass =
                    pct >= 90
                      ? "bg-grad-ok"
                      : pct >= 75
                        ? "bg-grad-info"
                        : pct >= 60
                          ? "bg-grad-warn"
                          : "bg-grad-bad";
                  return (
                    <button
                      key={`m-${e.id}`}
                      type="button"
                      onClick={() =>
                        router.push(
                          `/inspections/details?id=${encodeURIComponent(e.inspection.projectCode)}`,
                        )
                      }
                      // min-w-0 + overflow-hidden previenen overflow horizontal
                      // del Pill / % cuando "EXCELENTE" o un nombre largo
                      // empujan el row más allá del ancho disponible.
                      className="flex w-full min-w-0 flex-col gap-2 overflow-hidden rounded-[14px] border border-hairline bg-bg-2 p-3 text-left dark:border-hairline-dark dark:bg-white/[0.03]"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-[11px] font-semibold text-ink-2 dark:text-dark-ink-2">
                            {e.inspection.projectCode}
                          </div>
                          <div className="mt-0.5 truncate text-[14px] font-bold">
                            {e.inspection.instalationName}
                          </div>
                          <div className="truncate text-[12px] text-ink-2 dark:text-dark-ink-2">
                            {e.inspection.client?.clientName || "—"}
                          </div>
                        </div>
                        <Pill tone={tone} className="shrink-0">
                          {e.rating || "—"}
                        </Pill>
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex shrink-0 items-baseline gap-1">
                          <span className="text-[14px] font-extrabold">
                            {totalScore}
                          </span>
                          <span className="text-[11px] text-ink-2 dark:text-dark-ink-2">
                            / {maxScore}
                          </span>
                        </div>
                        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[rgba(27,22,20,0.06)] dark:bg-white/[0.06]">
                          <div
                            className={cn("h-full rounded-full", barClass)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-12 shrink-0 text-right font-mono text-[11px] font-bold">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Tabla desktop (≥ sm) */}
              <div className="mt-5 hidden overflow-x-auto sm:block">
                <div className="min-w-[920px]">
                <div
                  className="grid items-center gap-3 border-b border-hairline px-4 pb-3 text-[11px] font-bold uppercase tracking-widest text-ink-2 dark:border-hairline-dark dark:text-dark-ink-2"
                  style={{
                    gridTemplateColumns:
                      "120px minmax(220px,1.4fr) minmax(140px,1fr) minmax(180px,1.2fr) 130px 110px 80px",
                  }}
                >
                  <span>Código</span>
                  <span>Inspección</span>
                  <span>Cliente</span>
                  <span>Actividad</span>
                  <span>Score</span>
                  <span>Calificación</span>
                  <span className="text-right">—</span>
                </div>
                {evaluations.map((e) => {
                  const pct = Math.max(
                    0,
                    Math.min(100, Number(e.percentage) || 0),
                  );
                  const totalScore = e.totalScore ?? 0;
                  const maxScore = e.maxPossibleScore ?? 0;
                  const tone = ratingTone(e.rating);
                  const barClass =
                    pct >= 90
                      ? "bg-grad-ok"
                      : pct >= 75
                      ? "bg-grad-info"
                      : pct >= 60
                      ? "bg-grad-warn"
                      : "bg-grad-bad";
                  const activities =
                    e.inspection.activities?.edges
                      ?.map((edge) => edge.node.activityText)
                      .join(", ") || "—";
                  return (
                    <div
                      key={e.id}
                      className="grid items-center gap-3 border-b border-hairline px-4 py-3 text-[13px] dark:border-hairline-dark"
                      style={{
                        gridTemplateColumns:
                          "120px minmax(220px,1.4fr) minmax(140px,1fr) minmax(180px,1.2fr) 130px 110px 80px",
                      }}
                    >
                      <span className="font-mono text-[12px] font-semibold">
                        {e.inspection.projectCode}
                      </span>
                      <span className="truncate font-semibold">
                        {e.inspection.instalationName}
                      </span>
                      <span className="truncate text-ink-2 dark:text-dark-ink-2">
                        {e.inspection.client?.clientName || "—"}
                      </span>
                      <span
                        className="truncate text-ink-2 dark:text-dark-ink-2"
                        title={activities}
                      >
                        {activities}
                      </span>
                      <span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-[15px] font-extrabold tracking-tight">
                            {totalScore}
                          </span>
                          <span className="text-[11px] text-ink-2 dark:text-dark-ink-2">
                            / {maxScore}
                          </span>
                        </div>
                        <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-[rgba(27,22,20,0.06)] dark:bg-white/[0.06]">
                          <div
                            className={cn("h-full rounded-full", barClass)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </span>
                      <span>
                        <Pill tone={tone}>{e.rating || "—"}</Pill>
                      </span>
                      <span className="flex justify-end gap-1.5">
                        <IconBtn
                          tone="info"
                          title="Ver detalle"
                          onClick={() =>
                            router.push(
                              `/inspections/details?id=${encodeURIComponent(e.inspection.projectCode)}`,
                            )
                          }
                        >
                          <Eye size={13} />
                        </IconBtn>
                      </span>
                    </div>
                  );
                })}
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function HeroStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="text-center">
      <div className="text-[11px] font-bold uppercase tracking-widest text-ink-2 dark:text-dark-ink-2">
        {label}
      </div>
      <div className="mt-1 flex items-baseline justify-center gap-1">
        <span className="text-[22px] font-extrabold tracking-tighter">
          {value}
        </span>
        {detail && (
          <span className="text-[11px] text-ink-2 dark:text-dark-ink-2">
            {detail}
          </span>
        )}
      </div>
    </div>
  );
}
