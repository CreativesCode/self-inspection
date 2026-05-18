"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { SectionHead } from "@/components/ui/SectionHead";
import { useTheme } from "@/contexts/ThemeContext";
import { GetEvaluations } from "@/graphql/inspections";
import { cn } from "@/lib/utils";
import { useQuery } from "@/lib/apollo-compat";
import {
  Activity as ActivityIcon,
  BarChart3,
  Building2,
  ChevronDown,
  Filter,
  FilterX,
  Loader2,
  PieChart as PieChartIcon,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RPieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

// Paleta alineada con tokens del design system (gradient brand + estados).
const CHART_COLORS = [
  "#DA291C", // primary-500
  "#E76150", // primary-400
  "#4F75E1", // info
  "#2F9E6A", // ok
  "#E8A33D", // warn
  "#857974", // ink-3
  "#F28C7C",
  "#9C6B19",
  "#1E5C42",
  "#3057AE",
];

type EvaluacionUsuario = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType?: string;
  };
  totalEvaluations: number;
  averageScore: number;
  averageMaxScore: number;
  totalScoreSum: number;
  totalMaxScoreSum: number;
  overallPercentage: number;
  overallRating: string;
  minScore: number;
  maxScore: number;
  evaluations: unknown[];
};

const RATING_TONE: Record<string, PillTone> = {
  EXCELENTE: "ok",
  BUENO: "info",
  REGULAR: "warn",
  MALO: "bad",
};

const getInitials = (firstName: string, lastName: string) =>
  `${(firstName || "").charAt(0)}${(lastName || "").charAt(0)}`.toUpperCase();

// ─────────────────────────────────────────────────────────────
// Tooltips de los charts (estilo Card del rediseño)
// ─────────────────────────────────────────────────────────────
const ChartTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({
  active,
  payload,
}) => {
  if (!active || !payload || !payload.length) return null;
  const u = payload[0].payload as EvaluacionUsuario;
  return (
    <div className="rounded-[12px] border border-hairline bg-surface px-3 py-2.5 text-[12px] shadow-soft dark:border-hairline-dark dark:bg-dark-surface dark:text-dark-ink">
      <div className="font-bold text-ink dark:text-dark-ink">
        {u.user.firstName} {u.user.lastName}
      </div>
      <div className="mt-1 text-ink-2 dark:text-dark-ink-2">
        {u.user.email}
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1">
        <span className="text-ink-2 dark:text-dark-ink-2">Evaluaciones</span>
        <span className="text-right font-semibold">{u.totalEvaluations}</span>
        <span className="text-ink-2 dark:text-dark-ink-2">Promedio</span>
        <span className="text-right font-semibold">
          {u.averageScore} / {u.averageMaxScore}
        </span>
        <span className="text-ink-2 dark:text-dark-ink-2">Porcentaje</span>
        <span className="text-right font-semibold">{u.overallPercentage}%</span>
        <span className="text-ink-2 dark:text-dark-ink-2">Calificación</span>
        <span className="text-right font-semibold">{u.overallRating}</span>
      </div>
    </div>
  );
};

