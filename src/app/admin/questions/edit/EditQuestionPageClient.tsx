"use client";

import { AdminFormLayout } from "@/components/admin/AdminFormLayout";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { SectionHead } from "@/components/ui/SectionHead";
import {
  GetHeaders,
  GetQuestion,
  UpdateQuestion,
} from "@/graphql/inspections";
import {
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { useAuthStore, useRefreshStore } from "@/store";
import { useMutation, useQuery } from "@/lib/apollo-compat";
import { FileText, Info, Loader2, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Header {
  id: string;
  headerText: string;
}
interface HeadersData {
  headers: { edges: { node: Header }[] };
}
interface QuestionData {
  question: {
    id: string;
    questionText: string;
    header: { id: string; headerText: string };
  };
}

export default function EditQuestionPageClient() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const bumpRefresh = useRefreshStore((s) => s.bump);
  const router = useRouter();
  const searchParams = useSearchParams();

  const questionId = searchParams.get("id");
  const urlHeaderId = searchParams.get("headerId");
  const urlInspectionTypeId = searchParams.get("inspectionTypeId");

  const [questionText, setQuestionText] = useState("");
  const [selectedHeaderId, setSelectedHeaderId] = useState<string>("");
  const [initialText, setInitialText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: questionData, loading: questionLoading, error: questionError } =
    useQuery<QuestionData>(GetQuestion, {
      variables: { id: questionId },
      skip: !questionId,
      onCompleted: (data) => {
        if (data?.question) {
          setQuestionText(data.question.questionText);
          setSelectedHeaderId(data.question.header.id);
          setInitialText(data.question.questionText);
        }
      },
    });

  const { data: headersData, loading: headersLoading } = useQuery<HeadersData>(
    GetHeaders,
    { variables: { first: 100, offset: 0 } },
  );

  const [updateQuestion, { loading }] = useMutation(UpdateQuestion, {
    onCompleted: (data) => {
      if (data?.updateQuestion?.errors?.length) return;
      bumpRefresh();
      setSuccess("Pregunta actualizada correctamente. Redirigiendo…");
      setTimeout(() => {
        const url =
          urlInspectionTypeId && urlHeaderId
            ? `/admin/headers?inspectionTypeId=${urlInspectionTypeId}&headerId=${urlHeaderId}`
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

  if (!questionId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-primary-700">
          Error: ID de pregunta no proporcionado
        </div>
      </div>
    );
  }

  if (questionLoading || headersLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-2 dark:text-dark-ink-2">
        <Loader2 size={18} className="mr-2 animate-spin" /> Cargando pregunta…
      </div>
    );
  }

  if (questionError) {
    return (
      <div className="mx-auto max-w-[600px] px-4 py-12">
        <Card
          radius={16}
          className="!border-[rgba(var(--accent-rgb),0.32)] !bg-[rgba(var(--accent-rgb),0.06)]"
        >
          <div className="text-sm text-primary-700">
            Error al cargar la pregunta: {questionError.message}
          </div>
        </Card>
      </div>
    );
  }

  if (!user || user.userType !== "ADMINISTRADOR") return null;

  const headers = headersData?.headers?.edges?.map((e) => e.node) || [];
  const currentHeaderText =
    headers.find((h) => h.id === selectedHeaderId)?.headerText ||
    questionData?.question?.header?.headerText ||
    "—";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    if (!questionText.trim()) {
      setFormError("El texto de la pregunta no puede estar vacío");
      return;
    }
    try {
      const { data } = await updateQuestion({
        variables: {
          id: questionId,
          questionText: questionText.trim(),
          headerId: selectedHeaderId,
        },
      });
      if (data?.updateQuestion?.errors && data.updateQuestion.errors.length > 0) {
        const message =
          data.updateQuestion.errors[0]?.message ||
          "Error al actualizar la pregunta";
        setFormError(message);
        processGraphQLErrors(data.updateQuestion.errors);
      }
    } catch (err) {
      const wrapped = fromGenericError(
        err,
        "Error al actualizar la pregunta",
      );
      setFormError(wrapped.userMessage);
      notifyError(wrapped);
    }
  };

  const cancelHref =
    urlInspectionTypeId && urlHeaderId
      ? `/admin/headers?inspectionTypeId=${urlInspectionTypeId}&headerId=${urlHeaderId}`
      : urlInspectionTypeId
        ? `/admin/headers?inspectionTypeId=${urlInspectionTypeId}`
        : "/admin/headers";

  const changed = questionText !== initialText;

  const sidebar = (
    <Card radius={20}>
      <SectionHead title="Notas" icon={<Info size={16} />} />
      <p className="mt-3 text-[13px] leading-relaxed text-ink-2 dark:text-dark-ink-2">
        Esta pregunta pertenece al encabezado{" "}
        <strong className="font-semibold text-ink dark:text-dark-ink">
          {currentHeaderText}
        </strong>
        . Para reasignarla, vuelve a la gestión de encabezados.
      </p>
    </Card>
  );

  return (
    <AdminFormLayout
      mode="edit"
      breadcrumb="Administración · Preguntas"
      breadcrumbHref={cancelHref}
      title="Editar pregunta"
      subtitle="Modifica el texto de la pregunta."
      loading={loading}
      error={formError}
      success={success}
      onSubmit={handleSubmit}
      cancelHref={cancelHref}
      sidebar={sidebar}
    >
      <Card radius={20}>
        <SectionHead title="Encabezado actual" icon={<FileText size={16} />} />
        <div className="mt-4">
          <Field
            label="Encabezado"
            icon={<FileText size={15} />}
            value={currentHeaderText}
            locked
            tag="Para cambiar el encabezado, mueve la pregunta desde la gestión de encabezados"
          />
        </div>
      </Card>

      <Card radius={20}>
        <SectionHead title="Pregunta" icon={<Sparkles size={16} />} />
        <div className="mt-4">
          <Field
            label="Texto de la pregunta"
            icon={<FileText size={15} />}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            changed={changed}
            required
          />
        </div>
      </Card>
    </AdminFormLayout>
  );
}
