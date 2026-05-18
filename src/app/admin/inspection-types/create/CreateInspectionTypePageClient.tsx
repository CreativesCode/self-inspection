"use client";

import { AdminFormLayout } from "@/components/admin/AdminFormLayout";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { SectionHead } from "@/components/ui/SectionHead";
import { CreateInspectionType } from "@/graphql/inspections";
import {
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { useAuthStore, useRefreshStore } from "@/store";
import { useMutation } from "@/lib/apollo-compat";
import { Info, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CreateInspectionTypePageClient() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bumpRefresh = useRefreshStore((s) => s.bump);
  const router = useRouter();

  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [createInspectionType, { loading }] = useMutation(CreateInspectionType, {
    onCompleted: (data) => {
      if (data?.createInspectionType?.inspectionType) bumpRefresh();
    },
  });

  useEffect(() => {
    if (!isAuthenticated || (user && user.userType !== "ADMINISTRADOR")) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  if (!user || user.userType !== "ADMINISTRADOR") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const { data } = await createInspectionType({ variables: { name } });
      if (
        data?.createInspectionType?.errors &&
        data.createInspectionType.errors.length > 0
      ) {
        const message =
          data.createInspectionType.errors[0]?.message ||
          "Error al crear el tipo de inspección";
        setFormError(message);
        processGraphQLErrors(data.createInspectionType.errors);
        return;
      }
      if (data?.createInspectionType?.inspectionType) {
        router.push("/admin/inspection-types");
      }
    } catch (err) {
      const wrapped = fromGenericError(
        err,
        "Error al crear el tipo de inspección",
      );
      setFormError(wrapped.userMessage);
      notifyError(wrapped);
    }
  };

  const sidebar = (
    <Card radius={20}>
      <SectionHead title="¿Qué es un tipo de inspección?" icon={<Info size={16} />} />
      <p className="mt-3 text-[13px] leading-relaxed text-ink-2 dark:text-dark-ink-2">
        Cada tipo agrupa actividades, encabezados y preguntas que se mostrarán
        durante una inspección. Por ejemplo: <em>Excavación</em>,{" "}
        <em>Hormigonado</em>, <em>Acabados</em>.
      </p>
    </Card>
  );

  return (
    <AdminFormLayout
      mode="create"
      breadcrumb="Administración · Tipos de inspección"
      breadcrumbHref="/admin/inspection-types"
      title="Nuevo tipo de inspección"
      subtitle="Define un nuevo tipo de inspección para agrupar actividades."
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
            placeholder="Ej: Hormigonado"
            required
          />
        </div>
      </Card>
    </AdminFormLayout>
  );
}