export default function EvaluationsDashboard() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);

  // ─── Filtros temporales ───
  const [projectCodeFilter, setProjectCodeFilter] = useState("");
  const [installationNameFilter, setInstallationNameFilter] = useState("");
  const [clientNameFilter, setClientNameFilter] = useState("");
  const [activityNameFilter, setActivityNameFilter] = useState("");
  const [userEmailFilter, setUserEmailFilter] = useState("");
  const [inspectionDateFromFilter, setInspectionDateFromFilter] = useState("");
  const [inspectionDateToFilter, setInspectionDateToFilter] = useState("");
  const [minimumScoreFilter, setMinimumScoreFilter] = useState("");
  const [maximumScoreFilter, setMaximumScoreFilter] = useState("");
  const [minimumPercentageFilter, setMinimumPercentageFilter] = useState("");
  const [maximumPercentageFilter, setMaximumPercentageFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [hasObservationFilter, setHasObservationFilter] = useState("");
  const [subcontractorFilter, setSubcontractorFilter] = useState("");
  const [searchTextFilter, setSearchTextFilter] = useState("");
  const [evaluationCountMinFilter, setEvaluationCountMinFilter] = useState("");
  const [orderByFilter, setOrderByFilter] = useState("percentage");
  const [orderDirectionFilter, setOrderDirectionFilter] = useState("desc");
  const [limitFilter, setLimitFilter] = useState("");

  // ─── Filtros aplicados ───
  const [appliedFilters, setAppliedFilters] = useState({
    projectCode: "",
    installationName: "",
    clientName: "",
    activityName: "",
    userEmail: "",
    inspectionDateFrom: "",
    inspectionDateTo: "",
    minimumScore: "",
    maximumScore: "",
    minimumPercentage: "",
    maximumPercentage: "",
    rating: "",
    hasObservation: "",
    subcontractor: "",
    searchText: "",
    evaluationCountMin: "",
    orderBy: "percentage",
    orderDirection: "desc",
    limit: "",
  });

  const queryVariables = {
    projectCode: appliedFilters.projectCode || undefined,
    installationName: appliedFilters.installationName || undefined,
    clientName: appliedFilters.clientName || undefined,
    activityName: appliedFilters.activityName || undefined,
    userEmail: appliedFilters.userEmail || undefined,
    inspectionDateFrom: appliedFilters.inspectionDateFrom
      ? new Date(appliedFilters.inspectionDateFrom).toISOString()
      : undefined,
    inspectionDateTo: appliedFilters.inspectionDateTo
      ? new Date(appliedFilters.inspectionDateTo).toISOString()
      : undefined,
    minimumScore: appliedFilters.minimumScore
      ? parseInt(appliedFilters.minimumScore)
      : undefined,
    maximumScore: appliedFilters.maximumScore
      ? parseInt(appliedFilters.maximumScore)
      : undefined,
    minimumPercentage: appliedFilters.minimumPercentage
      ? parseFloat(appliedFilters.minimumPercentage)
      : undefined,
    maximumPercentage: appliedFilters.maximumPercentage
      ? parseFloat(appliedFilters.maximumPercentage)
      : undefined,
    rating: appliedFilters.rating || undefined,
    hasObservation: appliedFilters.hasObservation
      ? appliedFilters.hasObservation === "true"
      : undefined,
    subcontractor: appliedFilters.subcontractor || undefined,
    searchText: appliedFilters.searchText || undefined,
    evaluationCountMin: appliedFilters.evaluationCountMin
      ? parseInt(appliedFilters.evaluationCountMin)
      : undefined,
    orderBy: appliedFilters.orderBy || "percentage",
    orderDirection: appliedFilters.orderDirection || "desc",
    limit: appliedFilters.limit ? parseInt(appliedFilters.limit) : undefined,
  };

  const { data, loading, error } = useQuery(GetEvaluations, {
    variables: queryVariables,
  });

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters({
      projectCode: projectCodeFilter,
      installationName: installationNameFilter,
      clientName: clientNameFilter,
      activityName: activityNameFilter,
      userEmail: userEmailFilter,
      inspectionDateFrom: inspectionDateFromFilter,
      inspectionDateTo: inspectionDateToFilter,
      minimumScore: minimumScoreFilter,
      maximumScore: maximumScoreFilter,
      minimumPercentage: minimumPercentageFilter,
      maximumPercentage: maximumPercentageFilter,
      rating: ratingFilter,
      hasObservation: hasObservationFilter,
      subcontractor: subcontractorFilter,
      searchText: searchTextFilter,
      evaluationCountMin: evaluationCountMinFilter,
      orderBy: orderByFilter,
      orderDirection: orderDirectionFilter,
      limit: limitFilter,
    });
  };

  const clearFilters = () => {
    setProjectCodeFilter("");
    setInstallationNameFilter("");
    setClientNameFilter("");
    setActivityNameFilter("");
    setUserEmailFilter("");
    setInspectionDateFromFilter("");
    setInspectionDateToFilter("");
    setMinimumScoreFilter("");
    setMaximumScoreFilter("");
    setMinimumPercentageFilter("");
    setMaximumPercentageFilter("");
    setRatingFilter("");
    setHasObservationFilter("");
    setSubcontractorFilter("");
    setSearchTextFilter("");
    setEvaluationCountMinFilter("");
    setOrderByFilter("percentage");
    setOrderDirectionFilter("desc");
    setLimitFilter("");
    setAppliedFilters({
      projectCode: "",
      installationName: "",
      clientName: "",
      activityName: "",
      userEmail: "",
      inspectionDateFrom: "",
      inspectionDateTo: "",
      minimumScore: "",
      maximumScore: "",
      minimumPercentage: "",
      maximumPercentage: "",
      rating: "",
      hasObservation: "",
      subcontractor: "",
      searchText: "",
      evaluationCountMin: "",
      orderBy: "percentage",
      orderDirection: "desc",
      limit: "",
    });
  };

  const handleUserSelect = (userId: string) => {
    router.push(`/evaluations/details?userId=${userId}`);
  };

  const evaluaciones: EvaluacionUsuario[] =
    data?.evaluationsSummaryByUser?.users ?? [];
  const hasEvaluations = evaluaciones.length > 0;

  // KPIs derivados.
  const totalEvaluations = evaluaciones.reduce(
    (sum, e) => sum + (e.totalEvaluations || 0),
    0,
  );
  const inspectoresActivos = evaluaciones.length;
  const inspectoresExcelentes = evaluaciones.filter(
    (e) => (e.overallPercentage || 0) >= 95,
  ).length;
  const cumplimientoGlobal = hasEvaluations
    ? evaluaciones.reduce((s, e) => s + (e.overallPercentage || 0), 0) /
      evaluaciones.length
    : 0;
  const promedioGlobal = hasEvaluations
    ? evaluaciones.reduce((s, e) => s + (e.averageScore || 0), 0) /
      evaluaciones.length
    : 0;

  // Datos para charts (limitamos a 10 para no saturar).
  const top10 = evaluaciones.slice(0, 10);
  const datosPie = top10.map((e) => ({
    ...e,
    name: `${e.user.firstName} ${e.user.lastName}`,
    value: e.totalEvaluations,
  }));
  const datosBarra = top10.map((e) => ({
    ...e,
    name: `${e.user.firstName.charAt(0)}. ${e.user.lastName}`,
    promedio: e.averageScore,
    total: e.totalEvaluations,
  }));

  // ─── Loading / Error ───
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="inline-flex items-center gap-3 text-sm text-ink-2 dark:text-dark-ink-2">
          <Loader2 size={18} className="animate-spin" />
          Cargando evaluaciones…
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
            Error al cargar evaluaciones: {error.message}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      <div className="mx-auto max-w-[1320px] px-3 pb-16 pt-5 sm:px-8 sm:pt-8">
        {/* ─── Header ─── */}
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
              Evaluaciones · Resumen
            </div>
            <h1 className="m-0 mt-1.5 text-3xl font-extrabold tracking-tighter sm:text-[34px]">
              Ranking &amp; desempeño
            </h1>
            <p className="m-0 mt-1.5 text-sm text-ink-2 dark:text-dark-ink-2">
              Resumen de evaluaciones realizadas por equipo, cliente y técnico.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={
                isFilterExpanded ? <FilterX size={13} /> : <Filter size={13} />
              }
              onClick={() => setIsFilterExpanded((v) => !v)}
            >
              {isFilterExpanded ? "Ocultar filtros" : "Filtros"}
            </Button>
          </div>
        </header>

        {/* ─── KPI row ─── */}
        <div className="mb-5 grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
          <KpiCard
            label="Cumplimiento global"
            value={`${cumplimientoGlobal.toFixed(1)}%`}
            detail={
              hasEvaluations
                ? `Calculado sobre ${inspectoresActivos} ${inspectoresActivos === 1 ? "inspector" : "inspectores"}`
                : "Sin datos"
            }
            tone="ok"
            Icon={ShieldCheck}
          />
          <KpiCard
            label="Inspectores activos"
            value={inspectoresActivos.toString()}
            detail={
              inspectoresExcelentes > 0
                ? `${inspectoresExcelentes} con score ≥ 95%`
                : "—"
            }
            tone="info"
            Icon={Users}
          />
          <KpiCard
            label="Evaluaciones totales"
            value={totalEvaluations.toLocaleString("es-ES")}
            detail={
              hasEvaluations
                ? `Media ${Math.round(totalEvaluations / inspectoresActivos)} / inspector`
                : "—"
            }
            tone="brand"
            Icon={BarChart3}
          />
          <KpiCard
            label="Promedio global"
            value={promedioGlobal.toFixed(1)}
            detail="Puntuación media por evaluación"
            tone="warn"
            Icon={TrendingUp}
          />
        </div>

        {/* ─── Filtros ─── */}
        {isFilterExpanded && (
          <Card radius={20} className="mb-5">
            <form onSubmit={handleApplyFilters}>
              <SectionHead
                title="Filtros"
                subtitle="Aplica filtros para refinar el ranking y los gráficos"
                icon={<Filter size={16} />}
              />
              <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                  label="Búsqueda general"
                  value={searchTextFilter}
                  onChange={(e) => setSearchTextFilter(e.target.value)}
                  placeholder="Buscar en todos los campos"
                />
                <Field
                  label="Código de proyecto"
                  value={projectCodeFilter}
                  onChange={(e) => setProjectCodeFilter(e.target.value)}
                  placeholder="ESP-24-..."
                />
                <Field
                  label="Instalación"
                  value={installationNameFilter}
                  onChange={(e) => setInstallationNameFilter(e.target.value)}
                  placeholder="SE Castellón Sur"
                />
                <Field
                  label="Cliente"
                  value={clientNameFilter}
                  onChange={(e) => setClientNameFilter(e.target.value)}
                  icon={<Building2 size={14} />}
                  placeholder="Iberdrola…"
                />
                <Field
                  label="Actividad"
                  value={activityNameFilter}
                  onChange={(e) => setActivityNameFilter(e.target.value)}
                  icon={<ActivityIcon size={14} />}
                  placeholder="Trabajos en altura…"
                />
                <Field
                  label="Email de usuario"
                  value={userEmailFilter}
                  onChange={(e) => setUserEmailFilter(e.target.value)}
                  icon={<User size={14} />}
                  placeholder="luis@…"
                />
                <Field
                  label="Subcontratista"
                  value={subcontractorFilter}
                  onChange={(e) => setSubcontractorFilter(e.target.value)}
                  placeholder="—"
                />
                <Field
                  label="Fecha desde"
                  type="date"
                  value={inspectionDateFromFilter}
                  onChange={(e) =>
                    setInspectionDateFromFilter(e.target.value)
                  }
                />
                <Field
                  label="Fecha hasta"
                  type="date"
                  value={inspectionDateToFilter}
                  onChange={(e) => setInspectionDateToFilter(e.target.value)}
                />
                <Field
                  label="Puntuación mín."
                  type="number"
                  value={minimumScoreFilter}
                  onChange={(e) => setMinimumScoreFilter(e.target.value)}
                  placeholder="0"
                />
                <Field
                  label="Puntuación máx."
                  type="number"
                  value={maximumScoreFilter}
                  onChange={(e) => setMaximumScoreFilter(e.target.value)}
                  placeholder="100"
                />
                <Field
                  label="Porcentaje mín. (%)"
                  type="number"
                  value={minimumPercentageFilter}
                  onChange={(e) => setMinimumPercentageFilter(e.target.value)}
                  placeholder="0"
                />
                <Field
                  label="Porcentaje máx. (%)"
                  type="number"
                  value={maximumPercentageFilter}
                  onChange={(e) => setMaximumPercentageFilter(e.target.value)}
                  placeholder="100"
                />
                <PlainSelect
                  label="Calificación"
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="EXCELENTE">Excelente</option>
                  <option value="BUENO">Bueno</option>
                  <option value="REGULAR">Regular</option>
                  <option value="MALO">Malo</option>
                </PlainSelect>
                <PlainSelect
                  label="Tiene observación"
                  value={hasObservationFilter}
                  onChange={(e) => setHasObservationFilter(e.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="true">Con observación</option>
                  <option value="false">Sin observación</option>
                </PlainSelect>
                <Field
                  label="Mín. evaluaciones"
                  type="number"
                  value={evaluationCountMinFilter}
                  onChange={(e) =>
                    setEvaluationCountMinFilter(e.target.value)
                  }
                  placeholder="1"
                />
                <PlainSelect
                  label="Ordenar por"
                  value={orderByFilter}
                  onChange={(e) => setOrderByFilter(e.target.value)}
                >
                  <option value="percentage">Porcentaje</option>
                  <option value="evaluations">Total de evaluaciones</option>
                  <option value="inspections">Total de inspecciones</option>
                  <option value="name">Nombre del usuario</option>
                </PlainSelect>
                <PlainSelect
                  label="Dirección"
                  value={orderDirectionFilter}
                  onChange={(e) => setOrderDirectionFilter(e.target.value)}
                >
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </PlainSelect>
                <Field
                  label="Límite de resultados"
                  type="number"
                  value={limitFilter}
                  onChange={(e) => setLimitFilter(e.target.value)}
                  placeholder="Sin límite"
                />
              </div>
              <div className="mt-5 flex flex-wrap justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Limpiar
                </Button>
                <Button type="submit" size="sm">
                  Aplicar filtros
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ─── Empty state ─── */}
        {!hasEvaluations && (
          <Card radius={20} className="mb-5">
            <div className="flex flex-col items-center gap-2.5 py-8 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-bg-2 text-ink-2 dark:bg-white/[0.05] dark:text-dark-ink-2">
                <BarChart3 size={22} />
              </div>
              <div className="text-base font-semibold">
                No hay evaluaciones disponibles
              </div>
              <div className="text-sm text-ink-2 dark:text-dark-ink-2">
                Cuando se completen inspecciones con sus respuestas, aparecerán
                aquí.
              </div>
            </div>
          </Card>
        )}

        {/* ─── Charts ─── */}
        {hasEvaluations && (
          <div className="mb-5 grid gap-5 lg:grid-cols-[1.7fr_1fr]">
            <Card radius={22}>
              <SectionHead
                title="Promedio y total por inspector"
                subtitle={`Top ${top10.length} del periodo`}
                icon={<BarChart3 size={16} />}
              />
              <div className="mt-4 h-[260px] sm:h-[320px] lg:h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RBarChart
                    data={datosBarra}
                    margin={{ top: 16, right: 24, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={
                        isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(27,22,20,0.06)"
                      }
                    />
                    <XAxis
                      dataKey="name"
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                      height={70}
                      tick={{
                        fill: isDark ? "#9C8E89" : "#4A4340",
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      stroke={isDark ? "#9C8E89" : "#4A4340"}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke={isDark ? "#9C8E89" : "#4A4340"}
                      tick={{ fontSize: 11 }}
                    />
                    <RechartsTooltip content={<ChartTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={28}
                      wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="promedio"
                      name="Promedio"
                      fill="var(--accent-500)"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="total"
                      name="Total"
                      fill="#4F75E1"
                      radius={[6, 6, 0, 0]}
                    />
                  </RBarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card radius={22}>
              <SectionHead
                title="Distribución por inspector"
                subtitle="Reparto del total de evaluaciones"
                icon={<PieChartIcon size={16} />}
              />
              <div className="mt-4 h-[240px] sm:h-[300px] lg:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie
                      data={datosPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      stroke={isDark ? "#241D1A" : "#FFFFFF"}
                    >
                      {datosPie.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<ChartTooltip />} />
                  </RPieChart>
                </ResponsiveContainer>
              </div>
              {/* Leyenda derivada */}
              <div className="mt-3 grid gap-1.5">
                {datosPie.map((p, i) => (
                  <div
                    key={p.user.id}
                    className="flex items-center gap-2.5 text-[12px]"
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                    <span className="flex-1 truncate text-ink dark:text-dark-ink">
                      {p.user.firstName} {p.user.lastName}
                    </span>
                    <span className="font-semibold text-ink-2 dark:text-dark-ink-2">
                      {p.totalEvaluations}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ─── Ranking ─── */}
        {hasEvaluations && (
          <Card radius={22}>
            <SectionHead
              title="Ranking de inspectores"
              subtitle="Ordenado por porcentaje global"
              icon={<ShieldCheck size={16} />}
            />

            {/* Cards mobile (< sm) */}
            <div className="mt-5 grid gap-2.5 sm:hidden">
              {evaluaciones.map((u, i) => {
                const pct = Math.max(
                  0,
                  Math.min(100, Number(u.overallPercentage) || 0),
                );
                const totalEv = u.totalEvaluations ?? 0;
                const avgScore = u.averageScore ?? 0;
                const tone: PillTone =
                  RATING_TONE[(u.overallRating || "").toUpperCase()] ||
                  "neutral";
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
                    key={`m-${u.user.id}`}
                    type="button"
                    onClick={() => handleUserSelect(u.user.id)}
                    className="flex w-full flex-col gap-2.5 rounded-[14px] border border-hairline bg-bg-2 p-3 text-left transition-colors hover:bg-bg-2/70 dark:border-hairline-dark dark:bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[13px] font-extrabold",
                          i < 3
                            ? "bg-grad-brand text-white"
                            : "bg-bg-2 text-ink-2 dark:bg-white/[0.06] dark:text-dark-ink-2",
                        )}
                      >
                        {i + 1}
                      </span>
                      <Avatar
                        name={getInitials(u.user.firstName, u.user.lastName)}
                        size={36}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-bold">
                          {u.user.firstName} {u.user.lastName}
                        </div>
                        <div className="truncate text-[11px] text-ink-2 dark:text-dark-ink-2">
                          {totalEv}{" "}
                          {totalEv === 1 ? "evaluación" : "evaluaciones"} ·
                          score {avgScore}
                        </div>
                      </div>
                      <Pill tone={tone}>{u.overallRating || "—"}</Pill>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[rgba(27,22,20,0.06)] dark:bg-white/[0.06]">
                        <div
                          className={cn("h-full rounded-full", barClass)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-12 text-right font-mono text-[12px] font-bold">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tabla desktop (≥ sm) */}
            <div className="mt-5 hidden overflow-x-auto sm:block">
              <div
                className="min-w-[860px]"
                style={{
                  display: "grid",
                  rowGap: 0,
                }}
              >
                {/* Header */}
                <div
                  className="grid items-center gap-4 border-b border-hairline px-2 pb-3 text-[11px] font-bold uppercase tracking-widest text-ink-2 dark:border-hairline-dark dark:text-dark-ink-2"
                  style={{
                    gridTemplateColumns:
                      "44px minmax(220px,1.4fr) 140px 100px 220px 130px",
                  }}
                >
                  <span>#</span>
                  <span>Inspector</span>
                  <span>Evaluaciones</span>
                  <span>Score</span>
                  <span>Cumplimiento</span>
                  <span className="text-right">Calificación</span>
                </div>

                {evaluaciones.map((u, i) => {
                  const pct = Math.max(
                    0,
                    Math.min(100, Number(u.overallPercentage) || 0),
                  );
                  const totalEv = u.totalEvaluations ?? 0;
                  const avgScore = u.averageScore ?? 0;
                  const tone: PillTone =
                    RATING_TONE[(u.overallRating || "").toUpperCase()] ||
                    "neutral";
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
                      key={u.user.id}
                      type="button"
                      onClick={() => handleUserSelect(u.user.id)}
                      className="grid items-center gap-4 border-b border-hairline px-2 py-3 text-left transition-colors hover:bg-bg-2 dark:border-hairline-dark dark:hover:bg-white/[0.03]"
                      style={{
                        gridTemplateColumns:
                          "44px minmax(220px,1.4fr) 140px 100px 220px 130px",
                      }}
                    >
                      <span
                        className={cn(
                          "inline-flex h-8 w-8 items-center justify-center rounded-[10px] text-[13px] font-extrabold",
                          i < 3
                            ? "bg-grad-brand text-white"
                            : "bg-bg-2 text-ink-2 dark:bg-white/[0.06] dark:text-dark-ink-2",
                        )}
                      >
                        {i + 1}
                      </span>
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar
                          name={getInitials(
                            u.user.firstName,
                            u.user.lastName,
                          )}
                          size={36}
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold">
                            {u.user.firstName} {u.user.lastName}
                          </div>
                          <div className="truncate text-[12px] text-ink-2 dark:text-dark-ink-2">
                            {u.user.userType?.replaceAll("_", " ") ||
                              u.user.email}
                          </div>
                        </div>
                      </div>
                      <div className="text-[13px] text-ink-2 dark:text-dark-ink-2">
                        {totalEv} {totalEv === 1 ? "evaluación" : "evaluaciones"}
                      </div>
                      <div className="font-mono text-[15px] font-extrabold tracking-tight">
                        {avgScore}
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[rgba(27,22,20,0.06)] dark:bg-white/[0.06]">
                          <div
                            className={cn("h-full rounded-full", barClass)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-mono text-[12px] font-bold">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <Pill tone={tone}>{u.overallRating || "—"}</Pill>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers locales
// ─────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  detail,
  tone,
  Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "ok" | "warn" | "info" | "brand" | "bad";
  Icon: React.ComponentType<{ size?: number | string }>;
}) {
  const TONE_BG: Record<typeof tone, string> = {
    ok: "bg-grad-ok",
    warn: "bg-grad-warn",
    info: "bg-grad-info",
    brand: "bg-grad-brand",
    bad: "bg-grad-bad",
  };
  return (
    <Card radius={18}>
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 flex-1 text-[10px] font-bold uppercase leading-snug tracking-widest text-ink-2 dark:text-dark-ink-2 sm:text-[11px]">
          {label}
        </span>
        <span
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-white",
            TONE_BG[tone],
          )}
        >
          <Icon size={14} />
        </span>
      </div>
      <div className="mt-1 break-all text-[22px] font-extrabold leading-tight tracking-tighter sm:text-[28px] lg:text-[32px]">
        {value}
      </div>
      <div className="text-[11px] text-ink-2 dark:text-dark-ink-2 sm:text-xs">
        {detail}
      </div>
    </Card>
  );
}

function PlainSelect({
  label,
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <label className="text-xs font-semibold tracking-tight text-ink-2 dark:text-dark-ink-2">
        {label}
      </label>
      <div className="mt-1.5 flex items-center gap-2.5 rounded-[12px] border border-hairline bg-bg-2 px-3.5 py-3 dark:border-hairline-dark dark:bg-white/[0.03]">
        <select
          {...rest}
          className="flex-1 cursor-pointer appearance-none bg-transparent text-sm text-ink outline-none dark:text-dark-ink"
        >
          {children}
        </select>
        <ChevronDown
          size={14}
          className="shrink-0 text-ink-2 dark:text-dark-ink-2"
        />
      </div>
    </div>
  );
}
