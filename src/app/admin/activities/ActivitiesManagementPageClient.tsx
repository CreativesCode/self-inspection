"use client";

import { AdminTabs } from "@/components/admin/AdminTabs";
import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconBtn } from "@/components/ui/IconBtn";
import { Pill } from "@/components/ui/Pill";
import { SectionHead } from "@/components/ui/SectionHead";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DeleteActivity,
  GetInspectionTypesWithActivities,
  UnifiedActivity,
  UnifiedInspectionTypesWithActivitiesData,
} from "@/graphql/inspections";
import {
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";
import { useMutation, useQuery } from "@/lib/apollo-compat";
import { useRefetchOnRefresh } from "@/hooks/useRefetchOnRefresh";
import {
  CheckCircle2,
  ChevronRight,
  Edit3,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ActivitiesManagementPageClient() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const { isDark } = useTheme();

  const [selectedInspectionTypeId, setSelectedInspectionTypeId] = useState<
    string | null
  >(null);

  const {
    data: inspectionTypesData,
    loading: inspectionTypesLoading,
    error: inspectionTypesError,
    refetch,
  } = useQuery<UnifiedInspectionTypesWithActivitiesData>(
    GetInspectionTypesWithActivities,
    { fetchPolicy: "network-only" },
  );

  useRefetchOnRefresh(refetch);

  const [deleteActivity, { loading: deleteLoading }] = useMutation(
    DeleteActivity,
    {
      onCompleted: () => refetch(),
    },
  );

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toDelete, setToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || (user && user.userType !== "ADMINISTRADOR")) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (
      !inspectionTypesLoading &&
      inspectionTypesData?.inspectionTypes?.edges &&
      inspectionTypesData.inspectionTypes.edges.length > 0 &&
      !selectedInspectionTypeId
    ) {
      const first = inspectionTypesData.inspectionTypes.edges[0]?.node?.id;
      if (first) setSelectedInspectionTypeId(first);
    }
  }, [inspectionTypesData, inspectionTypesLoading, selectedInspectionTypeId]);

  const inspectionTypes =
    inspectionTypesData?.inspectionTypes?.edges?.map((e) => e.node) || [];

  const getActivitiesForSelectedType = (): (UnifiedActivity & {
    inspectionType: { id: string; name: string };
  })[] => {
    if (!selectedInspectionTypeId) return [];
    const selectedType = inspectionTypes.find(
      (t) => t.id === selectedInspectionTypeId,
    );
    return (
      selectedType?.activities?.edges?.map((edge) => ({
        ...edge.node,
        inspectionType: {
          id: selectedType.id,
          name: selectedType.name,
        },
      })) || []
    );
  };

  const activities = getActivitiesForSelectedType();
  const selectedType = inspectionTypes.find(
    (t) => t.id === selectedInspectionTypeId,
  );

  if (!user || user.userType !== "ADMINISTRADOR") return null;

  const handleDeleteClick = (id: string, name: string) => {
    setToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    try {
      const { data } = await deleteActivity({
        variables: { id: toDelete.id },
      });
      if (data?.deleteActivity?.errors && data.deleteActivity.errors.length > 0) {
        processGraphQLErrors(data.deleteActivity.errors);
        return;
      }
      if (data?.deleteActivity?.success) {
        setIsDeleteModalOpen(false);
        setToDelete(null);
      }
    } catch (err) {
      notifyError(fromGenericError(err, "Error al eliminar actividad"));
    }
  };

  return (
    <div className="bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      <div className="mx-auto max-w-[1320px] px-3 pb-16 pt-5 sm:px-8 sm:pt-8">
        <AdminTabs active="activities" />

        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
              Administración · Catálogo
            </div>
            <h1 className="m-0 mt-1.5 text-3xl font-extrabold tracking-tighter sm:text-[34px]">
              Gestión de actividades
            </h1>
            <p className="m-0 mt-1.5 text-sm text-ink-2 dark:text-dark-ink-2">
              Administra las actividades por tipo de inspección
            </p>
          </div>
          <Button
            type="button"
            icon={<Plus size={14} />}
            disabled={!selectedInspectionTypeId}
            onClick={() =>
              router.push(
                `/admin/activities/create?inspectionTypeId=${selectedInspectionTypeId}`,
              )
            }
          >
            Nueva actividad
          </Button>
        </header>

        {inspectionTypesLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-ink-2 dark:text-dark-ink-2">
            <Loader2 size={18} className="mr-2 animate-spin" /> Cargando…
          </div>
        ) : inspectionTypesError ? (
          <Card
            radius={16}
            className="!border-[rgba(var(--accent-rgb),0.32)] !bg-[rgba(var(--accent-rgb),0.06)]"
          >
            <div className="text-sm text-primary-700">
              Error: {inspectionTypesError.message}
            </div>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
            {/* Sidebar tipos */}
            <Card radius={20} padding={16} className="overflow-hidden">
              <SectionHead
                title="Tipos de inspección"
                icon={<ShieldCheck size={16} />}
              />
              <div className="mt-4 grid gap-1">
                {inspectionTypes.length === 0 ? (
                  <p className="text-sm text-ink-2 dark:text-dark-ink-2">
                    No hay tipos configurados.
                  </p>
                ) : (
                  inspectionTypes.map((t) => {
                    const isActive = selectedInspectionTypeId === t.id;
                    const count = t.activities?.edges?.length || 0;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedInspectionTypeId(t.id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[13px] font-semibold transition-colors",
                          isActive
                            ? "border border-[rgba(var(--accent-rgb),0.22)] bg-[rgba(var(--accent-rgb),0.08)] text-primary-600"
                            : "border border-transparent text-ink dark:text-dark-ink hover:bg-bg-2 dark:hover:bg-white/[0.03]",
                        )}
                      >
                        <span className="flex-1 truncate">{t.name}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-bold",
                            isActive
                              ? "bg-primary-500/20 text-primary-600"
                              : "bg-bg-2 text-ink-2 dark:bg-white/[0.06] dark:text-dark-ink-2",
                          )}
                        >
                          {count}
                        </span>
                        {isActive && (
                          <ChevronRight
                            size={13}
                            className="text-primary-500"
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Actividades */}
            <Card radius={20} padding={16} className="overflow-hidden">
              <SectionHead
                title={
                  selectedType
                    ? `${selectedType.name}`
                    : "Selecciona un tipo de inspección"
                }
                subtitle={
                  selectedType
                    ? `${activities.length} ${activities.length === 1 ? "actividad" : "actividades"}`
                    : "Las actividades del tipo seleccionado aparecerán aquí"
                }
                icon={<CheckCircle2 size={16} />}
                action={
                  selectedInspectionTypeId ? (
                    <Pill tone="brand">{activities.length}</Pill>
                  ) : undefined
                }
              />

              <div className="mt-4 grid gap-2.5">
                {activities.length === 0 ? (
                  <p className="m-0 rounded-[14px] border border-dashed border-hairline bg-bg-2 p-6 text-center text-sm text-ink-2 dark:border-hairline-dark dark:bg-white/[0.03] dark:text-dark-ink-2">
                    {selectedInspectionTypeId
                      ? "Este tipo aún no tiene actividades. Crea la primera."
                      : "Selecciona un tipo en la izquierda."}
                  </p>
                ) : (
                  activities.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2.5 overflow-hidden rounded-[12px] border border-hairline bg-bg-2 p-2.5 dark:border-hairline-dark dark:bg-white/[0.03] sm:gap-3 sm:p-3.5"
                    >
                      <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-grad-brand text-white sm:h-9 sm:w-9">
                        <CheckCircle2 size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-semibold">
                          {a.activityText}
                        </div>
                        <div className="truncate text-[11px] text-ink-2 dark:text-dark-ink-2">
                          Creada{" "}
                          {new Date(a.createdAt).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <IconBtn
                          tone="info"
                          title="Editar"
                          size={28}
                          onClick={() =>
                            router.push(`/admin/activities/edit?id=${a.id}`)
                          }
                        >
                          <Edit3 size={12} />
                        </IconBtn>
                        <IconBtn
                          tone="bad"
                          title="Eliminar"
                          size={28}
                          disabled={deleteLoading}
                          onClick={() =>
                            handleDeleteClick(a.id, a.activityText)
                          }
                        >
                          <Trash2 size={12} />
                        </IconBtn>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Eliminar actividad"
        message={`¿Estás seguro que deseas eliminar la actividad ${
          toDelete?.name || ""
        }? Esta acción no se puede deshacer.`}
        isDark={isDark}
        isLoading={deleteLoading}
      />
    </div>
  );
}
