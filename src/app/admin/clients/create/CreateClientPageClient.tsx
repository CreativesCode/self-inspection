"use client";

import { AdminFormLayout } from "@/components/admin/AdminFormLayout";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { SectionHead } from "@/components/ui/SectionHead";
import { CreateClient } from "@/graphql/inspections";
import {
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { useAuthStore, useRefreshStore } from "@/store";
import { useMutation } from "@/lib/apollo-compat";
import { Building2, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CreateClientPageClient() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bumpRefresh = useRefreshStore((s) => s.bump);
  const router = useRouter();

  const [clientName, setClientName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [createClient, { loading }] = useMutation(CreateClient, {
    onCompleted: (data) => {
      if (data?.createClient?.client) bumpRefresh();
    },
  });

  useEffect(() => {
    if (
      !isAuthenticated ||
      (user &&
        user.userType !== "ADMINISTRADOR" &&
        user.userType !== "JEFE_DE_OBRA")
    ) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  if (
    !user ||
    (user.userType !== "ADMINISTRADOR" && user.userType !== "JEFE_DE_OBRA")
  ) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const { data } = await createClient({ variables: { clientName } });
      if (data?.createClient?.errors && data.createClient.errors.length > 0) {
        const message =
          data.createClient.errors[0]?.message || "Error al crear el cliente";
        setFormError(message);
        processGraphQLErrors(data.createClient.errors);
        return;
      }
      if (data?.createClient?.client) {
        router.push("/admin/clients");
      }
    } catch (err) {
      const wrapped = fromGenericError(err, "Error al crear el cliente");
      setFormError(wrapped.userMessage);
      notifyError(wrapped);
    }
  };

  const sidebar = (
    <Card radius={20}>
      <SectionHead title="Consejos" icon={<Info size={16} />} />
      <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-ink-2 dark:text-dark-ink-2">
        <li>
          Usa un nombre comercial reconocible. Aparecerá en inspecciones y
          reportes.
        </li>
        <li>Puedes editar el nombre del cliente más adelante.</li>
      </ul>
    </Card>
  );

  return (
    <AdminFormLayout
      mode="create"
      breadcrumb="Administración · Clientes"
      breadcrumbHref="/admin/clients"
      title="Nuevo cliente"
      subtitle="Crea un nuevo cliente para asignar inspecciones."
      loading={loading}
      error={formError}
      onSubmit={handleSubmit}
      sidebar={sidebar}
    >
      <Card radius={20}>
        <SectionHead title="Datos del cliente" icon={<Building2 size={16} />} />
        <div className="mt-4">
          <Field
            label="Nombre del cliente"
            icon={<Building2 size={15} />}
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ej: Construcciones Pérez S.L."
            required
          />
        </div>
      </Card>
    </AdminFormLayout>
  );
}
