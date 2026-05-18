"use client";

import AlertDialog from "@/components/common/AlertDialog";
import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { GradientBorder } from "@/components/ui/GradientBorder";
import { IconBtn } from "@/components/ui/IconBtn";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { PageBtn } from "@/components/ui/PageBtn";
import { Pill } from "@/components/ui/Pill";
import { useTheme } from "@/contexts/ThemeContext";
import { DeleteInspection, GetInspections } from "@/graphql/inspections";
import { GET_INSPECTION_REPORT } from "@/graphql/reports";
import { cn, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store";
import { InspectionEdge, InspectionsResponse } from "@/types/types";
import { useLazyQuery, useMutation, useQuery } from "@/lib/apollo-compat";
import { useRefetchOnRefresh } from "@/hooks/useRefetchOnRefresh";
import {
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  FileDown,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

// ─────────────────────────────────────────────────────────────
// Helpers de fecha + páginas
// ─────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    }),
    time: d.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

/** Ventana de páginas tipo "1, 2, 3, …, last" */
function paginationWindow(current: number, total: number): (number | "…")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, "…", total];
  if (current >= total - 2) return [1, "…", total - 2, total - 1, total];
  return [1, "…", current, "…", total];
}

// ─────────────────────────────────────────────────────────────

export default function InspectionsPageClient() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isDark } = useTheme();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Filtros temporales (lo que el usuario está escribiendo)
  const [projectCodeFilter, setProjectCodeFilter] = useState("");
  const [installationNameFilter, setInstallationNameFilter] = useState("");
  const [inspectionTypeFilter, setInspectionTypeFilter] = useState("");
  const [clientNameFilter, setClientNameFilter] = useState("");
  const [activityTextFilter, setActivityTextFilter] = useState("");
  const [userEmailFilter, setUserEmailFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");

  // Filtros aplicados (los que se envían a la API)
  const [appliedFilters, setAppliedFilters] = useState({
    projectCode: "",
    installationName: "",
    inspectionType: "",
    clientName: "",
    activityText: "",
    userEmail: "",
    dateFrom: "",
    dateTo: "",
  });

  // Paginación
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState<{
    id: string;
    projectCode: string;
  } | null>(null);

  // Alert dialog
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({ isOpen: false, title: "", message: "", type: "info" });

  // Loading PDF por inspección
  const [loadingReportId, setLoadingReportId] = useState<string | null>(null);

  // Permisos por rol
  const showUserColumn = user?.userType !== "JEFE_DE_TRABAJO";

  // Variables Apollo
  const offset = (currentPage - 1) * pageSize;
  const dateTimeGt = appliedFilters.dateFrom
    ? new Date(appliedFilters.dateFrom).toISOString()
    : undefined;
  const dateTimeLt = appliedFilters.dateTo
    ? new Date(appliedFilters.dateTo).toISOString()
    : undefined;

  const queryVariables = {
    first: pageSize,
    pageOffset: offset,
    projectCode_Icontains: appliedFilters.projectCode || undefined,
    instalationName_Icontains: appliedFilters.installationName || undefined,
    inspectionType_Name: appliedFilters.inspectionType || undefined,
    client_ClientName_Icontains: appliedFilters.clientName || undefined,
    activity_ActivityText_Icontains: appliedFilters.activityText || undefined,
    user_Email_Icontains: appliedFilters.userEmail || undefined,
    dateTime_Gt: dateTimeGt,
    dateTime_Lt: dateTimeLt,
    userId: user && user.userType === "INSPECTOR" ? user.id : undefined,
  };

  const { loading, error, data, refetch } = useQuery<InspectionsResponse>(
    GetInspections,
    {
      variables: queryVariables,
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    },
  );
  useRefetchOnRefresh(refetch);

  const [deleteInspection, { loading: deleteLoading }] = useMutation(
    DeleteInspection,
    {
      onCompleted: (data: any) => {
        if (data?.deleteInspection?.success) refetch();
      },
    },
  );

  const [getInspectionReport] = useLazyQuery(GET_INSPECTION_REPORT, {
    fetchPolicy: "network-only",
  });

  // Total de páginas
  useEffect(() => {
    if (data?.inspections?.totalCount) {
      setTotalPages(Math.ceil(data.inspections.totalCount / pageSize));
    }
  }, [data?.inspections?.totalCount, pageSize]);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  const inspections = useMemo(() => data?.inspections?.edges || [], [data]);
  const totalCount = data?.inspections?.totalCount || 0;

  // KPIs derivados de la página actual (TODO: queries dedicadas para totales reales)
  const kpis = useMemo(() => {
    const completed = inspections.filter(({ node }) =>
      node.polls?.edges?.some((e) => e.node.status === "COMPLETED"),
    ).length;
    const pending = inspections.length - completed;
    return [
      {
        l: "Total registradas",
        v: totalCount.toLocaleString("es-ES"),
        d: "todas las inspecciones",
        tone: "brand" as const,
      },
      {
        l: "Completadas",
        v: completed.toString(),
        d: `de ${inspections.length} en esta página`,
        tone: "ok" as const,
      },
      {
        l: "Pendientes",
        v: pending.toString(),
        d: "encuestas sin completar",
        tone: "warn" as const,
      },
      {
        l: "En esta página",
        v: inspections.length.toString(),
        d: `página ${currentPage} de ${Math.max(totalPages, 1)}`,
        tone: "info" as const,
      },
    ];
  }, [inspections, totalCount, currentPage, totalPages]);

  // Has any filter applied
  const hasActiveFilters = Object.values(appliedFilters).some((v) => v !== "");

  // Handlers
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters({
      projectCode: projectCodeFilter,
      installationName: installationNameFilter,
      inspectionType: inspectionTypeFilter,
      clientName: clientNameFilter,
      activityText: activityTextFilter,
      userEmail: userEmailFilter,
      dateFrom: dateFromFilter,
      dateTo: dateToFilter,
    });
    setCurrentPage(1);
    setSearchTerm("");
  };

  const clearFilters = () => {
    setProjectCodeFilter("");
    setInstallationNameFilter("");
    setInspectionTypeFilter("");
    setClientNameFilter("");
    setActivityTextFilter("");
    setUserEmailFilter("");
    setDateFromFilter("");
    setDateToFilter("");
    setAppliedFilters({
      projectCode: "",
      installationName: "",
      inspectionType: "",
      clientName: "",
      activityText: "",
      userEmail: "",
      dateFrom: "",
      dateTo: "",
    });
    setCurrentPage(1);
    setSearchTerm("");
  };

  const handleDeleteClick = (id: string, projectCode: string) => {
    setInspectionToDelete({ id, projectCode });
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!inspectionToDelete) return;
    try {
      await deleteInspection({ variables: { id: inspectionToDelete.id } });
      setIsDeleteDialogOpen(false);
      setInspectionToDelete(null);
    } catch {
      // Apollo Link maneja errores
    }
  };

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" | "warning" | "info",
  ) => {
    setAlertDialog({ isOpen: true, title, message, type });
  };

  const handleDownloadPDF = async (inspectionId: string) => {
    try {
      setLoadingReportId(inspectionId);
      // Primer intento: si hay un `report_jobs` con `status='done'` y
      // download_url usamos esa URL (puede ser el PDF legacy del Django).
      const { data } = await getInspectionReport({
        variables: { inspectionId },
      });
      const existing = data?.inspectionReport;
      if (existing?.status === "DONE" && existing.downloadUrl) {
        window.open(existing.downloadUrl, "_blank");
        return;
      }
      // No existe (o está en otro estado): generamos el PDF en cliente
      // ahora mismo y abrimos. Import dinámico para no inflar el bundle
      // inicial con `@react-pdf/renderer`.
      const { generateOrFetchInspectionPdf } = await import(
        "@/lib/data/reportGenerator"
      );
      const url = await generateOrFetchInspectionPdf(inspectionId);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Error al obtener/generar el reporte:", err);
      showAlert(
        "Error al generar el reporte",
        "No se pudo generar el PDF. Vuelve a intentarlo en unos segundos.",
        "error",
      );
    } finally {
      setLoadingReportId(null);
    }
  };

  // Estados especiales de render
  if (!user) return null;

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg dark:bg-dark-bg">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg dark:bg-dark-bg">
        <Card>
          <p className="text-primary-600">Error al cargar las inspecciones.</p>
        </Card>
      </div>
    );
  }

  // gridTemplateColumns ajustado según contenido real:
  //   - Código: fijo, monoespaciado corto (~9 chars).
  //   - Instalación: ancho medio (nombres como "Galapagar II").
  //   - TI: pill muy corta ("OC", "MT") → fijo.
  //   - Cliente: corto ("Iberdrola", "Eiffage") → fijo.
  //   - Actividad: ancho FLEXIBLE — el más largo, suele truncarse.
  //   - Fecha: 2 líneas compactas → fijo.
  //   - Usuario: avatar + email largo → flex medio.
  //   - Estado: solo un icono circular → fijo estrecho.
  //   - Acciones: 3-4 IconBtn de 30px + gap → fijo justo.
  const gridCols = showUserColumn
    ? "100px minmax(160px,1.1fr) 56px minmax(100px,0.7fr) minmax(180px,1.6fr) 92px minmax(180px,1.2fr) 64px 132px"
    : "100px minmax(160px,1.2fr) 56px minmax(100px,0.8fr) minmax(200px,2fr) 92px 64px 132px";

  // Grid de fields del filtro — reusado por la Card desktop y el BottomSheet mobile.
  const filterFieldsGrid = (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
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
        placeholder="Filtrar por instalación"
      />
      <Field
        label="TI"
        value={inspectionTypeFilter}
        onChange={(e) => setInspectionTypeFilter(e.target.value)}
        placeholder="TI-04"
      />
      <Field
        label="Cliente"
        value={clientNameFilter}
        onChange={(e) => setClientNameFilter(e.target.value)}
        placeholder="Iberdrola, Repsol…"
      />
      <Field
        label="Actividad"
        value={activityTextFilter}
        onChange={(e) => setActivityTextFilter(e.target.value)}
        placeholder="Trabajos en altura"
      />
      {showUserColumn && (
        <Field
          label="Email del usuario"
          value={userEmailFilter}
          onChange={(e) => setUserEmailFilter(e.target.value)}
          placeholder="usuario@..."
        />
      )}
      <Field
        label="Desde"
        type="date"
        icon={<Calendar size={14} />}
        value={dateFromFilter}
        onChange={(e) => setDateFromFilter(e.target.value)}
      />
      <Field
        label="Hasta"
        type="date"
        icon={<Calendar size={14} />}
        value={dateToFilter}
        onChange={(e) => setDateToFilter(e.target.value)}
      />
    </div>
  );

  return (
    <div className="inspections-page min-h-screen bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      <main className="mx-auto max-w-[1320px] px-3 pb-16 pt-5 sm:px-8 sm:pt-8">
        {/* ─── Page title + actions ─── */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
              Operación
            </div>
            <h1 className="m-0 mt-1.5 text-3xl font-extrabold tracking-tighter sm:text-[38px]">
              Inspecciones
            </h1>
            <p className="m-0 mt-1.5 text-sm text-ink-2 dark:text-dark-ink-2">
              {totalCount.toLocaleString("es-ES")} inspecciones registradas
              {hasActiveFilters && " · filtros activos"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="ghost"
              icon={<SlidersHorizontal size={14} />}
              onClick={() => setIsFilterExpanded((v) => !v)}
            >
              {isFilterExpanded ? "Ocultar filtros" : "Filtros"}
            </Button>
            <Button
              icon={<Plus size={14} />}
              onClick={() => router.push("/inspections/create")}
            >
              Nueva inspección
            </Button>
          </div>
        </header>

        {/* ─── KPIs ─── */}
        <section className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {kpis.map((m) => (
            <Card key={m.l} radius={18} padding={20}>
              <div className="flex items-start justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-2 dark:text-dark-ink-2">
                  {m.l}
                </div>
                <div
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-lg",
                    m.tone === "brand" &&
                      "bg-[rgba(var(--accent-rgb),0.10)] text-primary-500",
                    m.tone === "ok" &&
                      "bg-[rgba(47,158,106,0.12)] text-ok-700",
                    m.tone === "warn" &&
                      "bg-[rgba(232,163,61,0.14)] text-warn-700",
                    m.tone === "info" &&
                      "bg-[rgba(79,117,225,0.12)] text-info-700",
                  )}
                >
                  <BarChart3 size={14} />
                </div>
              </div>
              <div className="mt-1.5 text-3xl font-extrabold tracking-tighter">
                {m.v}
              </div>
              <div className="mt-0.5 text-xs text-ink-2 dark:text-dark-ink-2">
                {m.d}
              </div>
            </Card>
          ))}
        </section>

        {/* ─── Search + filter chips bar ─── */}
        <GradientBorder radius={18}>
          <div className="flex flex-wrap items-center gap-2.5 p-3.5">
            <div
              className={cn(
                "flex flex-1 items-center gap-2.5 rounded-[12px] border border-hairline bg-bg-2 px-3.5 py-2.5",
                "dark:border-hairline-dark dark:bg-white/[0.03]",
              )}
            >
              <Search size={16} className="text-ink-2 dark:text-dark-ink-2" />
              <input
                placeholder="Buscar por código, instalación, cliente o actividad…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3 dark:text-dark-ink dark:placeholder:text-dark-ink-2"
              />
            </div>
            <button
              onClick={() => setIsFilterExpanded((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[12px] border px-3.5 py-2.5 text-[13px] font-medium",
                "border-hairline bg-bg-2 text-ink-2",
                "dark:border-hairline-dark dark:bg-white/[0.03] dark:text-dark-ink-2",
                "hover:brightness-95",
              )}
            >
              <SlidersHorizontal size={14} />
              Filtros avanzados
              <ChevronDown
                size={12}
                className={cn(
                  "transition-transform",
                  isFilterExpanded && "rotate-180",
                )}
              />
            </button>
          </div>
        </GradientBorder>

        {/* ─── Filtros expandibles (Card inline, ≥ lg) ─── */}
        {isFilterExpanded && (
          <Card radius={18} className="mt-4 hidden lg:block">
            <form onSubmit={handleApplyFilters}>
              {filterFieldsGrid}
              <div className="mt-5 flex justify-end gap-2.5">
                <Button variant="ghost" type="button" onClick={clearFilters}>
                  Limpiar
                </Button>
                <Button type="submit" icon={<Check size={14} />}>
                  Aplicar filtros
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ─── Filtros bottom-sheet (mobile/tablet, &lt; lg) ─── */}
        <BottomSheet
          isOpen={isFilterExpanded}
          onClose={() => setIsFilterExpanded(false)}
          title="Filtros avanzados"
          action={
            <button
              type="button"
              onClick={clearFilters}
              className="text-[12px] font-semibold text-primary-500 hover:text-primary-600"
            >
              Limpiar
            </button>
          }
          footer={
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 justify-center"
                onClick={() => setIsFilterExpanded(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                icon={<Check size={14} />}
                onClick={(e) => {
                  handleApplyFilters(e as unknown as React.FormEvent);
                  setIsFilterExpanded(false);
                }}
                className="flex-1 justify-center"
              >
                Aplicar
              </Button>
            </div>
          }
        >
          <div className="lg:hidden">{filterFieldsGrid}</div>
        </BottomSheet>

        {/* ─── Cards mobile (< sm) ─── */}
        <div className="mt-5 grid gap-3 sm:hidden">
          {inspections.length === 0 ? (
            <Card radius={20}>
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-bg-2 text-ink-2 dark:bg-white/[0.05] dark:text-dark-ink-2">
                  <ShieldCheck size={22} />
                </div>
                <div className="text-base font-semibold">
                  No hay inspecciones disponibles
                </div>
                {(searchTerm || hasActiveFilters) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            inspections.map(({ node: ins }: InspectionEdge) => {
              const completed = ins.polls?.edges?.some(
                (e) => e.node.status === "COMPLETED",
              );
              const activitiesText =
                ins.activities?.edges
                  ?.map((e) => e.node.activityText)
                  .join(", ") || "Sin actividades";
              const date = formatDate(ins.dateTime);
              return (
                <Card
                  key={ins.id}
                  radius={16}
                  padding={0}
                  className="overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/inspections/details?id=${ins.id}`)
                    }
                    className="block w-full p-3.5 text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-mono text-[11px] font-semibold text-ink-2 dark:text-dark-ink-2">
                          {ins.projectCode}
                        </div>
                        <div className="mt-0.5 truncate text-[15px] font-bold tracking-tight">
                          {ins.instalationName}
                        </div>
                        <div className="truncate text-[12px] text-ink-2 dark:text-dark-ink-2">
                          {ins.client?.clientName || "Sin cliente"}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <Pill>
                          {ins.inspectionType?.name
                            ? getInitials(ins.inspectionType.name)
                            : "—"}
                        </Pill>
                        {completed ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(47,158,106,0.14)] text-ok-700">
                            <Check size={12} />
                          </span>
                        ) : (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(232,163,61,0.14)] text-warn-700">
                            <Clock size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 truncate text-[12px] text-ink-2 dark:text-dark-ink-2">
                      {activitiesText}
                    </div>
                    <div className="mt-2 flex min-w-0 items-center gap-2 text-[11px] text-ink-3 dark:text-dark-ink-2">
                      <span className="inline-flex shrink-0 items-center gap-1">
                        <Calendar size={11} /> {date.date} · {date.time}
                      </span>
                      {showUserColumn && ins.user?.email && (
                        <span className="ml-auto flex min-w-0 items-center gap-1.5">
                          <Avatar
                            name={ins.user.email.charAt(0).toUpperCase()}
                            size={16}
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {ins.user.email}
                          </span>
                        </span>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-1 border-t border-hairline px-3 py-2 dark:border-hairline-dark">
                    {completed ? (
                      <button
                        type="button"
                        disabled={loadingReportId === ins.id}
                        onClick={() => handleDownloadPDF(ins.id)}
                        className="inline-flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[rgba(var(--accent-rgb),0.10)] text-[12px] font-semibold text-primary-600 transition hover:brightness-95 disabled:opacity-50"
                      >
                        {loadingReportId === ins.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <FileDown size={12} />
                        )}
                        Descargar PDF
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/inspections/edit?id=${ins.id}`)
                        }
                        className="inline-flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[rgba(27,22,20,0.05)] text-[12px] font-semibold text-ink-2 transition hover:brightness-95 dark:bg-white/[0.05] dark:text-dark-ink-2"
                      >
                        <Edit3 size={12} /> Editar
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={deleteLoading}
                      onClick={() =>
                        handleDeleteClick(ins.id, ins.projectCode)
                      }
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(var(--accent-rgb),0.10)] text-primary-600 transition hover:brightness-95 disabled:opacity-50"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* ─── Tabla (≥ sm) ─── */}
        <div className="mt-5 hidden sm:block">
          <Card radius={20} padding={0}>
            {/* Tabla scroll horizontal en pantallas medianas */}
            <div className="overflow-x-auto">
              {/* Header */}
              <div
                className={cn(
                  "grid border-b border-hairline px-5 py-3.5",
                  "text-[11px] font-bold uppercase tracking-wider text-ink-2",
                  "dark:border-hairline-dark dark:text-dark-ink-2",
                )}
                style={{ gridTemplateColumns: gridCols, minWidth: 1100 }}
              >
                <span>Código</span>
                <span>Instalación</span>
                <span>TI</span>
                <span>Cliente</span>
                <span>Actividad</span>
                <span>Fecha</span>
                {showUserColumn && <span>Usuario</span>}
                <span className="text-center">Estado</span>
                <span className="text-right">Acciones</span>
              </div>

              {/* Filas */}
              {inspections.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-2 text-ink-3 dark:bg-white/[0.04] dark:text-dark-ink-2">
                    <ShieldCheck size={26} />
                  </div>
                  <p className="mt-4 text-base font-semibold">
                    No hay inspecciones disponibles
                  </p>
                  {searchTerm && (
                    <p className="mt-1 text-sm text-ink-2 dark:text-dark-ink-2">
                      No se encontraron resultados para &ldquo;{searchTerm}
                      &rdquo;
                    </p>
                  )}
                  {hasActiveFilters && (
                    <p className="mt-1 text-sm text-ink-2 dark:text-dark-ink-2">
                      Prueba ajustando o limpiando los filtros.
                    </p>
                  )}
                  {(searchTerm || hasActiveFilters) && (
                    <Button
                      className="mt-5"
                      variant="ghost"
                      onClick={clearFilters}
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              ) : (
                inspections.map(({ node: ins }: InspectionEdge, i: number) => {
                  const completed = ins.polls?.edges?.some(
                    (e) => e.node.status === "COMPLETED",
                  );
                  const activitiesText =
                    ins.activities?.edges
                      ?.map((e) => e.node.activityText)
                      .join(", ") || "Sin actividades";
                  const date = formatDate(ins.dateTime);
                  const isLast = i === inspections.length - 1;

                  return (
                    <div
                      key={ins.id}
                      className={cn(
                        "grid items-center px-5 py-4 text-[13px]",
                        !isLast &&
                          "border-b border-hairline dark:border-hairline-dark",
                        "hover:bg-bg-2/50 dark:hover:bg-white/[0.02]",
                      )}
                      style={{ gridTemplateColumns: gridCols, minWidth: 1100 }}
                    >
                      <span className="font-mono text-xs font-semibold">
                        {ins.projectCode}
                      </span>
                      <span
                        className="truncate font-semibold"
                        title={ins.instalationName}
                      >
                        {ins.instalationName}
                      </span>
                      <span>
                        <Pill>
                          {ins.inspectionType?.name
                            ? getInitials(ins.inspectionType.name)
                            : "—"}
                        </Pill>
                      </span>
                      <span
                        className="truncate text-ink-2 dark:text-dark-ink-2"
                        title={ins.client?.clientName}
                      >
                        {ins.client?.clientName || "—"}
                      </span>
                      <span
                        className="truncate text-ink-2 dark:text-dark-ink-2"
                        title={activitiesText}
                      >
                        {activitiesText}
                      </span>
                      <span className="text-xs text-ink-2 dark:text-dark-ink-2">
                        {date.date}
                        <br />
                        <span className="text-ink-3">{date.time}</span>
                      </span>
                      {showUserColumn && (
                        <span className="inline-flex items-center gap-2">
                          <Avatar
                            name={
                              ins.user?.email
                                ? ins.user.email.charAt(0).toUpperCase()
                                : "?"
                            }
                            size={26}
                          />
                          <span
                            className="truncate text-xs"
                            title={ins.user?.email}
                          >
                            {ins.user?.email || "—"}
                          </span>
                        </span>
                      )}
                      <span className="flex justify-center">
                        {completed ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(47,158,106,0.14)] text-ok-700">
                            <Check size={14} />
                          </span>
                        ) : (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(232,163,61,0.14)] text-warn-700">
                            <Clock size={14} />
                          </span>
                        )}
                      </span>
                      <span className="flex justify-end gap-1.5">
                        <IconBtn
                          tone="info"
                          title="Ver"
                          onClick={() =>
                            router.push(
                              `/inspections/details?id=${ins.id}`,
                            )
                          }
                        >
                          <Eye size={13} />
                        </IconBtn>
                        {!completed && (
                          <IconBtn
                            tone="neutral"
                            title="Editar"
                            onClick={() =>
                              router.push(`/inspections/edit?id=${ins.id}`)
                            }
                          >
                            <Edit3 size={13} />
                          </IconBtn>
                        )}
                        {completed && (
                          <IconBtn
                            tone="brand"
                            title="Descargar PDF"
                            disabled={loadingReportId === ins.id}
                            onClick={() => handleDownloadPDF(ins.id)}
                          >
                            {loadingReportId === ins.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <FileDown size={13} />
                            )}
                          </IconBtn>
                        )}
                        <IconBtn
                          tone="bad"
                          title="Eliminar"
                          disabled={deleteLoading}
                          onClick={() =>
                            handleDeleteClick(ins.id, ins.projectCode)
                          }
                        >
                          <Trash2 size={13} />
                        </IconBtn>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* ─── Paginación ─── */}
          {inspections.length > 0 && (
            <div className="mt-5 flex flex-col items-center justify-between gap-3 text-[13px] text-ink-2 sm:flex-row dark:text-dark-ink-2">
              <div className="inline-flex items-center gap-3">
                <span>
                  Mostrando{" "}
                  <b className="text-ink dark:text-dark-ink">
                    {offset + 1}–{offset + inspections.length}
                  </b>{" "}
                  de{" "}
                  <b className="text-ink dark:text-dark-ink">
                    {totalCount.toLocaleString("es-ES")}
                  </b>
                </span>
                <span>·</span>
                <label className="inline-flex items-center gap-1.5">
                  Por página:
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "rounded-md border border-hairline bg-surface px-2 py-1 text-xs",
                      "dark:border-hairline-dark dark:bg-dark-surface",
                    )}
                  >
                    {[5, 10, 20, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-1.5">
                <PageBtn
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={13} />
                </PageBtn>
                {paginationWindow(currentPage, totalPages).map((p, i) =>
                  p === "…" ? (
                    <span
                      key={`gap-${i}`}
                      className="px-1 text-ink-3 dark:text-dark-ink-2"
                    >
                      …
                    </span>
                  ) : (
                    <PageBtn
                      key={p}
                      active={p === currentPage}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </PageBtn>
                  ),
                )}
                <PageBtn
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                >
                  <ChevronRight size={13} />
                </PageBtn>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── Modales ─── */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setInspectionToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que deseas eliminar la inspección con código ${inspectionToDelete?.projectCode}? Esta acción no se puede deshacer.`}
        isDark={isDark}
        isLoading={deleteLoading}
      />
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog((p) => ({ ...p, isOpen: false }))}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        autoClose
        autoCloseDelay={5000}
      />
    </div>
  );
}
