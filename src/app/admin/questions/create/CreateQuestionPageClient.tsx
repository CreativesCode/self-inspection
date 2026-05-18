"use client";

import { AdminFormLayout } from "@/components/admin/AdminFormLayout";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { SectionHead } from "@/components/ui/SectionHead";
import { CreateQuestion } from "@/graphql/inspections";
import {
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { useAuthStore, useRefreshStore } from "@/store";
import { useMutation } from "@/lib/apollo-compat";
import { FileText, Info, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function CreateQuestionForm() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const bumpRefresh = useRefreshStore((s) => s.bump);
  const router = useRouter();
  const searchParams = useSearchParams();
  const headerId = searchParams?.get("headerId");
  const urlInspectionTypeId = searchParams?.get("inspectionTypeId");

  const [questionText, setQuestionText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createQuestion, { loading }] = useMutation(CreateQuestion, {
    onCompleted: (data) => {
      if (data?.createQuestion?.errors?.length) return;
      bumpRefresh();
      setSuccess("Pregunta creada correctamente. Redirigiendo…");
      setTimeout(() => {
        const url =
          urlInspectionTypeId && headerId
            ? `/admin/headers?inspectionTypeId=${urlInspectionTypeId}&headerId=${headerId}`
            : urlInspectionTypeId
              ? `/admin/headers?inspectionTypeId=${urlInspectionTypeId}`
              : "/admin/headers";
        router.push(url);
      }, 1200);
    },
    onError: (err) => setFormError(err.message),
  });

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) router.push("/login");
      else if (user?.userType !== "ADMINISTRADOR") router.push("/profile");
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (!user || user.userType !== "ADMINISTRADOR") return null;

  const cancelHref =
    urlInspectionTypeId && headerId
      ? `/admin/headers?inspectionTypeId=${urlInspectionTypeId}&headerId=${headerId}`
      : urlInspectionTypeId
        ? `/admin/headers?inspectionTypeId=${urlInspectionTypeId}`
        : "/admin/headers";

  if (!headerId) {
    return (
      <div className="mx-auto max-w-[600px] px-4 py-12">
        <Card
          radius={16}
          className="!border-[rgba(var(--accent-rgb),0.32)] !bg-[rgba(var(--accent-rgb),0.06)]"
        >
          <div className="text-sm text-primary-700">
            ID de encabezado no encontrado o inválido en la URL.
          </div>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    if (!questionText.trim()) {
      setFormError("El texto de la pregunta no puede estar vacío");
      return;
    }
    try {
      const { data } = await createQuestion({
        variables: { questionText: questionText.trim(), headerId },
      });
      if (data?.createQuestion?.errors && data.createQuestion.errors.length > 0) {
        const message =
          data.createQuestion.errors[0]?.message ||
          "Error al crear la pregunta";
        setFormError(message);
        processGraphQLErrors(data.createQuestion.errors);
      }
    } catch (err) {
      const wrapped = fromGenericError(err, "Error al crear la pregunta");
      setFormError(wrapped.userMessage);
      notifyError(wrapped);
    }
  };

  const sidebar = (
    <Card radius={20}>
      <SectionHead title="Consejos" icon={<Info size={16} />} />
      <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-ink-2 dark:text-dark-ink-2">
        <li>
          Redacta la pregunta de forma clara y específica. El inspector debe
          poder responderla con <em>Bien / Mal / N/A</em>.
        </li>
        <li>
          Evita preguntas compuestas («¿Está limpio y nivelado?»). Es mejor
          separarlas.
        </li>
      </ul>
    </Card>
  );

  return (
    <AdminFormLayout
      mode="create"
      breadcrumb="Administración · Preguntas"
      breadcrumbHref={cancelHref}
      title="Nueva pregunta"
      subtitle="Añade una nueva pregunta al encabezado seleccionado."
      loading={loading}
      error={formError}
      success={success}
      onSubmit={handleSubmit}
      cancelHref={cancelHref}
      sidebar={sidebar}
    >
      <Card radius={20}>
        <SectionHead title="Pregunta" icon={<Sparkles size={16} />} />
        <div className="mt-4">
          <Field
            label="Texto de la pregunta"
            icon={<FileText size={15} />}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Ej: ¿El encofrado está correctamente apuntalado?"
            required
          />
        </div>
      </Card>
    </AdminFormLayout>
  );
}

export default function CreateQuestionPage() {
  const fallback = (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-2 dark:text-dark-ink-2">
      Cargando…
    </div>
  );
  return (
    <Suspense fallback={fallback}>
      <CreateQuestionForm />
    </Suspense>
  );
}
