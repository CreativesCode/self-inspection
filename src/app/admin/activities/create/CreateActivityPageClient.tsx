"use client";

import { AdminFormLayout } from "@/components/admin/AdminFormLayout";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { SectionHead } from "@/components/ui/SectionHead";
import { Select } from "@/components/ui/Select";
import {
  CreateActivity,
  GetInspectionTypes,
} from "@/graphql/inspections";
import {
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { useAuthStore, useRefreshStore } from "@/store";
import { useMutation, useQuery } from "@/lib/apollo-compat";
import { CheckCircle2, Info, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface InspectionType {
  id: string;
  name: string;
}

interface InspectionTypesData {
  inspectionTypes: { edges: { node: InspectionType }[] };
}

export default function CreateActivityPageClient() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bumpRefresh = useRefreshStore((s) => s.bump);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlInspectionTypeId = searchParams.get("inspectionTypeId");

  const [activityText, setActivityText] = useState("");
  const [inspectionTypeId, setInspectionTypeId] = useState(
    urlInspectionTypeId || "",
  );
  const [formError, setFormError] = useState<string | null>(null);

  const { data: inspectionTypesData } =
    useQuery<InspectionTypesData>(GetInspectionTypes);

  const [createActivity, { loading }] = useMutation(CreateActivity, {
    onCompleted: (res) => {
      if (res?.createActivity?.activity) bumpRefresh();
    },
  });

  useEffect(() => {
    if (!isAuthenticated || (user && user.userType !== "ADMINISTRADOR")) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  if (!user || user.userType !== "ADMINISTRADOR") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!inspectionTypeId) {
      setFormError("Debe seleccionar un tipo de inspección");
      return;
    }
    try {
      const { data } = await createActivity({
        variables: { inspectionTypeId, activityText },
      });
      if (data?.createActivity?.errors && data.createActivity.errors.length > 0) {
        const message =
          data.createActivity.errors[0]?.message ||
          "Error al crear la actividad";
        setFormError(message);
        processGraphQLErrors(data.createActivity.errors);
        return;
      }
      if (data?.createActivity?.activity) {
        router.push("/admin/activities");
      }
    } catch (err) {
      const wrapped = fromGenericError(err, "Error al crear la actividad");
      setFormError(wrapped.userMessage);
      notifyError(wrapped);
    }
  };

  const inspectionTypes =
    inspectionTypesData?.inspectionTypes?.edges?.map((edge) => edge.node) || [];

  const sidebar = (
    <Card radius={20}>
      <SectionHead title="¿Qué es una actividad?" icon={<Info size={16} />} />
      <p className="mt-3 text-[13px] leading-relaxed text-ink-2 dark:text-dark-ink-2">
        Una actividad describe una tarea o trabajo dentro de un tipo de
        inspección. Por ejemplo, dentro del tipo <em>Hormigonado</em>, una
        actividad puede ser <em>Vertido</em>.
      </p>
    </Card>
  );

  return (
    <AdminFormLayout
      mode="create"
      breadcrumb="Administración · Actividades"
      breadcrumbHref="/admin/activities"
      title="Nueva actividad"
      subtitle="Define una nueva actividad asociada a un tipo de inspección."
      loading={loading}
      error={formError}
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
        <SectionHead title="Datos" icon={<CheckCircle2 size={16} />} />
        <div className="mt-4">
          <Field
            label="Nombre de la actividad"
            icon={<CheckCircle2 size={15} />}
            value={activityText}
            onChange={(e) => setActivityText(e.target.value)}
            placeholder="Ej: Vertido de hormigón"
            required
          />
        </div>
      </Card>
    </AdminFormLayout>
  );
}
