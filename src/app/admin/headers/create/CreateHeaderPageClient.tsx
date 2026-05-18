"use client";

import { AdminFormLayout } from "@/components/admin/AdminFormLayout";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { SectionHead } from "@/components/ui/SectionHead";
import { Select } from "@/components/ui/Select";
import { CreateHeader, GetInspectionTypes } from "@/graphql/inspections";
import {
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { useAuthStore, useRefreshStore } from "@/store";
import { useMutation, useQuery } from "@/lib/apollo-compat";
import { FileText, Info, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface InspectionType {
  id: string;
  name: string;
}

interface InspectionTypesData {
  inspectionTypes: { edges: { node: InspectionType }[] };
}

export default function CreateHeaderPageClient() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const bumpRefresh = useRefreshStore((s) => s.bump);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlInspectionTypeId = searchParams.get("inspectionTypeId");

  const [headerText, setHeaderText] = useState("");
  const [inspectionTypeId, setInspectionTypeId] = useState(
    urlInspectionTypeId || "",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: inspectionTypesData } =
    useQuery<InspectionTypesData>(GetInspectionTypes);

  const [createHeader, { loading }] = useMutation(CreateHeader, {
    onCompleted: (data) => {
      if (data?.createHeader?.errors?.length) return;
      bumpRefresh();
      setSuccess("Encabezado creado correctamente. Redirigiendo…");
      setTimeout(() => {
        const url = urlInspectionTypeId
          ? `/admin/headers?inspectionTypeId=${urlInspectionTypeId}`
          : "/admin/headers";
        router.push(url);
      }, 1200);
    },
    onError: (err) => setFormError(err.message),
  });

  useEffect(() => {
    if (!isLoading && user) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user.userType !== "ADMINISTRADOR") {
        router.push("/profile");
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (!user || user.userType !== "ADMINISTRADOR") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    if (!inspectionTypeId) {
      setFormError("Debe seleccionar un tipo de inspección");
      return;
    }
    try {
      const { data } = await createHeader({
        variables: { headerText, inspectionTypeId },
      });
      if (data?.createHeader?.errors && data.createHeader.errors.length > 0) {
        const message =
          data.createHeader.errors[0]?.message ||
          "Error al crear el encabezado";
        setFormError(message);
        processGraphQLErrors(data.createHeader.errors);
      }
    } catch (err) {
      const wrapped = fromGenericError(err, "Error al crear el encabezado");
      setFormError(wrapped.userMessage);
      notifyError(wrapped);
    }
  };

  const inspectionTypes =
    inspectionTypesData?.inspectionTypes?.edges?.map((edge) => edge.node) || [];

  const sidebar = (
    <Card radius={20}>
      <SectionHead title="¿Qué es un encabezado?" icon={<Info size={16} />} />
      <p className="mt-3 text-[13px] leading-relaxed text-ink-2 dark:text-dark-ink-2">
        Un encabezado agrupa preguntas dentro de un tipo de inspección. Por
        ejemplo, dentro de <em>Hormigonado</em>, un encabezado puede ser{" "}
        <em>Encofrado</em> que contendría las preguntas relacionadas.
      </p>
    </Card>
  );

  return (
    <AdminFormLayout
      mode="create"
      breadcrumb="Administración · Encabezados"
      breadcrumbHref={
        urlInspectionTypeId
          ? `/admin/headers?inspectionTypeId=${urlInspectionTypeId}`
          : "/admin/headers"
      }
      title="Nuevo encabezado"
      subtitle="Crea un nuevo encabezado para agrupar preguntas."
      loading={loading}
      error={formError}
      success={success}
      onSubmit={handleSubmit}
      sidebar={sidebar}
    >
      <Card radius={20}>
        <SectionHead
          title="Tipo de inspección"
          icon={<ShieldCheck size={16} />}
        />
        <div className="mt-4">
          <Select
            label="Selecciona el tipo"
            value={inspectionTypeId}
            onChange={(e) => setInspectionTypeId(e.target.value)}
            required
          >
            <option value="">Seleccione un tipo de inspección</option>
            {inspectionTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card radius={20}>
        <SectionHead title="Datos" icon={<FileText size={16} />} />
        <div className="mt-4">
          <Field
            label="Texto del encabezado"
            icon={<FileText size={15} />}
            value={headerText}
            onChange={(e) => setHeaderText(e.target.value)}
            placeholder="Ej: Encofrado"
            required
          />
        </div>
      </Card>
    </AdminFormLayout>
  );
}
