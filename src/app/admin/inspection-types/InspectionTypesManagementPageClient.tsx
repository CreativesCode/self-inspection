"use client";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTabs } from "@/components/admin/AdminTabs";
import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GradientBorder } from "@/components/ui/GradientBorder";
import { IconBtn } from "@/components/ui/IconBtn";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DeleteInspectionType,
  GetInspectionTypes,
} from "@/graphql/inspections";
import {
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { useAuthStore } from "@/store";
import { useMutation, useQuery } from "@/lib/apollo-compat";
import { useRefetchOnRefresh } from "@/hooks/useRefetchOnRefresh";
import {
  Edit3,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface InspectionType {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface InspectionTypesData {
  inspectionTypes: {
    edges: { node: InspectionType }[];
    totalCount: number;
  };
}

export default function InspectionTypesManagementPage() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const { isDark } = useTheme();

  const [pageSize, setPageSize] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const { data, loading, error, refetch } = useQuery<InspectionTypesData>(
    GetInspectionTypes,
    {
      variables: { name_Icontains: appliedSearch || undefined },
      fetchPolicy: "cache-and-network",
    },
  );
  useRefetchOnRefresh(refetch);

  const [deleteInspectionType, { loading: deleteLoading }] = useMutation(
    DeleteInspectionType,
    { onCompleted: () => refetch() },
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

  // El backend devuelve todos los tipos sin paginar; aplicamos paginación
  // en cliente para no perder UX. Memo antes del early-return para no romper
  // el orden de hooks.
  const allTypes = useMemo(
    () => data?.inspectionTypes?.edges?.map((e) => e.node) || [],
    [data?.inspectionTypes?.edges],
  );
  const types = useMemo(() => {
    const offset = (currentPage - 1) * pageSize;
    return allTypes.slice(offset, offset + pageSize);
  }, [allTypes, currentPage, pageSize]);

  if (!user || user.userType !== "ADMINISTRADOR") return null;

  const totalCount = data?.inspectionTypes?.totalCount || allTypes.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleDeleteClick = (id: string, name: string) => {
    setToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    try {
      const { data: res } = await deleteInspectionType({
        variables: { id: toDelete.id },
      });
      if (
        res?.deleteInspectionType?.errors &&
        res.deleteInspectionType.errors.length > 0
      ) {
        processGraphQLErrors(res.deleteInspectionType.errors);
        return;
      }
      if (res?.deleteInspectionType?.success) {
        setIsDeleteModalOpen(false);
        setToDelete(null);
      }
    } catch (err) {
      notifyError(
        fromGenericError(err, "Error al eliminar tipo de inspección"),
      );
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchTerm);
    setCurrentPage(1);
  };

  return (
    <div className="bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      <div className="mx-auto max-w-[1320px] px-3 pb-16 pt-5 sm:px-8 sm:pt-8">
        <AdminTabs active="inspection-types" />

        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
              Administración · Catálogo
            </div>
            <h1 className="m-0 mt-1.5 text-3xl font-extrabold tracking-tighter sm:text-[34px]">
              Tipos de inspección
            </h1>
            <p className="m-0 mt-1.5 text-sm text-ink-2 dark:text-dark-ink-2">
              {totalCount}{" "}
              {totalCount === 1 ? "tipo configurado" : "tipos configurados"}
            </p>
          </div>
          <Button
            type="button"
            icon={<Plus size={14} />}
            onClick={() => router.push("/admin/inspection-types/create")}
          >
            Nuevo tipo
          </Button>
        </header>

        <GradientBorder radius={16} className="mb-5">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-wrap items-center gap-2.5 p-3.5"
          >
            <div className="flex flex-1 items-center gap-2.5 rounded-[12px] border border-hairline bg-bg-2 px-3.5 py-2.5 dark:border-hairline-dark dark:bg-white/[0.03]">
              <Search size={16} className="text-ink-2 dark:text-dark-ink-2" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre…"
                className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3 dark:text-dark-ink"
              />
            </div>
            <Button type="submit" size="sm">
              Buscar
            </Button>
          </form>
        </GradientBorder>

        {loading && types.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-ink-2 dark:text-dark-ink-2">
            <Loader2 size={18} className="mr-2 animate-spin" /> Cargando tipos…
          </div>
        ) : error ? (
          <Card
            radius={16}
            className="!border-[rgba(var(--accent-rgb),0.32)] !bg-[rgba(var(--accent-rgb),0.06)]"
          >
            <div className="text-sm text-primary-700">
              Error al cargar tipos: {error.message}
            </div>
          </Card>
        ) : types.length === 0 ? (
          <Card radius={20}>
            <div className="flex flex-col items-center gap-2.5 py-10 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-bg-2 text-ink-2 dark:bg-white/[0.05] dark:text-dark-ink-2">
                <ShieldCheck size={22} />
              </div>
              <div className="text-base font-semibold">
                No hay tipos configurados
              </div>
              <Button
                type="button"
                size="sm"
                icon={<Plus size={13} />}
                onClick={() => router.push("/admin/inspection-types/create")}
              >
                Crear primero
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {types.map((t) => (
                <Card key={t.id} radius={18}>
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-grad-info text-white">
                      <ShieldCheck size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-bold tracking-tight">
                        {t.name}
                      </div>
                      <div className="text-[12px] text-ink-2 dark:text-dark-ink-2">
                        Actualizado{" "}
                        {new Date(t.updatedAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3.5 flex gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={<Edit3 size={13} />}
                      className="!flex-1 !justify-center"
                      onClick={() =>
                        router.push(
                          `/admin/inspection-types/edit?id=${t.id}`,
                        )
                      }
                    >
                      Editar
                    </Button>
                    <IconBtn
                      tone="bad"
                      title="Eliminar"
                      disabled={deleteLoading}
                      onClick={() => handleDeleteClick(t.id, t.name)}
                    >
                      <Trash2 size={13} />
                    </IconBtn>
                  </div>
                </Card>
              ))}
            </div>

            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              total={totalCount}
              shown={types.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(n) => {
                setPageSize(n);
                setCurrentPage(1);
              }}
            />
          </>
        )}
      </div>

      <ConfirmationDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Eliminar tipo de inspección"
        message={`¿Estás seguro que deseas eliminar el tipo ${
          toDelete?.name || ""
        }? Esta acción no se puede deshacer.`}
        isDark={isDark}
        isLoading={deleteLoading}
      />
    </div>
  );
}
