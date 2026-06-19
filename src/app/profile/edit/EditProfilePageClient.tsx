"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { SectionHead } from "@/components/ui/SectionHead";
import { UpdateUser } from "@/graphql/auth";
import {
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";
import { useMutation } from "@/lib/apollo-compat";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User as UserIcon,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const PWD_MIN_LENGTH = 8;

function validatePassword(pwd: string): string | null {
  if (pwd.length < PWD_MIN_LENGTH)
    return `Mínimo ${PWD_MIN_LENGTH} caracteres.`;
  if (!/[A-Z]/.test(pwd)) return "Incluye al menos una mayúscula.";
  if (!/[a-z]/.test(pwd)) return "Incluye al menos una minúscula.";
  if (!/[0-9]/.test(pwd)) return "Incluye al menos un número.";
  return null;
}

export default function EditProfilePageClient() {
  const user = useAuthStore((s) => s.user);
  const refetchMe = useAuthStore((s) => s.refetchMe);
  const changePassword = useAuthStore((s) => s.changePassword);
  const makeAuthenticatedRequest = useAuthStore(
    (s) => s.makeAuthenticatedRequest,
  );
  const router = useRouter();
  const searchParams = useSearchParams();

  const initial = useMemo(
    () => ({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phoneNumber: user?.profile?.phoneNumber || "",
      address: user?.profile?.address || "",
      bio: user?.profile?.bio || "",
    }),
    [user],
  );
  const initialRef = useRef(initial);

  const [formData, setFormData] = useState(initial);
  type SubmitErrorEntry = {
    title?: string;
    message: string;
    field?: string;
    code?: string;
  };
  const [submitErrors, setSubmitErrors] = useState<SubmitErrorEntry[]>([]);

  // ── Cambio de contraseña (el propio usuario sobre su cuenta) ──
  const passwordCardRef = useRef<HTMLDivElement | null>(null);
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  // Si llegamos con ?focus=password (botón "Cambiar contraseña" del perfil),
  // hacemos scroll a la sección de contraseña.
  useEffect(() => {
    if (searchParams.get("focus") === "password" && passwordCardRef.current) {
      passwordCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [searchParams]);

  const handlePasswordChange = async () => {
    setPwdError(null);
    setPwdSuccess(false);
    const v = validatePassword(pwd);
    if (v) {
      setPwdError(v);
      return;
    }
    if (pwd !== confirmPwd) {
      setPwdError("Las contraseñas no coinciden.");
      return;
    }
    setPwdSubmitting(true);
    try {
      await changePassword(pwd);
      setPwdSuccess(true);
      setPwd("");
      setConfirmPwd("");
      setTimeout(() => setPwdSuccess(false), 4000);
    } catch (err) {
      setPwdError(
        err instanceof Error
          ? err.message
          : "No se pudo cambiar la contraseña. Inténtalo de nuevo.",
      );
    } finally {
      setPwdSubmitting(false);
    }
  };

  const [updateUser, { loading }] = useMutation(UpdateUser);

  if (!user) {
    return (
      <div className="bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
        <div className="mx-auto flex max-w-[1320px] items-center justify-center px-6 py-24">
          <Loader2 size={18} className="animate-spin" />
        </div>
      </div>
    );
  }

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length === 0) return "";
    let clean = numbers.startsWith("34") ? numbers.slice(2) : numbers;
    if (!clean.startsWith("6") && !clean.startsWith("9")) {
      clean = "6" + clean;
    }
    clean = clean.slice(0, 9);
    if (clean.length <= 3) return `+34 ${clean}`;
    if (clean.length <= 6) return `+34 ${clean.slice(0, 3)} ${clean.slice(3)}`;
    return `+34 ${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`;
  };

  const setField = (name: keyof typeof formData, value: string) => {
    setFormData((p) => ({
      ...p,
      [name]: name === "phoneNumber" ? formatPhoneNumber(value) : value,
    }));
  };

  const changed = {
    firstName: formData.firstName !== initialRef.current.firstName,
    lastName: formData.lastName !== initialRef.current.lastName,
    phoneNumber: formData.phoneNumber !== initialRef.current.phoneNumber,
    address: formData.address !== initialRef.current.address,
    bio: formData.bio !== initialRef.current.bio,
  };
  const totalChanges = Object.values(changed).filter(Boolean).length;
  const hasChanges = totalChanges > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErrors([]);

    const localErrors: SubmitErrorEntry[] = [];
    if (!formData.firstName.trim())
      localErrors.push({
        title: "Falta nombre",
        message: "El nombre es obligatorio.",
        field: "firstName",
      });
    if (!formData.lastName.trim())
      localErrors.push({
        title: "Falta apellido",
        message: "El apellido es obligatorio.",
        field: "lastName",
      });
    if (localErrors.length) {
      setSubmitErrors(localErrors);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    try {
      const { data } = await makeAuthenticatedRequest(() =>
        updateUser({
          variables: {
            id: user.id,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phoneNumber: formData.phoneNumber
              ? formData.phoneNumber.replace(/\D/g, "")
              : "",
            address: formData.address,
            bio: formData.bio,
            email: user.email,
            password: "",
            userType: user.userType,
          },
        }),
      );

      if (data?.updateUser?.errors && data.updateUser.errors.length > 0) {
        processGraphQLErrors(data.updateUser.errors);
        setSubmitErrors(
          data.updateUser.errors.map(
            (err: {
              userMessage?: string;
              developerMessage?: string;
              code?: string;
              path?: string;
            }) => ({
              title: "Error del servidor",
              message:
                err.userMessage ||
                err.developerMessage ||
                err.code ||
                "Error desconocido",
              field: err.path,
              code: err.code,
            }),
          ),
        );
        return;
      }

      if (data?.updateUser?.user) {
        await refetchMe();
        router.push("/profile");
      }
    } catch (err) {
      setSubmitErrors([
        {
          title: "Error",
          message:
            err instanceof Error ? err.message : "Error al actualizar el perfil.",
        },
      ]);
      notifyError(fromGenericError(err, "Error al actualizar el perfil"));
    }
  };

  const initials =
    `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase() ||
    "??";

  return (
    <div className="bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      <div className="mx-auto max-w-[1320px] px-3 pb-16 pt-5 sm:px-8 sm:pt-8">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-sm text-ink-2 dark:text-dark-ink-2">
          <button
            onClick={() => router.push("/profile")}
            className="inline-flex items-center gap-1 hover:text-ink dark:hover:text-dark-ink"
          >
            <ChevronLeft size={13} /> Mi perfil
          </button>
          <span>·</span>
          <span className="font-semibold text-ink dark:text-dark-ink">
            Editar
          </span>
        </nav>

        {/* Header */}
        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
              Editar perfil
            </div>
            <h1 className="m-0 mt-1.5 text-3xl font-extrabold tracking-tighter sm:text-[34px]">
              {formData.firstName || "Tu perfil"}
            </h1>
            <p className="m-0 mt-1.5 text-sm text-ink-2 dark:text-dark-ink-2">
              Actualiza tus datos personales y la información que verán otros
              usuarios.
            </p>
          </div>
          <div>
            {hasChanges ? (
              <Pill tone="warn">
                {totalChanges}{" "}
                {totalChanges === 1 ? "cambio pendiente" : "cambios pendientes"}
              </Pill>
            ) : (
              <Pill tone="ok">Sin cambios</Pill>
            )}
          </div>
        </header>

        {/* Errores inline */}
        {submitErrors.length > 0 && (
          <Card
            radius={16}
            className="mb-5 !border-[rgba(var(--accent-rgb),0.32)] !bg-[rgba(var(--accent-rgb),0.06)]"
          >
            <div className="flex items-start gap-3">
              <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--accent-rgb),0.14)] text-primary-700">
                <AlertCircle size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="m-0 text-sm font-bold text-primary-700">
                    No se pudo guardar el perfil
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSubmitErrors([])}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-primary-700 hover:bg-[rgba(var(--accent-rgb),0.10)]"
                    title="Cerrar"
                  >
                    <X size={14} />
                  </button>
                </div>
                <ul className="mt-2 list-none space-y-1.5 pl-0">
                  {submitErrors.map((err, i) => (
                    <li
                      key={`${err.field || err.code || "err"}-${i}`}
                      className="flex items-start gap-2 text-[13px] text-primary-700"
                    >
                      <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary-700" />
                      <span className="break-words">
                        {err.title && (
                          <strong className="font-semibold">
                            {err.title}
                            {err.field ? ` (${err.field})` : ""}:
                          </strong>
                        )}{" "}
                        {err.message}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 lg:grid-cols-[1.4fr_1fr]"
        >
          {/* IZQUIERDA */}
          <div className="flex flex-col gap-5">
            <Card radius={20}>
              <SectionHead
                title="Información personal"
                subtitle="Tu nombre y datos básicos"
                icon={<UserIcon size={16} />}
              />
              <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field
                  label="Nombre"
                  name="firstName"
                  value={formData.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  icon={<UserIcon size={16} />}
                  placeholder="María"
                  changed={changed.firstName}
                  required
                />
                <Field
                  label="Apellido"
                  name="lastName"
                  value={formData.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  icon={<UserIcon size={16} />}
                  placeholder="González"
                  changed={changed.lastName}
                  required
                />
              </div>
            </Card>

            <Card radius={20}>
              <SectionHead
                title="Contacto"
                subtitle="Para que el resto del equipo te localice"
                icon={<Mail size={16} />}
              />
              <div className="mt-5 grid grid-cols-1 gap-3.5">
                <Field
                  label="Email"
                  value={user.email}
                  icon={<Mail size={16} />}
                  locked
                  tag="El email no se puede modificar desde aquí. Contacta con un administrador."
                />
                <Field
                  label="Teléfono"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setField("phoneNumber", e.target.value)}
                  icon={<Phone size={16} />}
                  placeholder="+34 6XX XXX XXX"
                  maxLength={17}
                  changed={changed.phoneNumber}
                  hint="Formato: +34 6XX XXX XXX (móvil) o +34 9XX XXX XXX (fijo)"
                />
                <Field
                  label="Dirección"
                  name="address"
                  value={formData.address}
                  onChange={(e) => setField("address", e.target.value)}
                  icon={<MapPin size={16} />}
                  placeholder="Calle, ciudad…"
                  changed={changed.address}
                />
              </div>
            </Card>

            <Card radius={20}>
              <SectionHead
                title="Sobre mí"
                subtitle="Esta biografía es visible en evaluaciones"
                icon={<FileText size={16} />}
                action={
                  changed.bio ? (
                    <Pill tone="warn" className="!px-2 !py-0.5 !text-[10px]">
                      Modificado
                    </Pill>
                  ) : undefined
                }
              />
              <textarea
                value={formData.bio}
                onChange={(e) => setField("bio", e.target.value)}
                rows={5}
                placeholder="Cuenta tu trayectoria, certificaciones y áreas de especialización…"
                className={cn(
                  "mt-3.5 min-h-[120px] w-full resize-y rounded-[12px] px-3.5 py-3 text-sm outline-none",
                  "border text-ink dark:text-dark-ink",
                  changed.bio
                    ? "border-[rgba(232,163,61,0.32)] bg-[rgba(232,163,61,0.08)]"
                    : "border-hairline bg-bg-2 dark:border-hairline-dark dark:bg-white/[0.03]",
                )}
              />
            </Card>

            <div ref={passwordCardRef}>
            <Card radius={20}>
              <SectionHead
                title="Seguridad"
                subtitle="Cambia la contraseña de tu cuenta"
                icon={<Lock size={16} />}
              />
              <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field
                  label="Nueva contraseña"
                  type={showPwd ? "text" : "password"}
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  icon={<KeyRound size={16} />}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      aria-label={
                        showPwd ? "Ocultar contraseña" : "Mostrar contraseña"
                      }
                      className="text-ink-2 hover:text-ink dark:text-dark-ink-2"
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                <Field
                  label="Confirmar contraseña"
                  type={showPwd ? "text" : "password"}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  icon={<ShieldCheck size={16} />}
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                />
              </div>

              <ul className="ml-1 mt-3 list-disc pl-4 text-xs text-ink-2 dark:text-dark-ink-2">
                <li>Mínimo {PWD_MIN_LENGTH} caracteres.</li>
                <li>Al menos una mayúscula, una minúscula y un número.</li>
              </ul>

              {pwdError && (
                <p
                  role="alert"
                  className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500"
                >
                  {pwdError}
                </p>
              )}
              {pwdSuccess && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} /> Contraseña actualizada
                  correctamente.
                </p>
              )}

              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pwdSubmitting || !pwd || !confirmPwd}
                  onClick={handlePasswordChange}
                  icon={
                    pwdSubmitting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Lock size={14} />
                    )
                  }
                >
                  {pwdSubmitting ? "Guardando…" : "Cambiar contraseña"}
                </Button>
              </div>
            </Card>
            </div>

            <div className="flex flex-wrap justify-between gap-2.5">
              <Button
                type="button"
                variant="ghost"
                icon={<ChevronLeft size={14} />}
                onClick={() => router.push("/profile")}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !hasChanges}
                icon={
                  loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )
                }
                title={
                  !hasChanges ? "No hay cambios para guardar" : "Guardar cambios"
                }
              >
                {loading ? "Guardando…" : "Guardar cambios"}
              </Button>
            </div>
          </div>

          {/* SIDEBAR — Preview */}
          <div className="flex flex-col gap-5">
            <Card glow radius={20}>
              <div className="text-[11px] font-bold uppercase tracking-widest text-primary-500">
                Vista previa
              </div>
              <div className="mt-3.5 flex items-center gap-3">
                <Avatar name={initials} size={56} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-extrabold tracking-tight">
                    {formData.firstName} {formData.lastName}
                  </div>
                  <div className="truncate text-[12px] text-ink-2 dark:text-dark-ink-2">
                    {user.email}
                  </div>
                </div>
              </div>
              <div className="my-4 h-px bg-hairline dark:bg-hairline-dark" />
              <div className="grid gap-2 text-[13px]">
                <RowPreview
                  Icon={Phone}
                  label="Teléfono"
                  value={formData.phoneNumber || "—"}
                />
                <RowPreview
                  Icon={MapPin}
                  label="Dirección"
                  value={formData.address || "—"}
                />
                <RowPreview
                  Icon={ShieldCheck}
                  label="Rol"
                  value={(user.userType || "").replaceAll("_", " ") || "—"}
                />
              </div>
            </Card>

            <Card radius={20}>
              <div className="text-[11px] font-bold uppercase tracking-widest text-ink-2 dark:text-dark-ink-2">
                Datos no editables
              </div>
              <div className="mt-2 text-[13px] text-ink-2 dark:text-dark-ink-2">
                Email, rol y permisos sólo pueden cambiarse desde el panel de
                administración.
              </div>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}

function RowPreview({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ size?: number | string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="inline-flex items-center gap-1.5 text-ink-2 dark:text-dark-ink-2">
        <Icon size={13} /> {label}
      </span>
      <span className="truncate font-semibold">{value}</span>
    </div>
  );
}
