"use client";

import { AdminTabs } from "@/components/admin/AdminTabs";
import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { GradientBorder } from "@/components/ui/GradientBorder";
import { IconBtn } from "@/components/ui/IconBtn";
import { PageBtn } from "@/components/ui/PageBtn";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { useTheme } from "@/contexts/ThemeContext";
import { DeleteUser, GetUsers } from "@/graphql/auth";
import {
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { cn, getFullImageUrl } from "@/lib/utils";
import { useAuthStore } from "@/store";
import { useMutation, useQuery } from "@/lib/apollo-compat";
import { useRefetchOnRefresh } from "@/hooks/useRefetchOnRefresh";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Filter,
  FilterX,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UserProfile {
  phoneNumber: string;
  address: string;
  profilePicture: string;
  bio: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  isActive: boolean;
  isStaff: boolean;
  isSuperuser: boolean;
  profile: UserProfile;
}

interface UserEdge {
  node: User;
}

interface UsersData {
  users: {
    edges: UserEdge[];
    totalCount: number;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
      endCursor: string;
    };
  };
}

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  JEFE_DE_OBRA: "Jefe de obra",
  JEFE_DE_TRABAJO: "Jefe de trabajo",
  INSPECTOR: "Inspector",
  TECNICO: "Técnico",
};

const ROLE_TONE: Record<string, PillTone> = {
  ADMINISTRADOR: "brand",
  JEFE_DE_OBRA: "info",
  JEFE_DE_TRABAJO: "info",
  INSPECTOR: "ok",
  TECNICO: "neutral",
};

const ROLE_FILTERS: Array<{ label: string; value: string }> = [
  { label: "Todos", value: "" },
  { label: "Administradores", value: "ADMINISTRADOR" },
  { label: "Jefes de obra", value: "JEFE_DE_OBRA" },
  { label: "Jefes de trabajo", value: "JEFE_DE_TRABAJO" },
  { label: "Inspectores", value: "INSPECTOR" },
  { label: "Técnicos", value: "TECNICO" },
];

const getInitials = (firstName: string, lastName: string) =>
  `${(firstName || "").charAt(0)}${(lastName || "").charAt(0)}`.toUpperCase();

