"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GradientBorder } from "@/components/ui/GradientBorder";
import { IconBtn } from "@/components/ui/IconBtn";
import { PageBtn } from "@/components/ui/PageBtn";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { SectionHead } from "@/components/ui/SectionHead";
import { GetUser } from "@/graphql/auth";
import { GetInspections } from "@/graphql/inspections";
import { cn, getFullImageUrl, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store";
import { InspectionEdge, InspectionsResponse } from "@/types/types";
import { useQuery } from "@/lib/apollo-compat";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Edit3,
  Eye,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface UserProfile {
  id: string;
  profilePicture: string;
  phoneNumber: string;
  address: string;
  ci: string;
  bio: string;
}

interface UserData {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: string;
    isActive: boolean;
    isStaff: boolean;
    isSuperuser: boolean;
    profile: UserProfile;
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

export default function UserDetailsPageClient() {
  const currentUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const userId = searchParams.get("id");
  const decodedId = decodeURIComponent(userId || "");

  const { data, loading, error } = useQuery<UserData>(GetUser, {
    variables: { id: decodedId },
    skip: !decodedId,
  });

  const offset = (currentPage - 1) * pageSize;
  const { data: inspectionsData, loading: inspectionsLoading } =
    useQuery<InspectionsResponse>(GetInspections, {
      variables: {
        userId: decodedId,
        first: pageSize,
        pageOffset: offset,
      },
      skip: !decodedId,
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    });

  useEffect(() => {
    if (
      !isAuthenticated &&
      currentUser?.userType !== "ADMINISTRADOR" &&
      currentUser?.userType !== "JEFE_DE_OBRA"
    ) {
      router.push("/");
    }
  }, [isAuthenticated, currentUser, router]);

  if (!userId) {
    return (
      <div className="bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
        <div className="mx-auto flex max-w-[1320px] items-center justify-center px-6 py-24">
          <Card radius={16}>
            <div className="text-sm text-primary-700">
              Error: ID de usuario no proporcionado
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="inline-flex items-center gap-3 text-sm text-ink-2 dark:text-dark-ink-2">
          <Loader2 size={18} className="animate-spin" /> Cargando usuario…
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
            Error al cargar el usuario: {error.message}
          </div>
        </Card>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="px-6 py-8">
        <Card radius={16}>
          <div className="text-sm text-ink-2 dark:text-dark-ink-2">
            Usuario no encontrado.
          </div>
        </Card>
      </div>
    );
  }

  const userData = data.user;
  const initials =
    `${(userData.firstName || "").charAt(0)}${(userData.lastName || "").charAt(0)}`.toUpperCase();
  const profilePic = userData.profile?.profilePicture
    ? getFullImageUrl(userData.profile.profilePicture)
    : null;

  const inspections = inspectionsData?.inspections?.edges ?? [];
  const totalInspections = inspectionsData?.inspections?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalInspections / pageSize));

  return (
    <div className="bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      <div className="mx-auto max-w-[1320px] px-3 pb-16 pt-5 sm:px-8 sm:pt-8">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-sm text-ink-2 dark:text-dark-ink-2">
          <button
            onClick={() => router.push("/admin/users")}
            className="inline-flex items-center gap-1 hover:text-ink dark:hover:text-dark-ink"
          >
            <ChevronLeft size={13} /> Usuarios
          </button>
          <span>·</span>
          <span className="font-semibold text-ink dark:text-dark-ink">
            {userData.firstName} {userData.lastName}
          </span>
        </nav>

        {/* Hero */}
        <GradientBorder radius={26} className="mb-5">
          <div className="flex flex-col items-stretch gap-5 p-6 lg:flex-row lg:items-center lg:gap-6">
            <div className="shrink-0">
              {profilePic ? (
                <div className="h-[96px] w-[96px] overflow-hidden rounded-[20px]">
                  <Image
                    src={profilePic}
                    alt={`${userData.firstName} ${userData.lastName}`}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <Avatar name={initials} size={96} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Pill tone={ROLE_TONE[userData.userType] || "neutral"}>
                  <ShieldCheck size={11} />{" "}
                  {ROLE_LABEL[userData.userType] || userData.userType}
                </Pill>
                {userData.isActive ? (
                  <Pill tone="ok">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-ok-700" />{" "}
                    Activo
                  </Pill>
                ) : (
                  <Pill tone="warn">Inactivo</Pill>
                )}
              </div>
              <h1 className="m-0 text-[28px] font-extrabold tracking-tighter sm:text-[32px]">
                {userData.firstName} {userData.lastName}
              </h1>
              <a
                href={`mailto:${userData.email}`}
                className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink dark:text-dark-ink-2 dark:hover:text-dark-ink"
              >
                <Mail size={12} /> {userData.email}
              </a>
            </div>
            <div className="flex shrink-0 flex-col gap-2.5 lg:items-end">
              <Button
                type="button"
                icon={<Edit3 size={14} />}
                onClick={() =>
                  router.push(`/admin/users/edit?id=${userData.id}`)
                }
              >
                Editar usuario
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                Volver
              </Button>
            </div>
          </div>
        </GradientBorder>

        {/* Stats / Contacto */}
        <div className="mb-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Card radius={20}>
            <SectionHead
              title="Información personal"
              icon={<UserIcon size={16} />}
            />
            <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Row
                Icon={Phone}
                label="Número de teléfono"
                value={userData.profile?.phoneNumber || "No disponible"}
              />
              <Row
                Icon={MapPin}
                label="Dirección"
                value={userData.profile?.address || "No disponible"}
              />
            </dl>
            {userData.profile?.bio && (
              <>
                <div className="my-5 h-px bg-hairline dark:bg-hairline-dark" />
                <div className="text-[11px] font-bold uppercase tracking-widest text-ink-2 dark:text-dark-ink-2">
                  Biografía
                </div>
                <p className="m-0 mt-1.5 text-[14px] leading-relaxed">
                  {userData.profile.bio}
                </p>
              </>
            )}
          </Card>

          <Card radius={20}>
            <SectionHead
              title="Estado"
              subtitle="Permisos y rol en el sistema"
              icon={<ShieldCheck size={16} />}
            />
            <div className="mt-4 grid gap-3">
              <KvRow label="Rol" value={ROLE_LABEL[userData.userType] || userData.userType} />
              <KvRow
                label="Estado"
                value={userData.isActive ? "Activo" : "Inactivo"}
                tone={userData.isActive ? "ok" : "warn"}
              />
              <KvRow
                label="Staff"
                value={userData.isStaff ? "Sí" : "No"}
              />
              <KvRow
                label="Superusuario"
                value={userData.isSuperuser ? "Sí" : "No"}
              />
            </div>
          </Card>
        </div>

        {/* Inspecciones asignadas */}
        <Card radius={20}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionHead
              title="Inspecciones asignadas"
              subtitle={`${totalInspections} ${totalInspections === 1 ? "inspección" : "inspecciones"} en total`}
              icon={<ClipboardList size={16} />}
            />
          </div>

          {inspectionsLoading ? (
            <div className="mt-4 flex items-center justify-center py-10 text-sm text-ink-2 dark:text-dark-ink-2">
              <Loader2 size={18} className="mr-2 animate-spin" /> Cargando
              inspecciones…
            </div>
          ) : inspections.length === 0 ? (
            <div className="mt-4 rounded-[14px] border border-dashed border-hairline bg-bg-2 p-6 text-center text-sm text-ink-2 dark:border-hairline-dark dark:bg-white/[0.03] dark:text-dark-ink-2">
              Este usuario no tiene inspecciones asignadas.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <div className="min-w-[820px]">
                <div
                  className="grid items-center gap-3 border-b border-hairline px-3 pb-3 text-[11px] font-bold uppercase tracking-widest text-ink-2 dark:border-hairline-dark dark:text-dark-ink-2"
                  style={{
                    gridTemplateColumns:
                      "110px 70px minmax(140px,1fr) minmax(180px,1.4fr) 130px 80px",
                  }}
                >
                  <span>Código</span>
                  <span>TI</span>
                  <span>Cliente</span>
                  <span>Actividad</span>
                  <span>Fecha</span>
                  <span className="text-right">—</span>
                </div>
                {inspections.map(({ node: inspection }: InspectionEdge) => {
                  const activities =
                    inspection.activities?.edges
                      ?.map((edge) => edge.node.activityText)
                      .join(", ") || "Sin actividades";
                  return (
                    <div
                      key={inspection.id}
                      className="grid items-center gap-3 border-b border-hairline px-3 py-3 text-[13px] dark:border-hairline-dark"
                      style={{
                        gridTemplateColumns:
                          "110px 70px minmax(140px,1fr) minmax(180px,1.4fr) 130px 80px",
                      }}
                    >
                      <span className="font-mono text-[12px] font-semibold">
                        {inspection.projectCode}
                      </span>
                      <span
                        className="truncate text-ink-2 dark:text-dark-ink-2"
                        title={inspection.inspectionType?.name}
                      >
                        {inspection.inspectionType?.name
                          ? getInitials(inspection.inspectionType.name)
                          : "—"}
                      </span>
                      <span
                        className="truncate"
                        title={inspection.client?.clientName}
                      >
                        {inspection.client?.clientName || "—"}
                      </span>
                      <span
                        className="truncate text-ink-2 dark:text-dark-ink-2"
                        title={activities}
                      >
                        {activities}
                      </span>
                      <span className="text-ink-2 dark:text-dark-ink-2">
                        {new Date(inspection.dateTime).toLocaleDateString(
                          "es-ES",
                          { day: "2-digit", month: "2-digit", year: "2-digit" },
                        )}
                      </span>
                      <span className="flex justify-end">
                        <IconBtn
                          tone="info"
                          title="Ver inspección"
                          onClick={() =>
                            router.push(
                              `/inspections/details?id=${inspection.id}`,
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

              {/* Paginación */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px] text-ink-2 dark:text-dark-ink-2">
                <div className="flex items-center gap-3">
                  <span>
                    Mostrando {inspections.length} de {totalInspections}{" "}
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
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
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
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ size?: number | string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[rgba(var(--accent-rgb),0.10)] text-primary-500">
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-widest text-ink-2 dark:text-dark-ink-2">
          {label}
        </div>
        <div className="truncate text-[13px] font-semibold" title={value}>
          {value}
        </div>
      </div>
    </div>
  );
}

function KvRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: PillTone;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 py-2 text-[13px]",
      )}
    >
      <span className="text-ink-2 dark:text-dark-ink-2">{label}</span>
      {tone ? (
        <Pill tone={tone}>{value}</Pill>
      ) : (
        <span className="font-semibold">{value}</span>
      )}
    </div>
  );
}

