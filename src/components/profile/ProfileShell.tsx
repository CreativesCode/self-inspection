"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GradientBorder } from "@/components/ui/GradientBorder";
import { Pill } from "@/components/ui/Pill";
import { SectionHead } from "@/components/ui/SectionHead";
import { useTheme } from "@/contexts/ThemeContext";
import { UploadProfilePicture } from "@/graphql/auth";
import {
  GraphQLAppError,
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { cn, getAvatarColor, getFullImageUrl } from "@/lib/utils";
import { useAuthStore } from "@/store";
import { useMutation } from "@/lib/apollo-compat";
import {
  AlertCircle,
  Building2,
  Camera,
  ChevronDown,
  Edit3,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  TrendingUp,
  User as UserIcon,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

interface UploadProfilePictureResponse {
  uploadProfilePicture: {
    success: boolean;
    profilePictureUrl: string | null;
    errors: GraphQLAppError[] | null;
  };
}

export type ProfileQuickAction = {
  label: string;
  href: string;
  Icon?: React.ComponentType<{ size?: number | string }>;
};

export type ProfileStat = {
  label: string;
  value: string | number;
  detail?: string;
  tone: "brand" | "ok" | "info" | "warn" | "bad";
  Icon?: React.ComponentType<{ size?: number | string }>;
};

export type ProfileSystemStatusRow = {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "bad" | "info" | "neutral";
};

export type ProfileTopUser = {
  id: string;
  name: string;
  metricA?: number | string;
  metricB?: number | string;
};

type ProfileShellProps = {
  /** Pill mostrada al lado del nombre (rol). */
  roleLabel: string;
  /** Subtítulo bajo el título de la página. */
  roleSubtitle?: string;
  /** Lista de KPIs grandes. Mostrados como cards. */
  stats: ProfileStat[];
  /** Acciones rápidas en sidebar (botones que enrutan). */
  quickActions?: ProfileQuickAction[];
  /** Filas de "Estado del sistema". Se renderiza una card sólo si hay filas. */
  systemStatus?: ProfileSystemStatusRow[];
  /** Etiquetas de las dos métricas mostradas para Top usuarios. */
  topUsersMetricLabels?: { a?: string; b?: string };
  /** Top usuarios para el sidebar. */
  topUsers?: ProfileTopUser[];
  /** Loading state propagado para mostrar skeleton en las cards de la sidebar. */
  loadingSidebar?: boolean;
};

/**
 * ProfileShell — layout compartido por las pantallas de perfil (Admin,
 * Inspector, Jefe de obra). Renderiza el hero con avatar + foto upload,
 * la grid KPI a la izquierda y el sidebar con contacto + acciones rápidas
 * + estado del sistema + top usuarios opcionales.
 */
export function ProfileShell({
  roleLabel,
  roleSubtitle,
  stats,
  quickActions = [],
  systemStatus,
  topUsers,
  topUsersMetricLabels,
  loadingSidebar,
}: ProfileShellProps) {
  const user = useAuthStore((s) => s.user);
  const refetchMe = useAuthStore((s) => s.refetchMe);
  const makeAuthenticatedRequest = useAuthStore(
    (s) => s.makeAuthenticatedRequest,
  );
  const router = useRouter();
  const { isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [photoValidationError, setPhotoValidationError] = useState<
    string | null
  >(null);

  const [uploadProfilePicture] =
    useMutation<UploadProfilePictureResponse>(UploadProfilePicture);

  if (!user) return null;

  const initials =
    `${(user.firstName || "").charAt(0)}${(user.lastName || "").charAt(0)}`.toUpperCase();
  const profilePictureUrl = user.profile?.profilePicture
    ? getFullImageUrl(user.profile.profilePicture)
    : null;

  const convertImageToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });

  const handleImageUpload = async (file: File): Promise<void> => {
    try {
      setIsUploading(true);
      const base64Image = await convertImageToBase64(file);
      const { data } = await makeAuthenticatedRequest(() =>
        uploadProfilePicture({
          variables: { image: base64Image, fileName: file.name },
        }),
      );
      if (
        data?.uploadProfilePicture?.errors &&
        data.uploadProfilePicture.errors.length > 0
      ) {
        processGraphQLErrors(data.uploadProfilePicture.errors);
        return;
      }
      if (data?.uploadProfilePicture.success) {
        setPhotoValidationError(null);
        await refetchMe();
      }
    } catch (err) {
      notifyError(
        fromGenericError(err, "Error al subir la imagen de perfil"),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoValidationError(null);
    const MAX = 10 * 1024 * 1024;
    if (file.size > MAX) {
      setPhotoValidationError(
        `La imagen es demasiado grande (${(file.size / 1024 / 1024).toFixed(
          2,
        )}MB). Máx. 10MB.`,
      );
      if (e.target) e.target.value = "";
      return;
    }
    handleImageUpload(file);
  };

  const contactRows: Array<{
    Icon: React.ComponentType<{ size?: number | string }>;
    label: string;
    value: string;
  }> = [
    { Icon: Mail, label: "Email", value: user.email || "—" },
    {
      Icon: Phone,
      label: "Teléfono",
      value: user.profile?.phoneNumber || "No proporcionado",
    },
    {
      Icon: MapPin,
      label: "Dirección",
      value: user.profile?.address || "No proporcionada",
    },
  ];

  const STATUS_DOT: Record<NonNullable<ProfileSystemStatusRow["tone"]>, string> =
    {
      ok: "bg-ok-700",
      warn: "bg-warn-700",
      bad: "bg-primary-500",
      info: "bg-info-700",
      neutral: "bg-ink-3",
    };

  return (
    <div className="bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      <div className="mx-auto max-w-[1320px] px-3 pb-16 pt-5 sm:px-8 sm:pt-8">
        {/* ─── Header ─── */}
        <header className="mb-5">
          <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
            Mi perfil
          </div>
          <h1 className="m-0 mt-1.5 text-3xl font-extrabold tracking-tighter sm:text-[34px]">
            {user.firstName} {user.lastName}
          </h1>
          {roleSubtitle && (
            <p className="m-0 mt-1.5 text-sm text-ink-2 dark:text-dark-ink-2">
              {roleSubtitle}
            </p>
          )}
        </header>

        {/* ─── Hero ─── */}
        <GradientBorder radius={26} className="mb-5 overflow-hidden">
          <div
            className="relative flex flex-col items-stretch gap-4 p-4 sm:gap-5 sm:p-6 lg:flex-row lg:items-center lg:gap-7"
            style={{
              borderRadius: 25,
              background: isDark
                ? "radial-gradient(800px 240px at 100% 0%, rgba(var(--accent-rgb),0.10), transparent 60%)"
                : "radial-gradient(800px 240px at 100% 0%, rgba(247,140,124,0.18), transparent 60%)",
            }}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="group relative block"
                title="Cambiar foto"
              >
                {profilePictureUrl ? (
                  <Image
                    src={profilePictureUrl}
                    alt={`${user.firstName} ${user.lastName}`}
                    width={108}
                    height={108}
                    className="block h-[108px] w-[108px] rounded-[24px] object-cover shadow-soft"
                    unoptimized
                    priority
                  />
                ) : (
                  <div
                    className="flex h-[108px] w-[108px] items-center justify-center rounded-[24px] text-[40px] font-extrabold tracking-tighter text-white shadow-[0_20px_40px_-16px_rgba(var(--accent-rgb),0.6)]"
                    style={{
                      background: getAvatarColor(
                        `${user.firstName}${user.lastName}`,
                      ),
                    }}
                  >
                    {initials}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface text-ink-2 shadow-soft transition group-hover:brightness-95 dark:border-hairline-dark dark:bg-dark-surface dark:text-dark-ink-2">
                  <Camera size={14} />
                </span>
                {isUploading && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-[24px] bg-black/55 text-white">
                    <span className="inline-flex flex-col items-center gap-1.5">
                      <span className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span className="text-[11px] font-semibold">
                        Subiendo…
                      </span>
                    </span>
                  </span>
                )}
              </button>
            </div>

            {/* Texto y badges */}
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Pill tone="brand">
                  <ShieldCheck size={11} /> {roleLabel}
                </Pill>
                {user.isActive && (
                  <Pill tone="ok">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-ok-700" />{" "}
                    Activo
                  </Pill>
                )}
              </div>
              <h2 className="m-0 text-[28px] font-extrabold tracking-tighter sm:text-[32px]">
                {user.firstName} {user.lastName}
              </h2>
              <p className="m-0 mt-1 text-sm text-ink-2 dark:text-dark-ink-2">
                {user.email}
                {user.profile?.phoneNumber && ` · ${user.profile.phoneNumber}`}
                {user.profile?.address && ` · ${user.profile.address}`}
              </p>
            </div>

            {/* CTA */}
            <div className="flex shrink-0 flex-col gap-2.5 lg:items-end">
              <Button
                type="button"
                icon={<Edit3 size={14} />}
                onClick={() => router.push("/profile/edit")}
              >
                Editar perfil
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<Lock size={13} />}
                onClick={() => router.push("/profile/edit?focus=password")}
              >
                Cambiar contraseña
              </Button>
            </div>
          </div>
        </GradientBorder>

        {/* Error de validación */}
        {photoValidationError && (
          <Card
            radius={14}
            className="mb-4 !border-[rgba(var(--accent-rgb),0.32)] !bg-[rgba(var(--accent-rgb),0.06)]"
          >
            <div className="flex items-start gap-2 text-[13px] text-primary-700">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{photoValidationError}</span>
            </div>
          </Card>
        )}

        {/* ─── Grid principal ─── */}
        <div className="grid min-w-0 gap-5 lg:grid-cols-[1.4fr_1fr]">
          {/* IZQUIERDA */}
          <div className="flex min-w-0 flex-col gap-5">
            {/* Stats KPI */}
            <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5">
              {stats.map((s, i) => (
                <KpiMini key={i} stat={s} />
              ))}
            </div>

            {/* Sobre mí */}
            <Card radius={20} padding={16} className="overflow-hidden">
              <SectionHead
                title="Sobre mí"
                subtitle="Información mostrada en evaluaciones"
                icon={<UserIcon size={16} />}
              />
              <div
                className={cn(
                  "mt-4 rounded-[14px] border p-4 text-sm leading-relaxed",
                  "border-hairline bg-bg-2 dark:border-hairline-dark dark:bg-white/[0.03]",
                )}
              >
                {user.profile?.bio || (
                  <span className="text-ink-2 dark:text-dark-ink-2">
                    Aún no has añadido una biografía. Pulsa{" "}
                    <button
                      type="button"
                      onClick={() => router.push("/profile/edit")}
                      className="font-semibold text-primary-500 hover:text-primary-600"
                    >
                      editar perfil
                    </button>{" "}
                    para contar tu experiencia.
                  </span>
                )}
              </div>
            </Card>
          </div>

          {/* SIDEBAR */}
          <div className="flex min-w-0 flex-col gap-5">
            {/* Datos de contacto */}
            <Card radius={20} padding={16} className="overflow-hidden">
              <SectionHead
                title="Datos de contacto"
                icon={<Mail size={16} />}
              />
              <div className="mt-4 grid gap-2.5">
                {contactRows.map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 overflow-hidden rounded-[12px] border border-hairline bg-bg-2 p-2.5 dark:border-hairline-dark dark:bg-white/[0.03] sm:gap-3 sm:p-3"
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[rgba(var(--accent-rgb),0.10)] text-primary-500">
                      <row.Icon size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-ink-2 dark:text-dark-ink-2">
                        {row.label}
                      </div>
                      <div className="truncate text-[13px] font-semibold">
                        {row.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Acciones rápidas */}
            {quickActions.length > 0 && (
              <Card radius={20} padding={16} className="overflow-hidden">
                <SectionHead
                  title="Acciones rápidas"
                  icon={<TrendingUp size={16} />}
                />
                <div className="mt-3.5 grid gap-2.5">
                  {quickActions.map((a, i) => {
                    const ActionIcon = a.Icon || Building2;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => router.push(a.href)}
                        className={cn(
                          "group flex items-center gap-3 rounded-[12px] border px-3.5 py-3 text-left transition-colors",
                          "border-hairline bg-surface text-ink hover:brightness-95",
                          "dark:border-hairline-dark dark:bg-dark-surface dark:text-dark-ink",
                        )}
                      >
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-grad-brand text-white">
                          <ActionIcon size={14} />
                        </span>
                        <span className="flex-1 text-[13px] font-semibold">
                          {a.label}
                        </span>
                        <ChevronDown
                          size={14}
                          className="-rotate-90 text-ink-2 dark:text-dark-ink-2"
                        />
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Estado del sistema */}
            {systemStatus && systemStatus.length > 0 && (
              <Card radius={20} padding={16} className="overflow-hidden">
                <SectionHead
                  title="Estado del sistema"
                  icon={<ShieldCheck size={16} />}
                />
                <div className="mt-3 grid gap-0">
                  {systemStatus.map((row, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between py-2.5 text-[13px]",
                        i < systemStatus.length - 1 &&
                          "border-b border-dashed border-hairline dark:border-hairline-dark",
                      )}
                    >
                      <span className="text-ink-2 dark:text-dark-ink-2">
                        {row.label}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-block h-2 w-2 rounded-full",
                            STATUS_DOT[row.tone || "neutral"],
                          )}
                        />
                        <span className="font-semibold">
                          {loadingSidebar ? "…" : row.value}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Top usuarios */}
            {topUsers && topUsers.length > 0 && (
              <Card radius={20} padding={16} className="overflow-hidden">
                <SectionHead
                  title="Top usuarios"
                  subtitle="Por número de inspecciones"
                  icon={<Users size={16} />}
                />
                <div className="mt-3.5 grid gap-2.5">
                  {topUsers.map((u, i) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 rounded-[12px] border border-hairline bg-bg-2 px-3 py-2.5 dark:border-hairline-dark dark:bg-white/[0.03]"
                    >
                      <span
                        className={cn(
                          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-[12px] font-extrabold",
                          i < 3
                            ? "bg-grad-brand text-white"
                            : "bg-surface text-ink-2 dark:bg-white/[0.05] dark:text-dark-ink-2",
                        )}
                      >
                        {i + 1}
                      </span>
                      <Avatar
                        name={u.name
                          .split(" ")
                          .map((w) => w.charAt(0))
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                        size={32}
                      />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                        {u.name}
                      </span>
                      <span className="flex items-baseline gap-1.5 text-[12px]">
                        {u.metricA !== undefined && (
                          <span
                            title={topUsersMetricLabels?.a || "Métrica"}
                            className="font-bold text-primary-500"
                          >
                            {u.metricA}
                          </span>
                        )}
                        {u.metricA !== undefined && u.metricB !== undefined && (
                          <span className="text-ink-3 dark:text-dark-ink-2">
                            ·
                          </span>
                        )}
                        {u.metricB !== undefined && (
                          <span
                            title={topUsersMetricLabels?.b || "Métrica"}
                            className="font-bold text-primary-700"
                          >
                            {u.metricB}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiMini({ stat }: { stat: ProfileStat }) {
  const TONE_BG: Record<ProfileStat["tone"], string> = {
    brand: "bg-grad-brand",
    ok: "bg-grad-ok",
    warn: "bg-grad-warn",
    info: "bg-grad-info",
    bad: "bg-grad-bad",
  };
  const Icon = stat.Icon || TrendingUp;
  return (
    <Card radius={18} padding={14} className="overflow-hidden">
      <div className="flex items-start justify-between gap-1.5">
        <span className="min-w-0 flex-1 break-words text-[10px] font-bold uppercase leading-snug tracking-wider text-ink-2 dark:text-dark-ink-2 sm:text-[11px] sm:tracking-widest">
          {stat.label}
        </span>
        <span
          className={cn(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] text-white sm:h-7 sm:w-7 sm:rounded-[8px]",
            TONE_BG[stat.tone],
          )}
        >
          <Icon size={12} />
        </span>
      </div>
      <div className="mt-1 break-all text-[20px] font-extrabold leading-tight tracking-tighter sm:text-[26px] lg:text-[30px]">
        {stat.value}
      </div>
      {stat.detail && (
        <div className="break-words text-[10px] text-ink-2 dark:text-dark-ink-2 sm:text-xs">
          {stat.detail}
        </div>
      )}
    </Card>
  );
}
