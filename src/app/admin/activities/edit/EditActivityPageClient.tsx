"use client";

import { AdminFormLayout } from "@/components/admin/AdminFormLayout";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { SectionHead } from "@/components/ui/SectionHead";
import { Select } from "@/components/ui/Select";
import {
  GetActivity,
  GetInspectionTypes,
  UpdateActivity,
} from "@/graphql/inspections";
import {
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { useAuthStore, useRefreshStore } from "@/store";
import { useMutation, useQuery } from "@/lib/apollo-compat";
import { CheckCircle2, Info, Loader2, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface InspectionType {
  id: string;
  name: string;
}

interface InspectionTypesData {
  inspectionTypes: { edges: { node: InspectionType }[] };
}

export default function EditActivityPageClient() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bumpRefresh = useRefreshStore((s) => s.bump);
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [activityText, setActivityText] = useState("");
  const [inspectionTypeId, setInspectionTypeId] = useState("");
  const [initial, setInitial] = useState<{
    activityText: string;
    inspectionTypeId: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, loading: loadingActivity, error } = useQuery(GetActivity, {
    variables: { id },
    skip: !id,
  });

  const { data: inspectionTypesData } =
    useQuery<InspectionTypesData>(GetInspectionTypes);

  const [updateActivity, { loading }] = useMutation(UpdateActivity, {
    onCompleted: (res) => {
      if (res?.updateActivity?.activity) bumpRefresh();
    },
  });

  useEffect(() => {
    if (!isAuthenticated || (user && user.userType !== "ADMINISTRADOR")) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (data?.activity) {
      const snapshot = {
        activityText: data.activity.activityText,
        inspectionTypeId: data.activity.inspectionType?.id || "",
      };
      setActivityText(snapshot.activityText);
      setInspectionTypeId(snapshot.inspectionTypeId);
      setInitial(snapshot);
    }
  }, [data]);

  if (!id) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-primary-700">
          Error: ID de actividad no proporcionado
        </div>
      </div>
    );
  }

  if (!user || user.userType !== "ADMINISTRADOR") return null;

  if (loadingActivity) {
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
            Error al cargar la actividad: {error.message}
          </div>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!inspectionTypeId) {
      setFormError("Debe seleccionar un tipo de inspección");
      return;
    }
    try {
      const { data: res } = await updateActivity({
        variables: { id, inspectionTypeId, activityText },
      });
      if (res?.updateActivity?.errors && res.updateActivity.errors.length > 0) {
        const message =
          res.updateActivity.errors[0]?.message ||
          "Error al actualizar la actividad";
        setFormError(message);
        processGraphQLErrors(res.updateActivity.errors);
        return;
      }
      if (res?.updateActivity?.activity) {
        router.push("/admin/activities");
      }
    } catch (err) {
      const wrapped = fromGenericError(
        err,
        "Error al actualizar la actividad",
      );
      setFormError(wrapped.userMessage);
      notifyError(wrapped);
    }
  };

  const inspectionTypes =
    inspectionTypesData?.inspectionTypes?.edges?.map((edge) => edge.node) || [];

  const changedText = initial ? activityText !== initial.activityText : false;
  const changedType = initial
    ? inspectionTypeId !== initial.inspectionTypeId
    : false;

  const sidebar = (
    <Card radius={20}>
      <SectionHead title="Notas" icon={<Info size={16} />} />
      <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-ink-2 dark:text-dark-ink-2">
        <li>
          Cambiar el tipo de inspección reasigna la actividad a otro grupo
          dentro del catálogo.
        </li>
      </ul>
    </Card>
  );

  return (
    <AdminFormLayout
      mode="edit"
      breadcrumb="Administración · Actividades"
      breadcrumbHref="/admin/activities"
      title="Editar actividad"
      subtitle="Modifica los datos de la actividad."
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
        <SectionHead title="Datos" icon={<CheckCircle2 size={16} />} />
        <div className="mt-4">
          <Field
            label="Nombre de la actividad"
            icon={<CheckCircle2 size={15} />}
            value={activityText}
            onChange={(e) => setActivityText(e.target.value)}
            changed={changedText}
            required
          />
        </div>
      </Card>
    </AdminFormLayout>
  );
}
