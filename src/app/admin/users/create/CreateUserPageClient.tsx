"use client";

import { AdminFormLayout } from "@/components/admin/AdminFormLayout";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { SectionHead } from "@/components/ui/SectionHead";
import { Select } from "@/components/ui/Select";
import { CreateUser } from "@/graphql/auth";
import {
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { useAuthStore, useRefreshStore } from "@/store";
import { useMutation } from "@/lib/apollo-compat";
import {
  Eye,
  EyeOff,
  Info,
  Lock,
  Mail,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: string;
}

export default function CreateUserPageClient() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bumpRefresh = useRefreshStore((s) => s.bump);
  const router = useRouter();

  const availableUserTypes = useMemo(() => {
    if (!user) return [];
    switch (user.userType) {
      case "ADMINISTRADOR":
      case "JEFE_DE_OBRA":
        return [
          { value: "JEFE_DE_OBRA", label: "Jefe de Obra" },
          { value: "TECNICO", label: "Técnico" },
          { value: "JEFE_DE_TRABAJO", label: "Jefe de Trabajo" },
        ];
      case "TECNICO":
        return [{ value: "JEFE_DE_TRABAJO", label: "Jefe de Trabajo" }];
      default:
        return [];
    }
  }, [user]);

  const defaultUserType =
    availableUserTypes.length > 0 ? availableUserTypes[0].value : "";

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    userType: defaultUserType,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [createUser, { loading }] = useMutation(CreateUser, {
    onCompleted: (data) => {
      if (data?.createUser?.user) bumpRefresh();
    },
  });

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

  // Si el defaultUserType cambia (porque user llega después de mount), sincronizar
  useEffect(() => {
    if (defaultUserType && !formData.userType) {
      setFormData((prev) => ({ ...prev, userType: defaultUserType }));
    }
  }, [defaultUserType, formData.userType]);

  if (
    !user ||
    (user.userType !== "ADMINISTRADOR" &&
      user.userType !== "JEFE_DE_OBRA" &&
      user.userType !== "TECNICO")
  ) {
    return null;
  }

  const handleChange = (name: keyof FormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const { data } = await createUser({ variables: formData });
      if (data?.createUser?.errors && data.createUser.errors.length > 0) {
        const message =
          data.createUser.errors[0]?.message || "Error al crear usuario";
        setFormError(message);
        processGraphQLErrors(data.createUser.errors);
        return;
      }
      if (data?.createUser?.user) {
        router.push("/admin/users");
      }
    } catch (err) {
      const wrapped = fromGenericError(err, "Error al crear usuario");
      setFormError(wrapped.userMessage);
      notifyError(wrapped);
    }
  };

  const sidebar = (
    <>
      <Card glow radius={20}>
        <SectionHead
          title="Resumen"
          subtitle="Vista previa del usuario"
          icon={<UserIcon size={16} />}
        />
        <div className="mt-4 flex items-center gap-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-grad-brand text-base font-bold text-white">
            {(formData.firstName?.[0] || "?").toUpperCase()}
            {(formData.lastName?.[0] || "").toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-bold">
              {formData.firstName || formData.lastName
                ? `${formData.firstName} ${formData.lastName}`.trim()
                : "Nuevo usuario"}
            </div>
            <div className="truncate text-[12px] text-ink-2 dark:text-dark-ink-2">
              {formData.email || "email@empresa.com"}
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-2 border-t border-dashed border-hairline pt-4 dark:border-hairline-dark">
          <KvRow
            label="Rol"
            value={
              availableUserTypes.find((t) => t.value === formData.userType)
                ?.label || "—"
            }
          />
          <KvRow label="Estado" value="Activo al crear" />
        </div>
      </Card>

      <Card radius={20}>
        <SectionHead title="Consejos" icon={<Info size={16} />} />
        <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-ink-2 dark:text-dark-ink-2">
          <li>El email debe ser único y se usará para iniciar sesión.</li>
          <li>La contraseña debe tener al menos 8 caracteres.</li>
          <li>
            El rol determina qué acciones puede realizar el usuario en la
            plataforma.
          </li>
        </ul>
      </Card>
    </>
  );

  return (
    <AdminFormLayout
      mode="create"
      breadcrumb="Administración · Usuarios"
      breadcrumbHref="/admin/users"
      title="Nuevo usuario"
      subtitle="Crea un nuevo usuario y asigna su rol."
      loading={loading}
      error={formError}
      onSubmit={handleSubmit}
      sidebar={sidebar}
    >
      <Card radius={20}>
        <SectionHead title="Datos personales" icon={<UserIcon size={16} />} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Nombre"
            icon={<UserIcon size={15} />}
            value={formData.firstName}
            onChange={(e) => handleChange("firstName")(e.target.value)}
            placeholder="Nombre"
            required
          />
          <Field
            label="Apellidos"
            icon={<UserIcon size={15} />}
            value={formData.lastName}
            onChange={(e) => handleChange("lastName")(e.target.value)}
            placeholder="Apellidos"
            required
          />
        </div>
      </Card>

      <Card radius={20}>
        <SectionHead title="Acceso" icon={<ShieldCheck size={16} />} />
        <div className="mt-4 grid gap-4">
          <Field
            label="Email"
            type="email"
            icon={<Mail size={15} />}
            value={formData.email}
            onChange={(e) => handleChange("email")(e.target.value)}
            placeholder="usuario@empresa.com"
            required
          />
          <Field
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            icon={<Lock size={15} />}
            value={formData.password}
            onChange={(e) => handleChange("password")(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            required
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-ink-2 transition-colors hover:text-ink dark:text-dark-ink-2 dark:hover:text-dark-ink"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        </div>
      </Card>

      <Card radius={20}>
        <SectionHead
          title="Rol"
          icon={<ShieldCheck size={16} />}
          action={<Pill tone="brand">{availableUserTypes.length} opciones</Pill>}
        />
        <div className="mt-4">
          <Select
            label="Tipo de usuario"
            value={formData.userType}
            onChange={(e) => handleChange("userType")(e.target.value)}
            required
          >
            {availableUserTypes.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>
    </AdminFormLayout>
  );
}

function KvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[13px]">
      <span className="text-ink-2 dark:text-dark-ink-2">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
