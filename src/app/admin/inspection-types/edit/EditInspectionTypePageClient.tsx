"use client";

import { AdminFormLayout } from "@/components/admin/AdminFormLayout";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { SectionHead } from "@/components/ui/SectionHead";
import {
  GetInspectionType,
  UpdateInspectionType,
} from "@/graphql/inspections";
import {
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { useAuthStore, useRefreshStore } from "@/store";
import { useMutation, useQuery } from "@/lib/apollo-compat";
import { Info, Loader2, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditInspectionTypePageClient() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bumpRefresh = useRefreshStore((s) => s.bump);
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [name, setName] = useState("");
  const [initial, setInitial] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data, loading: loadingType, error } = useQuery(GetInspectionType, {
    variables: { id },
    skip: !id,
  });

  const [updateInspectionType, { loading }] = useMutation(UpdateInspectionType, {
    onCompleted: (res) => {
      if (res?.updateInspectionType?.inspectionType) bumpRefresh();
    },
  });

  useEffect(() => {
    if (!isAuthenticated || (user && user.userType !== "ADMINISTRADOR")) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (data?.inspectionType) {
      setName(data.inspectionType.name);
      setInitial(data.inspectionType.name);
    }
  }, [data]);

  if (!id) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-primary-700">
          Error: ID de tipo de inspección no proporcionado
        </div>
      </div>
    );
  }

  if (!user || user.userType !== "ADMINISTRADOR") return null;

  if (loadingType) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-2 dark:text-dark-ink-2">
        <Loader2 size={18} className="mr-2 animate-spin" /> Cargando…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[600px] px-4 py-12">
        <Card
          radius={16}
          className="!border-[rgba(var(--accent-rgb),0.32)] !bg-[rgba(var(--accent-rgb),0.06)]"
        >
          <div className="text-sm text-primary-700">
            Error al cargar el tipo de inspección: {error.message}
          </div>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const { data: res } = await updateInspectionType({
        variables: { id, name },
      });
      if (
        res?.updateInspectionType?.errors &&
        res.updateInspectionType.errors.length > 0
      ) {
        const message =
          res.updateInspectionType.errors[0]?.message ||
          "Error al actualizar el tipo";
        setFormError(message);
        processGraphQLErrors(res.updateInspectionType.errors);
        return;
      }
      if (res?.updateInspectionType?.inspectionType) {
        router.push("/admin/inspection-types");
      }
    } catch (err) {
      const wrapped = fromGenericError(
        err,
        "Error al actualizar el tipo de inspección",
      );
      setFormError(wrapped.userMessage);
      notifyError(wrapped);
    }
  };

  const changed = name !== initial;

  const sidebar = (
    <Card radius={20}>
      <SectionHead title="Notas" icon={<Info size={16} />} />
      <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-ink-2 dark:text-dark-ink-2">
        <li>
          Cambiar el nombre del tipo lo actualizará en todas las inspecciones
          asociadas.
        </li>
        <li>
          Las actividades y encabezados vinculados se mantendrán intactos.
        </li>
      </ul>
    </Card>
  );

  return (
    <AdminFormLayout
      mode="edit"
      breadcrumb="Administración · Tipos de inspección"
      breadcrumbHref="/admin/inspection-types"
      title="Editar tipo de inspección"
      subtitle="Modifica el nombre del tipo de inspección."
      loading={loading}
      error={formError}
      onSubmit={handleSubmit}
      sidebar={sidebar}
    >
      <Card radius={20}>
        <SectionHead title="Datos" icon={<ShieldCheck size={16} />} />
        <div className="mt-4">
          <Field
            label="Nombre del tipo"
            icon={<ShieldCheck size={15} />}
            value={name}
            onChange={(e) => setName(e.target.value)}
            changed={changed}
            required
          />
        </div>
      </Card>
    </AdminFormLayout>
  );
}
