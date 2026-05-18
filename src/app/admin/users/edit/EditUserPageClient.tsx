"use client";

import { AdminFormLayout } from "@/components/admin/AdminFormLayout";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { SectionHead } from "@/components/ui/SectionHead";
import { Select } from "@/components/ui/Select";
import { GetUser, UpdateUser } from "@/graphql/auth";
import {
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { useAuthStore, useRefreshStore } from "@/store";
import { useMutation, useQuery } from "@/lib/apollo-compat";
import {
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: string;
}

const USER_TYPE_OPTIONS = [
  { value: "JEFE_DE_OBRA", label: "Jefe de Obra" },
  { value: "TECNICO", label: "Técnico" },
  { value: "JEFE_DE_TRABAJO", label: "Jefe de Trabajo" },
];

export default function EditUserPageClient() {
  const currentUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bumpRefresh = useRefreshStore((s) => s.bump);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");
  const decodedId = decodeURIComponent(userId || "");

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    userType: "",
  });
  const [initial, setInitial] = useState<FormData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: userData, loading: userLoading } = useQuery(GetUser, {
    variables: { id: decodedId },
    skip: !decodedId,
  });

  const [updateUser, { loading }] = useMutation(UpdateUser, {
    onCompleted: (data) => {
      if (!data?.updateUser?.errors?.length) bumpRefresh();
    },
  });

  useEffect(() => {
    if (
      !isAuthenticated ||
      (currentUser &&
        currentUser.userType !== "ADMINISTRADOR" &&
        currentUser.userType !== "JEFE_DE_OBRA" &&
        currentUser.userType !== "TECNICO")
    ) {
      router.push("/login");
    }
  }, [isAuthenticated, currentUser, router]);

  useEffect(() => {
    if (userData?.user) {
      const u = userData.user;
      const snapshot: FormData = {
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        password: "",
        userType: u.userType,
      };
      setFormData(snapshot);
      setInitial(snapshot);
    }
  }, [userData]);

  const changed = useMemo(() => {
    if (!initial) {
      return {
        firstName: false,
        lastName: false,
        password: false,
        userType: false,
      };
    }
    return {
      firstName: formData.firstName !== initial.firstName,
      lastName: formData.lastName !== initial.lastName,
      password: formData.password.length > 0,
      userType: formData.userType !== initial.userType,
    };
  }, [formData, initial]);

  if (!userId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-primary-700">
          Error: ID de usuario no proporcionado
        </div>
      </div>
    );
  }

  if (userLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-2 dark:text-dark-ink-2">
        <Loader2 size={18} className="mr-2 animate-spin" /> Cargando usuario…
      </div>
    );
  }

  const handleChange = (name: keyof FormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const { data } = await updateUser({
        variables: { id: decodedId, ...formData },
      });
      if (data?.updateUser?.errors && data.updateUser.errors.length > 0) {
        const message =
          data.updateUser.errors[0]?.message || "Error al actualizar usuario";
        setFormError(message);
        processGraphQLErrors(data.updateUser.errors);
        return;
      }
      router.push("/admin/users");
    } catch (err) {
      const wrapped = fromGenericError(err, "Error al actualizar usuario");
      setFormError(wrapped.userMessage);
      notifyError(wrapped);
    }
  };

  const sidebar = (
    <>
      <Card glow radius={20}>
        <SectionHead
          title="Resumen"
          subtitle="Estado del usuario"
          icon={<UserIcon size={16} />}
        />
        <div className="mt-4 flex items-center gap-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-grad-brand text-base font-bold text-white">
            {(formData.firstName?.[0] || "?").toUpperCase()}
            {(formData.lastName?.[0] || "").toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-bold">
              {`${formData.firstName} ${formData.lastName}`.trim() || "Usuario"}
            </div>
            <div className="truncate text-[12px] text-ink-2 dark:text-dark-ink-2">
              {formData.email}
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-2 border-t border-dashed border-hairline pt-4 dark:border-hairline-dark">
          <KvRow
            label="Rol"
            value={
              USER_TYPE_OPTIONS.find((t) => t.value === formData.userType)
                ?.label || formData.userType
            }
          />
          <KvRow
            label="Cambios"
            value={
              Object.values(changed).some(Boolean) ? "Pendientes" : "Sin cambios"
            }
          />
        </div>
      </Card>

      <Card radius={20}>
        <SectionHead title="Notas" icon={<Info size={16} />} />
        <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-ink-2 dark:text-dark-ink-2">
          <li>
            <strong className="font-semibold text-ink dark:text-dark-ink">
              Email
            </strong>{" "}
            está bloqueado: contacta soporte para cambiarlo.
          </li>
          <li>
            Dejar contraseña en blanco mantiene la actual.
          </li>
        </ul>
      </Card>
    </>
  );

  return (
    <AdminFormLayout
      mode="edit"
      breadcrumb="Administración · Usuarios"
      breadcrumbHref="/admin/users"
      title="Editar usuario"
      subtitle="Modifica datos, rol o credenciales del usuario."
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
            changed={changed.firstName}
            required
          />
          <Field
            label="Apellidos"
            icon={<UserIcon size={15} />}
            value={formData.lastName}
            onChange={(e) => handleChange("lastName")(e.target.value)}
            changed={changed.lastName}
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
            locked
            tag="El email no se puede modificar"
          />
          <Field
            label="Nueva contraseña"
            type={showPassword ? "text" : "password"}
            icon={<Lock size={15} />}
            value={formData.password}
            onChange={(e) => handleChange("password")(e.target.value)}
            placeholder="Dejar en blanco para mantener la contraseña actual"
            changed={changed.password}
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
        <SectionHead title="Rol" icon={<ShieldCheck size={16} />} />
        <div className="mt-4">
          <Select
            label="Tipo de usuario"
            value={formData.userType}
            onChange={(e) => handleChange("userType")(e.target.value)}
            changed={changed.userType}
            required
          >
            {USER_TYPE_OPTIONS.map((opt) => (
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