export default function UsersManagementPage() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const { isDark } = useTheme();

  const [pageSize, setPageSize] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [emailFilter, setEmailFilter] = useState("");
  const [firstNameFilter, setFirstNameFilter] = useState("");
  const [lastNameFilter, setLastNameFilter] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    email: "",
    firstName: "",
    lastName: "",
    userType: "",
  });

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const offset = (currentPage - 1) * pageSize;
  const queryVariables = {
    first: pageSize,
    pageOffset: offset,
    email_Icontains: appliedFilters.email || undefined,
    firstName_Icontains: appliedFilters.firstName || undefined,
    lastName_Icontains: appliedFilters.lastName || undefined,
    userType: appliedFilters.userType || undefined,
  };

  const { data, loading, error, refetch } = useQuery<UsersData>(GetUsers, {
    variables: queryVariables,
    fetchPolicy: "cache-and-network",
  });
  useRefetchOnRefresh(refetch);

  const [deleteUser, { loading: deleteLoading }] = useMutation(DeleteUser, {
    onCompleted: () => refetch(),
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (
      !isAuthenticated ||
      (user &&
        user.userType !== "ADMINISTRADOR" &&
        user.userType !== "JEFE_DE_OBRA" &&
        user.userType !== "TECNICO")
    ) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (data?.users?.totalCount) {
      setTotalPages(Math.ceil(data.users.totalCount / pageSize));
    }
  }, [data?.users?.totalCount, pageSize]);

  if (
    !user ||
    (user.userType !== "ADMINISTRADOR" &&
      user.userType !== "JEFE_DE_OBRA" &&
      user.userType !== "TECNICO")
  ) {
    return null;
  }

  const users = data?.users?.edges?.map((e) => e.node) || [];
  const totalCount = data?.users?.totalCount || 0;

  const handleDeleteClick = (id: string, name: string) => {
    setUserToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      const { data: res } = await deleteUser({
        variables: { id: userToDelete.id },
      });
      if (res?.deleteUser?.errors && res.deleteUser.errors.length > 0) {
        processGraphQLErrors(res.deleteUser.errors);
        return;
      }
      if (res?.deleteUser?.success) {
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      }
    } catch (err) {
      notifyError(fromGenericError(err, "Error al eliminar usuario"));
    }
  };

  const handleFilterChange = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters({
      email: emailFilter,
      firstName: firstNameFilter,
      lastName: lastNameFilter,
      userType: userTypeFilter,
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setEmailFilter("");
    setFirstNameFilter("");
    setLastNameFilter("");
    setUserTypeFilter("");
    setAppliedFilters({
      email: "",
      firstName: "",
      lastName: "",
      userType: "",
    });
    setCurrentPage(1);
  };

  const hasFilters =
    appliedFilters.email ||
    appliedFilters.firstName ||
    appliedFilters.lastName ||
    appliedFilters.userType;

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.userType] = (acc[u.userType] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      <div className="mx-auto max-w-[1320px] px-3 pb-16 pt-5 sm:px-8 sm:pt-8">
        <AdminTabs active="users" />

        {/* Header */}
        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
              Administración · Equipo
            </div>
            <h1 className="m-0 mt-1.5 text-3xl font-extrabold tracking-tighter sm:text-[34px]">
              Gestión de usuarios
            </h1>
            <p className="m-0 mt-1.5 text-sm text-ink-2 dark:text-dark-ink-2">
              {totalCount} {totalCount === 1 ? "usuario" : "usuarios"} en el
              sistema
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
            <Button
              type="button"
              icon={<Plus size={14} />}
              onClick={() => router.push("/admin/users/create")}
            >
              Nuevo usuario
            </Button>
          </div>
        </header>

        {/* Pills de rol */}
        <div className="mb-4 flex flex-wrap gap-2">
          {ROLE_FILTERS.map((r) => {
            const isActive = appliedFilters.userType === r.value;
            const count =
              r.value === ""
                ? users.length
                : roleCounts[r.value] || 0;
            return (
              <button
                key={r.value || "todos"}
                type="button"
                onClick={() => {
                  setUserTypeFilter(r.value);
                  setAppliedFilters((p) => ({ ...p, userType: r.value }));
                  setCurrentPage(1);
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors",
                  isActive
                    ? "bg-grad-brand text-white"
                    : "border border-hairline bg-surface text-ink-2 hover:brightness-95 dark:border-hairline-dark dark:bg-dark-surface dark:text-dark-ink-2",
                )}
              >
                {r.label}
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-bg-2 text-ink-2 dark:bg-white/[0.06] dark:text-dark-ink-2",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <GradientBorder radius={16} className="mb-4">
          <form
            onSubmit={handleFilterChange}
            className="flex flex-wrap items-center gap-2.5 p-3.5"
          >
            <div className="flex flex-1 items-center gap-2.5 rounded-[12px] border border-hairline bg-bg-2 px-3.5 py-2.5 dark:border-hairline-dark dark:bg-white/[0.03]">
              <Search size={16} className="text-ink-2 dark:text-dark-ink-2" />
              <input
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                placeholder="Buscar por email…"
                className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3 dark:text-dark-ink"
              />
              {emailFilter && (
                <button
                  type="button"
                  onClick={() => setEmailFilter("")}
                  className="text-ink-2 hover:text-ink dark:text-dark-ink-2 dark:hover:text-dark-ink"
                  title="Limpiar"
                >
                  ×
                </button>
              )}
            </div>
            <Button type="submit" size="sm">
              Buscar
            </Button>
          </form>
        </GradientBorder>

        {/* Filtros expandidos */}
        {isFilterExpanded && (
          <Card radius={16} className="mb-4">
            <form
              onSubmit={handleFilterChange}
              className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
            >
              <Field
                label="Email"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                placeholder="usuario@dominio…"
              />
              <Field
                label="Nombre"
                value={firstNameFilter}
                onChange={(e) => setFirstNameFilter(e.target.value)}
                placeholder="Filtrar por nombre"
              />
              <Field
                label="Apellido"
                value={lastNameFilter}
                onChange={(e) => setLastNameFilter(e.target.value)}
                placeholder="Filtrar por apellido"
              />
              <div className="flex flex-col">
                <label className="text-xs font-semibold tracking-tight text-ink-2 dark:text-dark-ink-2">
                  Tipo de usuario
                </label>
                <div className="mt-1.5 flex items-center gap-2.5 rounded-[12px] border border-hairline bg-bg-2 px-3.5 py-3 dark:border-hairline-dark dark:bg-white/[0.03]">
                  <select
                    value={userTypeFilter}
                    onChange={(e) => setUserTypeFilter(e.target.value)}
                    className="flex-1 cursor-pointer appearance-none bg-transparent text-sm text-ink outline-none dark:text-dark-ink"
                  >
                    <option value="">Todos</option>
                    {Object.entries(ROLE_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="text-ink-2 dark:text-dark-ink-2"
                  />
                </div>
              </div>
              <div className="flex items-end justify-end gap-2.5 sm:col-span-2 lg:col-span-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Limpiar
                </Button>
                <Button type="submit" size="sm">
                  Aplicar
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Loading / Error */}
        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="inline-flex items-center gap-3 text-sm text-ink-2 dark:text-dark-ink-2">
              <Loader2 size={18} className="animate-spin" /> Cargando usuarios…
            </div>
          </div>
        ) : error ? (
          <Card
            radius={16}
            className="!border-[rgba(var(--accent-rgb),0.32)] !bg-[rgba(var(--accent-rgb),0.06)]"
          >
            <div className="text-sm text-primary-700">
              Error al cargar los usuarios: {error.message}
            </div>
          </Card>
        ) : users.length === 0 ? (
          <Card radius={20}>
            <div className="flex flex-col items-center gap-2.5 py-10 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-bg-2 text-ink-2 dark:bg-white/[0.05] dark:text-dark-ink-2">
                <Search size={22} />
              </div>
              <div className="text-base font-semibold">
                No hay usuarios disponibles
              </div>
              {hasFilters && (
                <>
                  <div className="text-sm text-ink-2 dark:text-dark-ink-2">
                    No se encontraron resultados con los filtros aplicados.
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={clearFilters}
                  >
                    Limpiar filtros
                  </Button>
                </>
              )}
            </div>
          </Card>
        ) : (
          <>
            {/* Grid de cards */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {users.map((u) => (
                <Card key={u.id} radius={18} padding={0}>
                  <div
                    className="relative h-[64px] rounded-t-[17px]"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(var(--accent-rgb),0.12), rgba(247,140,124,0.20))",
                    }}
                  >
                    <div className="absolute right-3 top-3">
                      {u.isActive ? (
                        <Pill tone="ok">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-ok-700" />{" "}
                          Activo
                        </Pill>
                      ) : (
                        <Pill tone="warn">Inactivo</Pill>
                      )}
                    </div>
                  </div>
                  <div className="-mt-8 px-5 pb-5">
                    {u.profile?.profilePicture ? (
                      <div className="h-[62px] w-[62px] overflow-hidden rounded-full border-[3px] border-surface dark:border-dark-surface">
                        <Image
                          src={getFullImageUrl(u.profile.profilePicture) ?? ""}
                          alt={`${u.firstName} ${u.lastName}`}
                          width={62}
                          height={62}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <Avatar
                        name={getInitials(u.firstName, u.lastName)}
                        size={62}
                        ring
                      />
                    )}
                    <div className="mt-3">
                      <div className="text-[15px] font-bold tracking-tight">
                        {u.firstName} {u.lastName}
                      </div>
                      <div
                        className="mt-0.5 truncate text-[12px] text-ink-2 dark:text-dark-ink-2"
                        title={u.email}
                      >
                        {u.email}
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <Pill tone={ROLE_TONE[u.userType] || "neutral"}>
                        {ROLE_LABEL[u.userType] || u.userType}
                      </Pill>
                      {u.profile?.address && (
                        <Pill tone="neutral">
                          <MapPin size={10} /> {u.profile.address.split(",")[0]}
                        </Pill>
                      )}
                    </div>
                    <div className="mt-3.5 flex gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={<Eye size={13} />}
                        className="!flex-1 !justify-center"
                        onClick={() =>
                          router.push(`/admin/users/details?id=${u.id}`)
                        }
                      >
                        Ver
                      </Button>
                      <IconBtn
                        tone="info"
                        title="Editar"
                        onClick={() =>
                          router.push(`/admin/users/edit?id=${u.id}`)
                        }
                      >
                        <Edit3 size={13} />
                      </IconBtn>
                      <IconBtn
                        tone="bad"
                        title="Eliminar"
                        disabled={deleteLoading}
                        onClick={() =>
                          handleDeleteClick(
                            u.id,
                            `${u.firstName} ${u.lastName}`,
                          )
                        }
                      >
                        <Trash2 size={13} />
                      </IconBtn>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Paginación */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-[13px] text-ink-2 dark:text-dark-ink-2">
              <div className="flex items-center gap-3">
                <span>
                  Mostrando {users.length} de {totalCount}{" "}
                  {totalCount === 1 ? "usuario" : "usuarios"}
                </span>
                <div className="hidden items-center gap-1.5 sm:flex">
                  <span>·</span>
                  <span>Por página:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-md border border-hairline bg-surface px-2 py-1 dark:border-hairline-dark dark:bg-dark-surface"
                  >
                    <option value={8}>8</option>
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <PageBtn
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={13} />
                </PageBtn>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <PageBtn
                      key={page}
                      active={page === currentPage}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </PageBtn>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="px-1">…</span>
                    <PageBtn
                      active={totalPages === currentPage}
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </PageBtn>
                  </>
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
          </>
        )}
      </div>

      <ConfirmationDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Usuario"
        message={`¿Estás seguro que deseas eliminar al usuario ${
          userToDelete?.name || ""
        }? Esta acción no se puede deshacer.`}
        isDark={isDark}
        isLoading={deleteLoading}
      />
    </div>
  );
}
