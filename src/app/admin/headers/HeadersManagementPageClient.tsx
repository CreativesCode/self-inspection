"use client";

import { AdminTabs } from "@/components/admin/AdminTabs";
import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconBtn } from "@/components/ui/IconBtn";
import { Pill } from "@/components/ui/Pill";
import { SectionHead } from "@/components/ui/SectionHead";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DeleteHeader,
  DeleteQuestion,
  GetInspectionTypesWithHeaders,
  GetQuestions,
} from "@/graphql/inspections";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";
import { useMutation, useQuery } from "@/lib/apollo-compat";
import { useRefetchOnRefresh } from "@/hooks/useRefetchOnRefresh";
import {
  ChevronRight,
  Edit3,
  FileText,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface QuestionNode {
  id: string;
  questionText: string;
  createdAt?: string;
  updatedAt?: string;
  header?: { id: string; headerText: string };
  __typename?: "QuestionType";
}

interface Header {
  id: string;
  headerText: string;
  createdAt?: string;
  updatedAt?: string;
  __typename?: "HeaderType";
  inspectionType: { id: string; name: string };
  questions: QuestionNode[];
}

interface UnifiedInspectionTypesData {
  inspectionTypes: {
    edges: {
      node: {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
        headers: { edges: { node: Header }[] };
      };
    }[];
  };
}

export default function HeadersManagementPage() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark } = useTheme();

  const [selectedInspectionTypeId, setSelectedInspectionTypeId] = useState<
    string | null
  >(null);
  const [selectedHeaderId, setSelectedHeaderId] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const prevInspectionTypeIdRef = useRef<string | null>(null);
  const selectedHeaderIdRef = useRef<string | null>(null);

  const {
    data: inspectionTypesData,
    loading: inspectionTypesLoading,
    refetch: refetchInspectionTypes,
  } = useQuery<UnifiedInspectionTypesData>(GetInspectionTypesWithHeaders, {
    fetchPolicy: "network-only",
  });

  const {
    data: questionsData,
    loading: questionsLoading,
    refetch: refetchQuestions,
  } = useQuery(GetQuestions, {
    variables: { first: 100, offset: 0, header: selectedHeaderId },
    skip: !selectedHeaderId,
    fetchPolicy: "network-only",
  });

  const refetchAll = useCallback(() => {
    void refetchInspectionTypes();
    if (selectedHeaderId) void refetchQuestions();
  }, [refetchInspectionTypes, refetchQuestions, selectedHeaderId]);
  useRefetchOnRefresh(refetchAll);

  const inspectionTypes = useMemo(
    () =>
      inspectionTypesData?.inspectionTypes?.edges?.map((e) => e.node) || [],
    [inspectionTypesData?.inspectionTypes?.edges],
  );

  const headers: Header[] = useMemo(() => {
    if (!selectedInspectionTypeId) return [];
    const selectedType = inspectionTypes.find(
      (t) => t.id === selectedInspectionTypeId,
    );
    return (
      selectedType?.headers?.edges?.map((edge) => ({
        ...edge.node,
        inspectionType: {
          id: selectedType.id,
          name: selectedType.name,
        },
        questions: [],
      })) || []
    );
  }, [selectedInspectionTypeId, inspectionTypes]);

  const selectedHeader = useMemo(
    () => headers.find((h) => h.id === selectedHeaderId),
    [headers, selectedHeaderId],
  );

  const questions: QuestionNode[] = useMemo(
    () =>
      questionsData?.questions?.edges?.map(
        (edge: { node: QuestionNode }) => edge.node,
      ) || [],
    [questionsData?.questions?.edges],
  );

  const headerQuestionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (selectedHeaderId && questions.length > 0) {
      counts[selectedHeaderId] = questions.length;
    }
    return counts;
  }, [selectedHeaderId, questions.length]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteHeaderDialogOpen, setIsDeleteHeaderDialogOpen] =
    useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [headerToDelete, setHeaderToDelete] = useState<Header | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [deleteQuestion, { loading: deleteQuestionLoading }] = useMutation(
    DeleteQuestion,
    {
      onCompleted: () => {
        refetchInspectionTypes();
        if (selectedHeaderId) refetchQuestions();
        setIsDeleteDialogOpen(false);
        setQuestionToDelete(null);
        setDeleteError(null);
      },
      onError: (err) => setDeleteError(err.message),
    },
  );

  const [deleteHeader, { loading: deleteLoading }] = useMutation(DeleteHeader, {
    onCompleted: () => {
      refetchInspectionTypes();
      if (selectedHeaderId) refetchQuestions();
      setIsDeleteHeaderDialogOpen(false);
      setHeaderToDelete(null);
      setDeleteError(null);
    },
    onError: (err) => setDeleteError(err.message),
  });

  // Lectura de URL params al cargar
  useEffect(() => {
    const urlInspectionTypeId = searchParams.get("inspectionTypeId");
    const urlHeaderId = searchParams.get("headerId");
    if (urlInspectionTypeId) setSelectedInspectionTypeId(urlInspectionTypeId);
    if (urlHeaderId) setSelectedHeaderId(urlHeaderId);
    const timer = setTimeout(() => setIsInitialLoad(false), 100);
    return () => clearTimeout(timer);
  }, [searchParams]);

  // Auto-seleccionar primer tipo
  useEffect(() => {
    if (
      !inspectionTypesLoading &&
      inspectionTypes.length > 0 &&
      !selectedInspectionTypeId
    ) {
      const first = inspectionTypes[0]?.id;
      if (first) setSelectedInspectionTypeId(first);
    }
  }, [
    inspectionTypes,
    inspectionTypesLoading,
    selectedInspectionTypeId,
  ]);

  useEffect(() => {
    selectedHeaderIdRef.current = selectedHeaderId;
  }, [selectedHeaderId]);

  const updateURL = useCallback(
    (inspectionTypeId: string | null, headerId: string | null) => {
      const params = new URLSearchParams();
      if (inspectionTypeId) params.set("inspectionTypeId", inspectionTypeId);
      if (headerId) params.set("headerId", headerId);
      const newURL = `/admin/headers${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      router.replace(newURL, { scroll: false });
    },
    [router],
  );

  // Auto-seleccionar primer header al cambiar de TI
  useEffect(() => {
    if (isInitialLoad || inspectionTypesLoading) return;
    if (prevInspectionTypeIdRef.current !== selectedInspectionTypeId) {
      prevInspectionTypeIdRef.current = selectedInspectionTypeId;
      return;
    }
    if (headers.length > 0 && !selectedHeaderIdRef.current) {
      const first = headers[0]?.id;
      if (first) {
        setSelectedHeaderId(first);
        updateURL(selectedInspectionTypeId, first);
      }
    } else if (headers.length === 0 && selectedHeaderIdRef.current) {
      setSelectedHeaderId(null);
      updateURL(selectedInspectionTypeId, null);
    }
  }, [
    headers,
    inspectionTypesLoading,
    isInitialLoad,
    selectedInspectionTypeId,
    updateURL,
  ]);

  const handleInspectionTypeChange = useCallback(
    (id: string) => {
      setSelectedInspectionTypeId(id);
      setSelectedHeaderId(null);
      updateURL(id, null);
    },
    [updateURL],
  );

  const handleHeaderChange = useCallback(
    (id: string) => {
      setSelectedHeaderId(id);
      updateURL(selectedInspectionTypeId, id);
    },
    [selectedInspectionTypeId, updateURL],
  );

  const handleDeleteQuestionClick = useCallback((id: string) => {
    setQuestionToDelete(id);
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDeleteQuestion = useCallback(() => {
    if (questionToDelete) {
      deleteQuestion({ variables: { id: questionToDelete } });
    }
  }, [questionToDelete, deleteQuestion]);

  const handleDeleteHeaderClick = useCallback(
    (id: string) => {
      const info = headers.find((h) => h.id === id);
      if (info) {
        setHeaderToDelete(info);
        setDeleteError(null);
        setIsDeleteHeaderDialogOpen(true);
      }
    },
    [headers],
  );

  const confirmDeleteHeader = useCallback(() => {
    if (headerToDelete) {
      deleteHeader({ variables: { id: headerToDelete.id } });
    }
  }, [headerToDelete, deleteHeader]);

  useEffect(() => {
    if (!authLoading && user) {
      if (!isAuthenticated) router.push("/login");
      else if (user.userType !== "ADMINISTRADOR") router.push("/profile");
    }
  }, [isAuthenticated, user, authLoading, router]);

  const isLoading = authLoading || inspectionTypesLoading;
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-ink-2 dark:text-dark-ink-2">
        <Loader2 size={18} className="mr-2 animate-spin" /> Cargando…
      </div>
    );
  }
  if (!isAuthenticated || user?.userType !== "ADMINISTRADOR") return null;

  return (
    <div className="bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      <div className="mx-auto max-w-[1320px] px-3 pb-16 pt-5 sm:px-8 sm:pt-8">
        <AdminTabs active="headers" />

        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
              Administración · Estructura
            </div>
            <h1 className="m-0 mt-1.5 text-3xl font-extrabold tracking-tighter sm:text-[34px]">
              Encabezados y preguntas
            </h1>
            <p className="m-0 mt-1.5 text-sm text-ink-2 dark:text-dark-ink-2">
              Administra los headers y preguntas por tipo de inspección
            </p>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[220px_1.1fr_1.4fr]">
          {/* TI sidebar */}
          <Card radius={20} padding={16} className="overflow-hidden">
            <SectionHead
              title="Tipos de inspección"
              icon={<ShieldCheck size={16} />}
            />
            <div className="mt-4 grid gap-1">
              {inspectionTypes.length === 0 ? (
                <p className="text-sm text-ink-2 dark:text-dark-ink-2">
                  Sin tipos configurados.
                </p>
              ) : (
                inspectionTypes.map((t) => {
                  const isActive = selectedInspectionTypeId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleInspectionTypeChange(t.id)}
                      title={t.name}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[13px] font-semibold transition-colors",
                        isActive
                          ? "border border-[rgba(var(--accent-rgb),0.22)] bg-[rgba(var(--accent-rgb),0.08)] text-primary-600"
                          : "border border-transparent text-ink dark:text-dark-ink hover:bg-bg-2 dark:hover:bg-white/[0.03]",
                      )}
                    >
                      <span className="flex-1 truncate">{t.name}</span>
                      {isActive && (
                        <ChevronRight size={13} className="text-primary-500" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          {/* Headers list */}
          <Card radius={20} padding={16} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionHead
                title="Encabezados"
                subtitle={
                  selectedInspectionTypeId
                    ? `${headers.length} ${headers.length === 1 ? "header" : "headers"}`
                    : "Selecciona un tipo a la izquierda"
                }
                icon={<FileText size={16} />}
                action={
                  selectedInspectionTypeId ? (
                    <Pill tone="brand">{headers.length}</Pill>
                  ) : undefined
                }
              />
              <Button
                type="button"
                size="sm"
                icon={<Plus size={13} />}
                disabled={!selectedInspectionTypeId}
                onClick={() =>
                  router.push(
                    `/admin/headers/create?inspectionTypeId=${selectedInspectionTypeId}`,
                  )
                }
              >
                Header
              </Button>
            </div>

            <div className="mt-4 grid gap-2.5">
              {headers.length === 0 ? (
                <p className="m-0 rounded-[14px] border border-dashed border-hairline bg-bg-2 p-6 text-center text-sm text-ink-2 dark:border-hairline-dark dark:bg-white/[0.03] dark:text-dark-ink-2">
                  {selectedInspectionTypeId
                    ? "Sin headers en este tipo. Crea el primero."
                    : "Selecciona un tipo."}
                </p>
              ) : (
                headers.map((h) => {
                  const isActive = selectedHeaderId === h.id;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => handleHeaderChange(h.id)}
                      className={cn(
                        "group flex items-center gap-2.5 overflow-hidden rounded-[12px] border p-2.5 text-left transition-colors sm:gap-3 sm:p-3",
                        isActive
                          ? "border-[rgba(var(--accent-rgb),0.32)] bg-[rgba(var(--accent-rgb),0.06)]"
                          : "border-hairline bg-bg-2 hover:bg-white dark:border-hairline-dark dark:bg-white/[0.03] dark:hover:bg-white/[0.05]",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] sm:h-9 sm:w-9",
                          isActive
                            ? "bg-grad-brand text-white"
                            : "bg-surface text-ink-2 dark:bg-white/[0.06] dark:text-dark-ink-2",
                        )}
                      >
                        <FileText size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-semibold">
                          {h.headerText}
                        </div>
                        <div className="truncate text-[11px] text-ink-2 dark:text-dark-ink-2">
                          {headerQuestionCounts[h.id]
                            ? `${headerQuestionCounts[h.id]} preguntas`
                            : "Sin estadísticas"}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <IconBtn
                          tone="info"
                          title="Editar"
                          size={28}
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            router.push(
                              `/admin/headers/edit?id=${h.id}&inspectionTypeId=${selectedInspectionTypeId}`,
                            );
                          }}
                        >
                          <Edit3 size={12} />
                        </IconBtn>
                        <IconBtn
                          tone="bad"
                          title="Eliminar"
                          size={28}
                          disabled={deleteLoading}
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleDeleteHeaderClick(h.id);
                          }}
                        >
                          <Trash2 size={12} />
                        </IconBtn>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          {/* Questions */}
          <div className="lg:relative">
            <Card
              radius={20}
              padding={16}
              className="overflow-hidden lg:absolute lg:inset-0 lg:flex lg:flex-col"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SectionHead
                  title="Preguntas"
                  subtitle={
                    selectedHeader
                      ? selectedHeader.headerText
                      : "Selecciona un header"
                  }
                  icon={<Sparkles size={16} />}
                  action={
                    selectedHeaderId ? (
                      <Pill tone="ok">{questions.length}</Pill>
                    ) : undefined
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  icon={<Plus size={13} />}
                  disabled={!selectedHeaderId}
                  onClick={() =>
                    router.push(
                      `/admin/questions/create?headerId=${selectedHeaderId}&inspectionTypeId=${selectedInspectionTypeId}`,
                    )
                  }
                >
                  Pregunta
                </Button>
              </div>

              {deleteError && (
                <div className="mt-4 rounded-[12px] border border-[rgba(var(--accent-rgb),0.32)] bg-[rgba(var(--accent-rgb),0.06)] p-3 text-[13px] text-primary-700">
                  {deleteError}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2.5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
                {questionsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-ink-2 dark:text-dark-ink-2">
                    <Loader2 size={16} className="animate-spin" /> Cargando
                    preguntas…
                  </div>
                ) : questions.length === 0 ? (
                  <p className="m-0 rounded-[14px] border border-dashed border-hairline bg-bg-2 p-6 text-center text-sm text-ink-2 dark:border-hairline-dark dark:bg-white/[0.03] dark:text-dark-ink-2">
                    {selectedHeaderId
                      ? "Sin preguntas en este header. Añade la primera."
                      : "Selecciona un header para ver sus preguntas."}
                  </p>
                ) : (
                  questions.map((q, i) => (
                    <div
                      key={q.id}
                      className="flex shrink-0 items-start gap-2.5 overflow-hidden rounded-[12px] border border-hairline bg-bg-2 p-2.5 dark:border-hairline-dark dark:bg-white/[0.03] sm:gap-3 sm:p-3.5"
                    >
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-grad-brand text-[12px] font-extrabold text-white">
                        {i + 1}
                      </span>
                      <p className="m-0 min-w-0 flex-1 break-words text-[13px] leading-relaxed sm:text-[14px]">
                        {q.questionText}
                      </p>
                      <div className="flex shrink-0 gap-1">
                        <IconBtn
                          tone="info"
                          title="Editar"
                          size={28}
                          onClick={() =>
                            router.push(
                              `/admin/questions/edit?id=${q.id}&headerId=${selectedHeaderId}&inspectionTypeId=${selectedInspectionTypeId}`,
                            )
                          }
                        >
                          <Edit3 size={12} />
                        </IconBtn>
                        <IconBtn
                          tone="bad"
                          title="Eliminar"
                          size={28}
                          disabled={
                            deleteQuestionLoading && questionToDelete === q.id
                          }
                          onClick={() => handleDeleteQuestionClick(q.id)}
                        >
                          <Trash2 size={12} />
                        </IconBtn>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>

        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setQuestionToDelete(null);
          }}
          onConfirm={confirmDeleteQuestion}
          title="Eliminar pregunta"
          message="¿Estás seguro de que deseas eliminar esta pregunta? Esta acción no se puede deshacer."
          isDark={isDark}
          isLoading={deleteQuestionLoading}
          confirmText="Eliminar pregunta"
        />

        <ConfirmationDialog
          isOpen={isDeleteHeaderDialogOpen}
          onClose={() => {
            setIsDeleteHeaderDialogOpen(false);
            setHeaderToDelete(null);
            setDeleteError(null);
          }}
          onConfirm={confirmDeleteHeader}
          title="Eliminar header"
          message={
            headerToDelete
              ? `¿Estás seguro de que deseas eliminar el header "${headerToDelete.headerText}" del tipo "${headerToDelete.inspectionType.name}"? Esta acción eliminará también todas las preguntas asociadas y no se puede deshacer.`
              : "¿Estás seguro de que deseas eliminar este header?"
          }
          isDark={isDark}
          isLoading={deleteLoading}
          confirmText="Eliminar header"
        />
      </div>
    </div>
  );
}
