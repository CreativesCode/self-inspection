"use client";

import { AdminFormLayout } from "@/components/admin/AdminFormLayout";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { SectionHead } from "@/components/ui/SectionHead";
import { GetClient, UpdateClient } from "@/graphql/inspections";
import {
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { useAuthStore, useRefreshStore } from "@/store";
import { useMutation, useQuery } from "@/lib/apollo-compat";
import { Building2, Info, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditClientPageClient() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bumpRefresh = useRefreshStore((s) => s.bump);
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("id");

  const [clientName, setClientName] = useState("");
  const [initial, setInitial] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data, loading: loadingClient, error } = useQuery(GetClient, {
    variables: { id: clientId },
    skip: !clientId,
  });

  const [updateClient, { loading }] = useMutation(UpdateClient, {
    onCompleted: (res) => {
      if (!res?.updateClient?.errors?.length) bumpRefresh();
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

  useEffect(() => {
    if (data?.client) {
      setClientName(data.client.clientName);
      setInitial(data.client.clientName);
    }
  }, [data]);

  if (!clientId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-primary-700">
          Error: ID de cliente no proporcionado
        </div>
      </div>
    );
  }

  if (
    !user ||
    (user.userType !== "ADMINISTRADOR" && user.userType !== "JEFE_DE_OBRA")
  ) {
    return null;
  }

  if (loadingClient) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-2 dark:text-dark-ink-2">
        <Loader2 size={18} className="mr-2 animate-spin" /> Cargando cliente…
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
            Error al cargar el cliente: {error.message}
          </div>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const { data: res } = await updateClient({
        variables: { id: clientId, clientName },
      });
      if (res?.updateClient?.errors && res.updateClient.errors.length > 0) {
        const message =
          res.updateClient.errors[0]?.message ||
          "Error al actualizar el cliente";
        setFormError(message);
        processGraphQLErrors(res.updateClient.errors);
        return;
      }
      router.push("/admin/clients");
    } catch (err) {
      const wrapped = fromGenericError(err, "Error al actualizar el cliente");
      setFormError(wrapped.userMessage);
      notifyError(wrapped);
    }
  };

  const changed = clientName !== initial;

  const sidebar = (
    <Card radius={20}>
      <SectionHead title="Notas" icon={<Info size={16} />} />
      <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-ink-2 dark:text-dark-ink-2">
        <li>
          Cambiar el nombre del cliente lo actualizará en todas las
          inspecciones asociadas.
        </li>
      </ul>
    </Card>
  );

  return (
    <AdminFormLayout
      mode="edit"
      breadcrumb="Administración · Clientes"
      breadcrumbHref="/admin/clients"
      title="Editar cliente"
      subtitle="Modifica los datos del cliente."
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
            changed={changed}
            required
          />
        </div>
      </Card>
    </AdminFormLayout>
  );
}
