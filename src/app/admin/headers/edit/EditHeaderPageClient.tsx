"use client";

import { AdminFormLayout } from "@/components/admin/AdminFormLayout";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { SectionHead } from "@/components/ui/SectionHead";
import { Select } from "@/components/ui/Select";
import {
  GetHeader,
  GetInspectionTypes,
  UpdateHeader,
} from "@/graphql/inspections";
import {
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { useAuthStore, useRefreshStore } from "@/store";
import { useMutation, useQuery } from "@/lib/apollo-compat";
import { FileText, Info, Loader2, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface InspectionType {
  id: string;
  name: string;
}

interface InspectionTypesData {
  inspectionTypes: { edges: { node: InspectionType }[] };
}

export default function EditHeaderPageClient() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const bumpRefresh = useRefreshStore((s) => s.bump);
  const router = useRouter();
  const searchParams = useSearchParams();
  const headerId = searchParams.get("id");
  const urlInspectionTypeId = searchParams.get("inspectionTypeId");

  const [headerText, setHeaderText] = useState("");
  const [inspectionTypeId, setInspectionTypeId] = useState("");
  const [initial, setInitial] = useState<{
    headerText: string;
    inspectionTypeId: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: headerData, loading: loadingHeader } = useQuery(GetHeader, {
    variables: { id: headerId },
    skip: !headerId,
  });

  const { data: inspectionTypesData } =
    useQuery<InspectionTypesData>(GetInspectionTypes);

  const [updateHeader, { loading }] = useMutation(UpdateHeader, {
    onCompleted: (data) => {
      if (data?.updateHeader?.errors?.length) return;
      bumpRefresh();
      setSuccess("Encabezado actualizado correctamente. Redirigiendo…");
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
      if (!isAuthenticated) router.push("/login");
      else if (user.userType !== "ADMINISTRADOR") router.push("/profile");
    }
  }, [isAuthenticated, user, isLoading, router]);

  useEffect(() => {
    if (headerData?.header) {
      const h = headerData.header;
      setHeaderText(h.headerText);
      setInspectionTypeId(h.inspectionType.id);
      setInitial({
        headerText: h.headerText,
        inspectionTypeId: h.inspectionType.id,
      });
    }
  }, [headerData]);

  if (!headerId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-primary-700">
          Error: ID de encabezado no proporcionado
        </div>
      </div>
    );
  }

  if (isLoading || loadingHeader) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-2 dark:text-dark-ink-2">
        <Loader2 size={18} className="mr-2 animate-spin" /> Cargando encabezado…
      </div>
    );
  }

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
      const { data } = await updateHeader({
        variables: { id: headerId, headerText, inspectionTypeId },
      });
      if (data?.updateHeader?.errors && data.updateHeader.errors.length > 0) {
        const message =
          data.updateHeader.errors[0]?.message ||
          "Error al actualizar el encabezado";
        setFormError(message);
        processGraphQLErrors(data.updateHeader.errors);
      }
    } catch (err) {
      const wrapped = fromGenericError(
        err,
        "Error al actualizar el encabezado",
      );
      setFormError(wrapped.userMessage);
      notifyError(wrapped);
    }
  };

  const inspectionTypes =
    inspectionTypesData?.inspectionTypes?.edges?.map((edge) => edge.node) || [];

  const changedText = initial ? headerText !== initial.headerText : false;
  const changedType = initial
    ? inspectionTypeId !== initial.inspectionTypeId
    : false;

  const sidebar = (
    <Card radius={20}>
      <SectionHead title="Notas" icon={<Info size={16} />} />
      <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-ink-2 dark:text-dark-ink-2">
        <li>
          Cambiar el tipo de inspección reasigna el encabezado y todas sus
          preguntas al nuevo grupo.
        </li>
      </ul>
    </Card>
  );

  return (
    <AdminFormLayout
      mode="edit"
      breadcrumb="Administración · Encabezados"
      breadcrumbHref={
        urlInspectionTypeId
          ? `/admin/headers?inspectionTypeId=${urlInspectionTypeId}`
          : "/admin/headers"
      }
      title="Editar encabezado"
      subtitle="Modifica los datos del encabezado."
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
            changed={changedType}
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
            changed={changedText}
            required
          />
        </div>
      </Card>
    </AdminFormLayout>
  );
}
