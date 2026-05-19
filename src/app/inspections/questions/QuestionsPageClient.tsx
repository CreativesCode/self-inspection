"use client";

/**
 * Flujo de consultas GraphQL:
 * 1. GetInspection: Obtiene datos de la inspección
 * 2. GetHeaders: Obtiene headers y preguntas (depende del tipo de inspección)
 * 3. GetPolls: Obtiene encuestas existentes (depende del ID de inspección)
 *
 * Las consultas se ejecutan en orden secuencial para evitar consultas innecesarias.
 */

// import { SmartPullToRefresh } from "@/components/SmartPullToRefresh";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import {
  QuestionCard,
  type ReactionValue,
} from "@/components/ui/QuestionCard";
import { Stepper } from "@/components/ui/Stepper";
import { useTheme } from "@/contexts/ThemeContext";
import { useCamera } from "@/hooks/useCamera";
import {
  GetInspectionWithQuestions,
  UnifiedInspectionData,
} from "@/graphql/inspections";
import {
  CreateAnswer,
  CreatePoll,
  UpdateAnswer,
  UpdatePoll,
} from "@/graphql/poll";
import {
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { cn, getFullImageUrl } from "@/lib/utils";
import { deleteMediaByUrl, uploadObservationPhoto } from "@/lib/data/storage";
import { useApolloClient, useMutation, useQuery } from "@/lib/apollo-compat";
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Loader2,
  Save,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

interface Question {
  id: string;
  questionText: string;
  createdAt: string;
  updatedAt: string;
  header: {
    id: string;
    headerText: string;
  };
}

interface Header {
  id: string;
  headerText: string;
  createdAt: string;
  updatedAt: string;
  inspectionType: {
    id: string;
    name: string;
  };
  questions: Question[];
}

type ReactionType = ReactionValue | null;

const STEPS = [
  { label: "Datos", icon: FileText },
  { label: "Encuesta", icon: ClipboardList },
];

interface QuestionReaction {
  questionId: string;
  reaction: ReactionType;
}

interface Observation {
  questionId: string;
  text: string;
  photos: string[];
}

interface AnswerTracking {
  questionId: string;
  answerId: string;
}

interface LoadedAnswer {
  id: string;
  answerText: string;
  questionId: string;
  observation: {
    id: string;
    observationText: string;
    photos: string[];
  } | null;
}

const ObservationDialog = ({
  isOpen,
  onClose,
  onSave,
  questionId,
  questionText,
  initialObservation,
  pollCompleted,
  isLoading,
  inspectionId,
  onImageLoadStart,
  onImageLoad,
  onImageError,
  onImageClick,
  imageLoadingStates,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (observation: { text: string; photos: string[] }) => void;
  // `theme` se mantiene en el call site por compatibilidad pero ya no se
  // usa: el dark mode se resuelve por clase Tailwind global.
  theme?: string;
  questionId: string;
  questionText: string;
  initialObservation?: { text: string; photos: string[] } | null;
  pollCompleted?: boolean;
  isLoading?: boolean;
  /** Necesario para construir el path de la foto en Supabase Storage. */
  inspectionId: string;
  onImageLoadStart?: (imageKey: string) => void;
  onImageLoad?: (imageKey: string) => void;
  onImageError?: (imageKey: string) => void;
  onImageClick?: (imageUrl: string) => void;
  imageLoadingStates?: { [key: string]: boolean };
}) => {
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoValidationError, setPhotoValidationError] = useState<
    string | null
  >(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  // Fotos que ya estaban guardadas cuando se abrió el dialog.
  // Sirve para distinguir borrado inmediato (subida nueva, huérfana en Storage)
  // de borrado diferido (referenciada en BD; se borra del bucket cuando se
  // confirma el guardado, para no romper la BD si el usuario cancela).
  const loadedPhotosRef = useRef<Set<string>>(new Set());
  const pendingDeletesRef = useRef<Set<string>>(new Set());
  const modalRef = useRef<HTMLDivElement>(null);
  const cameraModalRef = useRef<HTMLDivElement>(null);

  const {
    isCameraOpen,
    videoReady,
    cameraError,
    currentFacingMode,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhotoBlob,
  } = useCamera();

  useEffect(() => {
    if (initialObservation) {
      setText(initialObservation.text);
      setPhotos(initialObservation.photos);
    } else {
      setText("");
      setPhotos([]);
    }
  }, [initialObservation]);

  // Limpieza cámara al cerrar el modal
  useEffect(() => {
    if (!isOpen) stopCamera();
  }, [isOpen, stopCamera]);

  // Cierre al hacer click fuera del modal.
  // OJO: el modal de cámara se renderiza como sibling (z-index superior),
  // así que un click dentro de él NO debe cerrar el modal de observación.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (modalRef.current && modalRef.current.contains(target)) return;
      if (cameraModalRef.current && cameraModalRef.current.contains(target)) return;
      onClose();
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const capturePhoto = async () => {
    try {
      setIsUploadingPhoto(true);
      const blob = await capturePhotoBlob();
      if (!blob) {
        stopCamera();
        return;
      }
      const url = await uploadObservationPhoto(blob, inspectionId);
      setPhotos((p) => [...p, url]);
      stopCamera();
    } catch (err) {
      notifyError(fromGenericError(err, "Error al subir la foto"));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const removePhoto = (index: number) => {
    const url = photos[index];
    setPhotos((p) => p.filter((_, i) => i !== index));
    if (url) void deleteMediaByUrl(url);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setPhotoValidationError(null);
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const invalidFiles: string[] = [];
    const validFiles: File[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(
          `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
        );
      } else {
        validFiles.push(file);
      }
    });
    if (invalidFiles.length > 0) {
      setPhotoValidationError(
        `Los siguientes archivos exceden 10MB: ${invalidFiles.join(", ")}`,
      );
    }
    if (validFiles.length > 0) {
      try {
        setIsUploadingPhoto(true);
        const uploaded = await Promise.all(
          validFiles.map((f) => uploadObservationPhoto(f, inspectionId)),
        );
        setPhotos((p) => [...p, ...uploaded]);
      } catch (err) {
        notifyError(fromGenericError(err, "Error al subir las fotos"));
      } finally {
        setIsUploadingPhoto(false);
        // Resetear el input para permitir re-seleccionar el mismo archivo.
        e.target.value = "";
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ text, photos });
    setText("");
    setPhotos([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1900] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4 sm:pt-20">
      <div ref={modalRef} className="w-full sm:max-w-2xl">
        <Card
          radius={20}
          padding={0}
          className="flex max-h-[calc(95vh-env(safe-area-inset-top,0px))] flex-col overflow-hidden !rounded-b-none sm:max-h-[calc(90vh-2rem)] sm:!rounded-b-[20px]"
        >
          {/* Drag handle (solo mobile) */}
          <div className="flex justify-center pt-2 sm:hidden">
            <span className="h-1.5 w-10 rounded-full bg-ink-3/40 dark:bg-white/15" />
          </div>

          {/* Header */}
          <div className="flex items-start gap-3 border-b border-hairline px-5 py-4 dark:border-hairline-dark">
            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--accent-rgb),0.10)] text-primary-600">
              <FileText size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="m-0 text-base font-bold leading-tight">
                {pollCompleted ? "Observación" : "Añadir observación"}
              </h3>
              <p className="m-0 mt-1 line-clamp-2 text-[13px] text-ink-2 dark:text-dark-ink-2">
                {questionText}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-2 text-ink-2 hover:brightness-95 dark:bg-white/[0.06] dark:text-dark-ink-2"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form id="obs-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor={`obs-text-${questionId}`}
                  className="text-xs font-semibold tracking-tight text-ink-2 dark:text-dark-ink-2"
                >
                  Observación <span className="text-primary-500">*</span>
                </label>
                <textarea
                  id={`obs-text-${questionId}`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  required={!pollCompleted}
                  disabled={pollCompleted}
                  readOnly={pollCompleted}
                  placeholder={
                    pollCompleted
                      ? ""
                      : "Describe lo que has detectado, por qué es problemático y qué acción se tomó…"
                  }
                  className={cn(
                    "mt-1.5 min-h-[110px] w-full resize-y rounded-[12px] px-3.5 py-3 text-sm outline-none",
                    "border border-hairline bg-bg-2 text-ink placeholder:text-ink-3",
                    "dark:border-hairline-dark dark:bg-white/[0.03] dark:text-dark-ink",
                    pollCompleted && "cursor-not-allowed opacity-70",
                  )}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold tracking-tight text-ink-2 dark:text-dark-ink-2">
                    Fotos {pollCompleted ? "" : "(opcionales)"}
                  </label>
                  <span className="text-[11px] text-ink-3 dark:text-dark-ink-2">
                    Máx. 10 MB por imagen
                  </span>
                </div>

                {/* Errores de validación */}
                {photoValidationError && (
                  <div className="mt-2 flex items-start gap-2 rounded-[12px] border border-[rgba(var(--accent-rgb),0.20)] bg-[rgba(var(--accent-rgb),0.06)] p-3 text-[13px] text-primary-700">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>{photoValidationError}</span>
                  </div>
                )}
                {cameraError && (
                  <div className="mt-2 flex items-start gap-2 rounded-[12px] border border-[rgba(var(--accent-rgb),0.20)] bg-[rgba(var(--accent-rgb),0.06)] p-3 text-[13px] text-primary-700">
                    <Camera size={14} className="mt-0.5 shrink-0" />
                    <span>Error de cámara: {cameraError}</span>
                  </div>
                )}

                {/* Botones de añadir foto */}
                {!pollCompleted && (
                  <div className="mt-2.5 flex flex-wrap gap-2.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={
                        isUploadingPhoto ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Camera size={13} />
                        )
                      }
                      onClick={() => startCamera()}
                      disabled={isCameraOpen || isUploadingPhoto}
                    >
                      {isUploadingPhoto ? "Subiendo…" : "Tomar foto"}
                    </Button>
                    <label
                      htmlFor={`photos-${questionId}`}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-2 rounded-full border border-hairline bg-[rgba(27,22,20,0.03)] px-3.5 py-2 text-[13px] font-medium text-ink-2 hover:brightness-95 dark:border-hairline-dark dark:bg-white/[0.04] dark:text-dark-ink-2",
                        isUploadingPhoto && "pointer-events-none opacity-60",
                      )}
                    >
                      {isUploadingPhoto ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Upload size={13} />
                      )}{" "}
                      {isUploadingPhoto ? "Subiendo…" : "Subir fotos"}
                    </label>
                    <input
                      id={`photos-${questionId}`}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                    {photos.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={<X size={13} />}
                        onClick={() => {
                          const toDelete = photos.slice();
                          setPhotos([]);
                          setPhotoValidationError(null);
                          toDelete.forEach((u) => void deleteMediaByUrl(u));
                        }}
                        className="!text-primary-600"
                      >
                        Limpiar todas
                      </Button>
                    )}
                  </div>
                )}

                {/* Preview de fotos */}
                {photos.length > 0 && (
                  <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {photos.map((photo, index) => {
                      const imageKey = `photo-${index}`;
                      const fullUrl = getFullImageUrl(photo) ?? photo;
                      return (
                        <div
                          key={`${imageKey}-${index}`}
                          className="group relative aspect-[4/3] overflow-hidden rounded-[12px] border border-hairline dark:border-hairline-dark"
                        >
                          {imageLoadingStates?.[imageKey] && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-2 dark:bg-white/[0.05]">
                              <Loader2
                                size={20}
                                className="animate-spin text-ink-2 dark:text-dark-ink-2"
                              />
                            </div>
                          )}
                          <Image
                            src={fullUrl}
                            alt={`Foto ${index + 1}`}
                            fill
                            sizes="(max-width: 640px) 50vw, 33vw"
                            className="cursor-pointer object-cover transition-opacity hover:opacity-90"
                            unoptimized
                            onLoadStart={() => onImageLoadStart?.(imageKey)}
                            onLoad={() => onImageLoad?.(imageKey)}
                            onError={() => onImageError?.(imageKey)}
                            onClick={() => onImageClick?.(fullUrl)}
                          />
                          {!pollCompleted && (
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/75 group-hover:opacity-100"
                              title="Quitar foto"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* El canvas oculto vive en el modal de cámara (más abajo).
                    Aquí ya no lo renderizamos porque, al compartir el mismo
                    `canvasRef`, dos canvas montados a la vez pisaban la ref. */}
              </div>
            </form>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-2 border-t border-hairline bg-bg-2 px-5 pt-3 dark:border-hairline-dark dark:bg-white/[0.02]"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)",
            }}
          >
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              {pollCompleted ? "Cerrar" : "Cancelar"}
            </Button>
            {!pollCompleted && (
              <Button
                type="submit"
                size="sm"
                form="obs-form"
                disabled={isLoading}
                icon={
                  isLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )
                }
              >
                {isLoading ? "Guardando…" : "Guardar"}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Modal de cámara */}
      {isCameraOpen && (
        <div
          ref={cameraModalRef}
          className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/75 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) stopCamera();
          }}
        >
          <Card
            radius={24}
            padding={0}
            className="relative w-full max-w-3xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4 dark:border-hairline-dark">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-primary-500" />
                <h3 className="m-0 text-base font-bold">Tomar foto</h3>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-bg-2 text-ink-2 hover:brightness-95 dark:bg-white/[0.06] dark:text-dark-ink-2"
              >
                <X size={16} />
              </button>
            </div>
            <div className="bg-black p-2">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="block h-auto max-h-[60vh] w-full rounded-lg bg-black"
                onLoadedMetadata={() =>
                  videoRef.current?.play().catch(() => undefined)
                }
                onCanPlay={() =>
                  videoRef.current?.play().catch(() => undefined)
                }
              />
              {!videoReady && (
                <div className="mt-2 flex items-center justify-center gap-2 py-3 text-sm text-white/80">
                  <Loader2 size={14} className="animate-spin" />
                  Iniciando cámara…
                </div>
              )}
              {/* Canvas oculto: capturePhoto() del hook lo necesita para
                  renderizar el frame del video y exportarlo a base64. */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex flex-col items-center gap-3 px-5 py-4">
              <Pill>
                Cámara {currentFacingMode === "environment" ? "trasera" : "frontal"}
              </Pill>
              <div className="flex flex-wrap justify-center gap-2.5">
                <Button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!videoReady || isUploadingPhoto}
                  icon={
                    isUploadingPhoto ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )
                  }
                >
                  {isUploadingPhoto ? "Subiendo…" : "Capturar"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => switchCamera()}
                  disabled={!videoReady}
                >
                  Cambiar cámara
                </Button>
                <Button type="button" variant="ghost" onClick={stopCamera}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default function QuestionsPageClient() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inspectionId = searchParams.get("id");

  const [reactions, setReactions] = useState<QuestionReaction[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  // Header activo (sección actualmente enfocada). Permite navegación por la lista de la izquierda.
  const [activeHeaderId, setActiveHeaderId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [pollCreated, setPollCreated] = useState(false);
  const [pollId, setPollId] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationColor, setNotificationColor] = useState("bg-green-500");
  const [, setSavedAnswers] = useState<AnswerTracking[]>([]);
  const [, setLoadingAnswers] = useState(false);
  const [savingPoll, setSavingPoll] = useState(false);
  const [pollCompleted, setPollCompleted] = useState(false);
  const [expandedHeaders, setExpandedHeaders] = useState<Set<string>>(
    new Set()
  );
  const [hasInitializedHeaders, setHasInitializedHeaders] = useState(false);

  // Estados para modal de imagen con zoom
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoadingStates, setImageLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});

  const apolloClient = useApolloClient();

  // Función para refrescar la página (comentada)
  // const handleRefresh = async () => {
  //   try {
  //     // Refrescar todas las consultas GraphQL
  //     await apolloClient.refetchQueries({
  //       include: "all"
  //     });

  //     // También refrescar la página completa como fallback
  //     window.location.reload();
  //   } catch (error) {
  //     // Error silencioso en producción
  //     if (process.env.NODE_ENV === 'development') {
  //       console.error('Error al refrescar:', error);
  //     }
  //     // Fallback a recargar la página
  //     window.location.reload();
  //   }
  // };

  const [createPoll] = useMutation(CreatePoll, {
    refetchQueries: ["GetInspections"],
    awaitRefetchQueries: true,
  });
  const [createAnswer, { loading: createAnswerLoading }] = useMutation(
    CreateAnswer,
    {
      refetchQueries: ["GetInspections"],
      awaitRefetchQueries: true,
    }
  );
  const [] = useMutation(UpdateAnswer, {
    refetchQueries: ["GetInspections"],
    awaitRefetchQueries: true,
  });
  const [updatePoll] = useMutation(UpdatePoll, {
    refetchQueries: ["GetInspections"],
    awaitRefetchQueries: true,
  });

  // Consulta unificada que obtiene inspección, headers, preguntas y polls
  const {
    data: unifiedData,
    loading: unifiedLoading,
    error: unifiedError,
  } = useQuery<UnifiedInspectionData>(GetInspectionWithQuestions, {
    variables: { id: inspectionId },
    skip: !inspectionId,
    fetchPolicy: "network-only",
  });

  // Extraer datos de la consulta unificada usando useMemo para evitar recrear arrays
  const inspectionData = React.useMemo(
    () => unifiedData?.inspection,
    [unifiedData?.inspection]
  );
  const headersData = React.useMemo(
    () =>
      unifiedData?.inspection?.headers?.edges?.map((edge) => edge.node) || [],
    [unifiedData?.inspection?.headers?.edges]
  );
  const pollsData = React.useMemo(
    () => unifiedData?.inspection?.polls?.edges?.map((edge) => edge.node) || [],
    [unifiedData?.inspection?.polls?.edges]
  );

  const loadAnswers = React.useCallback(
    async (pollIdToLoad: string) => {
      try {
        setLoadingAnswers(true);

        // Usar los datos ya cargados por la consulta unificada
        const poll = pollsData?.find((p) => p.id === pollIdToLoad);
        if (poll && poll.answers?.edges && poll.answers.edges.length > 0) {
          const loadedAnswers: LoadedAnswer[] = poll.answers.edges.map(
            (edge) => {
              const answer = edge.node;
              return {
                id: answer.id,
                answerText: answer.answerText,
                questionId: answer.question.id,
                observation: answer.observation
                  ? {
                      id: answer.observation.id,
                      observationText: answer.observation.observationText,
                      photos: answer.observation.photos.map((p) => p.photo),
                    }
                  : null,
              };
            }
          );

          const loadedReactions: QuestionReaction[] = loadedAnswers.map(
            (answer) => ({
              questionId: answer.questionId,
              reaction: mapAnswerToReaction(answer.answerText),
            })
          );

          const loadedObservations: Observation[] = loadedAnswers
            .filter((answer) => answer.observation !== null)
            .map((answer) => ({
              questionId: answer.questionId,
              text: answer.observation?.observationText || "",
              photos: answer.observation?.photos || [],
            }));

          setReactions(loadedReactions);
          setObservations(loadedObservations);

          const answerTrackings: AnswerTracking[] = loadedAnswers.map(
            (answer) => ({
              questionId: answer.questionId,
              answerId: answer.id,
            })
          );
          setSavedAnswers(answerTrackings);
        }
      } catch (error) {
        notifyError(fromGenericError(error, "Error al cargar las respuestas"));
      } finally {
        setLoadingAnswers(false);
      }
    },
    [pollsData]
  );

  const checkExistingPoll = React.useCallback(async () => {
    if (!inspectionId || !pollsData) {
      return false;
    }

    // Usar los datos ya cargados por la consulta unificada
    if (pollsData.length > 0) {
      const existingPoll = pollsData[0];
      setPollId(existingPoll.id);
      setPollCreated(true);

      if (existingPoll.status === "COMPLETED") {
        setPollCompleted(true);
      }

      loadAnswers(existingPoll.id);
      return true;
    } else {
      return false;
    }
  }, [inspectionId, pollsData, loadAnswers]);

  const handleCreatePoll = React.useCallback(async () => {
    if (!headersData || pollCreated) return;

    if (!inspectionId) {
      setNotificationMessage("Error: ID de inspección no válido");
      setNotificationColor("bg-red-500");
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      return;
    }

    let inspectionId_ = inspectionId;
    try {
      // Decodifica el ID de la URL y añade el padding '=' necesario.
      let decoded = decodeURIComponent(inspectionId);
      while (decoded.length % 4 !== 0) {
        decoded += "=";
      }
      inspectionId_ = decoded;
    } catch (e) {
      notifyError(fromGenericError(e, "Error al procesar el ID de inspección"));
    }

    const questionIds = headersData.flatMap((header) =>
      header.questions.map((q) => q.id)
    );

    try {
      const result = await createPoll({
        variables: {
          questionIds,
          inspectionId: inspectionId_,
          status: "pending",
        },
      });

      if (result.data) {
        setPollId(result.data.createPoll.poll.id);
        setPollCreated(true);
        setNotificationMessage("Encuesta creada exitosamente");
        setNotificationColor("bg-green-500");
        setShowNotification(true);
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      }
    } catch (error) {
      notifyError(fromGenericError(error, "Error al crear la encuesta"));
      setNotificationMessage("Error al crear la encuesta");
      setNotificationColor("bg-red-500");
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  }, [headersData, pollCreated, inspectionId, createPoll]);

  const mapAnswerToReaction = (answerText: string): ReactionType => {
    let result: ReactionType = null;

    const normalizedText = answerText.toLowerCase();

    switch (normalizedText) {
      case "good":
        result = "Bien";
        break;
      case "bad":
        result = "Mal";
        break;
      case "regular":
        result = "Regular";
        break;
      case "not_applicable":
        result = "N/A";
        break;
      default:
        result = null;
    }

    return result;
  };

  useEffect(() => {
    const initializePoll = async () => {
      const existingPollFound = await checkExistingPoll();
      if (
        !existingPollFound &&
        headersData &&
        !unifiedLoading &&
        !unifiedError &&
        pollsData // Esperar a que se carguen los datos de polls
      ) {
        handleCreatePoll();
      }
    };

    initializePoll();
  }, [
    headersData,
    unifiedLoading,
    unifiedError,
    pollsData, // Agregar pollsData como dependencia
    checkExistingPoll,
    handleCreatePoll,
  ]);

  // Función helper para refrescar la lista de inspecciones
  const refreshInspectionsList = async () => {
    try {
      await apolloClient.refetchQueries({
        include: ["GetInspections"],
        updateCache(cache: any) {
          cache.evict?.({ fieldName: "inspections" });
          cache.gc?.();
        },
      });
    } catch (error) {
      notifyError(
        fromGenericError(error, "Error al refrescar las inspecciones")
      );
    }
  };

  const saveAnswer = async (
    questionId: string,
    reaction: ReactionType,
    observationText: string,
    photos: string[]
  ) => {
    if (!pollId) {
      return;
    }

    let answerText: string;
    switch (reaction) {
      case "Bien":
        answerText = "good";
        break;
      case "Regular":
        answerText = "regular";
        break;
      case "Mal":
        answerText = "bad";
        break;
      case "N/A":
        answerText = "not_applicable";
        break;
      default:
        answerText = "not_applicable";
    }

    try {
      const result = await createAnswer({
        variables: {
          pollId,
          questionId,
          answerText,
          observationText: observationText || "",
          photos,
        },
      });

      if (result.data?.createAnswer?.answer?.id) {
        const answerId = result.data.createAnswer.answer.id;
        setSavedAnswers((prev) => [...prev, { questionId, answerId }]);

        // Refrescar la lista de inspecciones
        await refreshInspectionsList();

        setNotificationMessage("Respuesta guardada correctamente");
        setNotificationColor("bg-green-500");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 2000);
      } else if (result.data?.createAnswer?.errors) {
        processGraphQLErrors(result.data.createAnswer.errors);
        setNotificationMessage(
          `Error al guardar la respuesta: ${result.data.createAnswer.errors}`
        );
        setNotificationColor("bg-red-500");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (error) {
      notifyError(fromGenericError(error, "Error al guardar la respuesta"));
      setNotificationMessage("Error al guardar la respuesta");
      setNotificationColor("bg-red-500");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  const getObservationForQuestion = (
    questionId: string
  ): Observation | undefined => {
    return observations.find((o) => o.questionId === questionId);
  };

  const getReactionForQuestion = (questionId: string): ReactionType => {
    const found = reactions.find((r) => r.questionId === questionId);
    return found ? found.reaction : null;
  };

  const completePoll = async () => {
    if (pollCompleted) return;

    if (!pollId || !headersData) {
      setNotificationMessage("No se ha creado o encontrado una encuesta");
      setNotificationColor("bg-red-500");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    // Validar que todas las preguntas estén respondidas
    if (!isAllQuestionsAnswered()) {
      const { totalQuestions, answeredQuestions } = getAllQuestionsStats();
      setNotificationMessage(
        `Faltan ${
          totalQuestions - answeredQuestions
        } preguntas por responder. Debes responder todas las preguntas antes de completar la encuesta.`
      );
      setNotificationColor("bg-yellow-500");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
      return;
    }

    setSavingPoll(true);

    try {
      const result = await updatePoll({
        variables: {
          id: pollId,
          status: "completed",
          inspectionId: inspectionId,
        },
      });

      if (result.data?.updatePoll?.poll?.id) {
        setPollCompleted(true);

        try {
          await apolloClient.resetStore();
        } catch (error) {
          notifyError(fromGenericError(error, "Error al limpiar el cache"));
        }

        // Disparar la generación del PDF en background. No bloqueamos la
        // navegación: el usuario verá el PDF listo la próxima vez que pulse
        // "Descargar". La notificación `REPORT_READY` se emite vía el
        // trigger SQL `tg_notify_report_ready` cuando el row de report_jobs
        // queda en `status='done'`.
        if (inspectionId) {
          void import("@/lib/data/reportGenerator").then((m) =>
            m.generateOrFetchInspectionPdf(inspectionId).catch((err) => {
              if (process.env.NODE_ENV === "development") {
                console.warn("PDF auto-gen falló:", err);
              }
            }),
          );
        }

        setNotificationMessage("Encuesta completada correctamente");
        setNotificationColor("bg-green-500");
        setShowNotification(true);

        setTimeout(() => {
          setShowNotification(false);
          router.push("/inspections");
        }, 2000);
      } else if (result.data?.updatePoll?.errors) {
        processGraphQLErrors(result.data.updatePoll.errors);
        setNotificationMessage(`Error: ${result.data.updatePoll.errors}`);
        setNotificationColor("bg-red-500");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      notifyError(fromGenericError(error, "Error al guardar la encuesta"));
      setNotificationMessage("Error al guardar la encuesta");
      setNotificationColor("bg-red-500");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    } finally {
      setSavingPoll(false);
    }
  };

  const handleGoBack = () => {
    router.push("/inspections");
  };

  const headers = headersData || [];

  const handleReaction = (
    questionId: string,
    reaction: ReactionType,
    questionText: string = "",
  ) => {
    if (pollCompleted) return;

    setReactions((prev) => {
      const existingIndex = prev.findIndex((r) => r.questionId === questionId);

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], reaction };
        return updated;
      } else {
        return [...prev, { questionId, reaction }];
      }
    });

    if (reaction !== "Mal") {
      setObservations((prev) =>
        prev.filter((o) => o.questionId !== questionId),
      );

      if (pollId && reaction) {
        saveAnswer(questionId, reaction, "", []);
      }
    } else if (reaction === "Mal") {
      setCurrentQuestion({ id: questionId, text: questionText });
      setDialogOpen(true);
    }
  };

  const handleSaveObservation = async (observation: {
    text: string;
    photos: string[];
  }) => {
    if (!currentQuestion) return;

    if (pollCompleted) {
      setDialogOpen(false);
      return;
    }

    const { text, photos } = observation;

    if (!text || text.trim() === "") {
      setNotificationMessage("La observación no puede estar vacía");
      setNotificationColor("bg-yellow-500");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
      return;
    }

    const questionId = currentQuestion.id;

    if (text && text.trim() !== "") {
      setObservations((prev) => {
        const existingIndex = prev.findIndex(
          (o) => o.questionId === questionId
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            text,
            photos,
          };
          return updated;
        } else {
          return [...prev, { questionId, text, photos }];
        }
      });
    }

    const currentReaction = getReactionForQuestion(questionId);

    if (pollId) {
      if (currentReaction !== "Mal") {
        setReactions((prev) => {
          const newReactions = prev.filter((r) => r.questionId !== questionId);
          newReactions.push({ questionId, reaction: "Mal" });
          return newReactions;
        });
      }

      // Esperar a que se complete el guardado
      await saveAnswer(questionId, "Mal", text, photos);
    }

    setDialogOpen(false);

    setNotificationMessage("Observación guardada correctamente");
    setNotificationColor("bg-green-500");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  // Funciones para el modal de imagen con zoom
  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setIsImageModalOpen(false);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev / 1.2, 1));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoomLevel((prev) => Math.min(Math.max(prev * delta, 1), 5));

    // Reset position if zooming back to 1
    if (zoomLevel <= 1 && e.deltaY > 0) {
      setImagePosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Funciones para eventos táctiles (móvil)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoomLevel > 1) {
      // Un dedo: arrastrar
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({
        x: touch.clientX - imagePosition.x,
        y: touch.clientY - imagePosition.y,
      });
    } else if (e.touches.length === 2) {
      // Dos dedos: zoom
      setIsDragging(false);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setDragStart({ x: distance, y: 0 }); // Usar x para almacenar la distancia inicial
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
      // Un dedo: arrastrar
      const touch = e.touches[0];
      setImagePosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    } else if (e.touches.length === 2) {
      // Dos dedos: zoom con pellizco
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      const initialDistance = dragStart.x;
      if (initialDistance > 0) {
        const scale = distance / initialDistance;
        const newZoom = Math.min(Math.max(zoomLevel * scale, 1), 5);
        setZoomLevel(newZoom);
        setDragStart({ x: distance, y: 0 }); // Actualizar distancia de referencia
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
    }
  };

  const handleImageLoadStart = (imageKey: string) => {
    setImageLoadingStates((prev) => ({
      ...prev,
      [imageKey]: true,
    }));
  };

  const handleImageLoad = (imageKey: string) => {
    setImageLoadingStates((prev) => ({
      ...prev,
      [imageKey]: false,
    }));
  };

  const handleImageError = (imageKey: string) => {
    setImageLoadingStates((prev) => ({
      ...prev,
      [imageKey]: false,
    }));
  };

  const toggleHeaderExpansion = (headerId: string) => {
    setExpandedHeaders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(headerId)) {
        newSet.delete(headerId);
      } else {
        newSet.add(headerId);
      }
      return newSet;
    });
  };

  const getHeaderStats = (header: Header) => {
    const totalQuestions = header.questions.length;
    const answeredQuestions = header.questions.filter((question) =>
      reactions.some((reaction) => reaction.questionId === question.id)
    ).length;

    return { totalQuestions, answeredQuestions };
  };

  const getAllQuestionsStats = () => {
    if (!headersData) return { totalQuestions: 0, answeredQuestions: 0 };

    let totalQuestions = 0;
    let answeredQuestions = 0;

    headersData.forEach((header) => {
      totalQuestions += header.questions.length;
      answeredQuestions += header.questions.filter((question) =>
        reactions.some((reaction) => reaction.questionId === question.id)
      ).length;
    });

    return { totalQuestions, answeredQuestions };
  };

  const isAllQuestionsAnswered = () => {
    const { totalQuestions, answeredQuestions } = getAllQuestionsStats();
    return totalQuestions > 0 && totalQuestions === answeredQuestions;
  };

  useEffect(() => {
    if (headersData && !hasInitializedHeaders) {
      const firstHeaderId = headersData[0]?.id;
      if (firstHeaderId) {
        setExpandedHeaders(new Set([firstHeaderId]));
        setHasInitializedHeaders(true);
      }
    }
  }, [headersData, hasInitializedHeaders]);


  if (unifiedLoading) {
    return (
      <div className="min-h-screen bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
        <main className="mx-auto flex max-w-[1320px] items-center justify-center px-6 py-24">
          <div className="inline-flex items-center gap-3 text-sm text-ink-2 dark:text-dark-ink-2">
            <Loader2 size={18} className="animate-spin" />
            Cargando preguntas de inspección…
          </div>
        </main>
      </div>
    );
  }

  if (unifiedError) {
    return (
      <div className="min-h-screen bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
        <main className="mx-auto max-w-[1320px] px-6 py-12">
          <Card
            radius={16}
            className="!border-[rgba(var(--accent-rgb),0.32)] !bg-[rgba(var(--accent-rgb),0.06)]"
          >
            <div className="flex items-center gap-2 text-sm text-primary-700">
              <AlertCircle size={16} />
              Error al cargar la información: {unifiedError?.message}
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (!inspectionId) {
    return (
      <div className="min-h-screen bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
        <main className="mx-auto flex max-w-[1320px] items-center justify-center px-6 py-24">
          <div className="text-primary-700">
            Error: ID de inspección no encontrado
          </div>
        </main>
      </div>
    );
  }

  if (!inspectionData) {
    return (
      <div className="min-h-screen bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
        <main className="mx-auto flex max-w-[1320px] items-center justify-center px-6 py-24">
          <div className="text-primary-700">
            Error: Inspección no encontrada
          </div>
        </main>
      </div>
    );
  }

  const { totalQuestions, answeredQuestions } = getAllQuestionsStats();
  const progress =
    totalQuestions > 0 ? (answeredQuestions * 100) / totalQuestions : 0;
  const reactionSummary = {
    Bien: reactions.filter((r) => r.reaction === "Bien").length,
    Regular: reactions.filter((r) => r.reaction === "Regular").length,
    Mal: reactions.filter((r) => r.reaction === "Mal").length,
    "N/A": reactions.filter((r) => r.reaction === "N/A").length,
  };

  // Header activo: si el usuario hizo click usamos eso, si no el primero con preguntas sin responder.
  const focusedHeaderId =
    activeHeaderId ||
    headers.find((h) => {
      const { totalQuestions: t, answeredQuestions: a } = getHeaderStats(h);
      return a < t;
    })?.id ||
    headers[0]?.id ||
    null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      {showNotification && (
        <div
          className={cn(
            "fixed right-4 top-4 z-[60] flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-soft",
            notificationColor,
          )}
        >
          <CheckCircle size={16} />
          <span>{notificationMessage}</span>
        </div>
      )}

      <main className="mx-auto max-w-[1320px] px-3 pb-32 pt-5 sm:px-8 sm:pb-16 sm:pt-8">
        {/* Breadcrumb */}
        <nav className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-2 dark:text-dark-ink-2">
          <button
            onClick={() => router.push("/inspections")}
            className="inline-flex items-center gap-1 hover:text-ink dark:hover:text-dark-ink"
          >
            <ChevronLeft size={13} /> Inspecciones
          </button>
          <span>·</span>
          <span className="text-ink-2 dark:text-dark-ink-2">
            {inspectionData.projectCode}
          </span>
          <span>·</span>
          <span className="font-semibold text-ink dark:text-dark-ink">
            Encuesta
          </span>
        </nav>

        {/* Header con Stepper */}
        <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
              Paso 2 de 2 · {inspectionData.inspectionType.name}
            </div>
            <h1 className="m-0 mt-1.5 text-3xl font-extrabold tracking-tighter sm:text-[34px]">
              Encuesta de inspección
            </h1>
            <p className="m-0 mt-1.5 text-sm text-ink-2 dark:text-dark-ink-2">
              {inspectionData.instalationName} ·{" "}
              {inspectionData.client.clientName}
            </p>
          </div>
          <div className="hidden sm:block">
            <Stepper items={STEPS} active={1} />
          </div>
        </header>

        {/* Progress bar */}
        <Card glow radius={16} padding={0}>
          <div className="flex flex-wrap items-center gap-4 px-5 py-3.5">
            <div className="whitespace-nowrap text-[13px] font-bold">
              Progreso · {answeredQuestions} / {totalQuestions}
            </div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[rgba(27,22,20,0.05)] dark:bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-grad-brand transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="whitespace-nowrap text-[12px] text-ink-2 dark:text-dark-ink-2">
              {pollCompleted ? "Completada" : "Auto-guardado"}
            </div>
          </div>
        </Card>

        {pollCompleted && (
          <Card
            radius={14}
            className="mt-4 !border-[rgba(47,158,106,0.28)] !bg-[rgba(47,158,106,0.10)]"
          >
            <div className="flex items-center gap-2 text-[13px] font-semibold text-ok-700">
              <CheckCircle2 size={16} />
              Esta encuesta ya ha sido completada. Los cambios están
              deshabilitados.
            </div>
          </Card>
        )}

        <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[320px_1fr]">
          {/* ─── Sidebar (debajo de las preguntas en mobile) ─── */}
          <div className="order-2 flex min-w-0 flex-col gap-3 lg:order-1">
            <Card radius={18} padding={16}>
              <div className="text-[11px] font-bold uppercase tracking-widest text-ink-2 dark:text-dark-ink-2">
                Secciones
              </div>
              <div className="mt-2.5 flex flex-col">
                {headers.map((header, i) => {
                  const { totalQuestions: t, answeredQuestions: a } =
                    getHeaderStats(header);
                  const done = t > 0 && a === t;
                  const isActive = focusedHeaderId === header.id;
                  return (
                    <button
                      key={header.id}
                      type="button"
                      onClick={() => {
                        setActiveHeaderId(header.id);
                        setExpandedHeaders((prev) => {
                          const next = new Set(prev);
                          next.add(header.id);
                          return next;
                        });
                      }}
                      className={cn(
                        "mt-1 flex items-center gap-2.5 rounded-[12px] border p-3 text-left transition-colors",
                        isActive
                          ? "border-[rgba(var(--accent-rgb),0.22)] bg-[rgba(var(--accent-rgb),0.08)]"
                          : "border-transparent hover:bg-bg-2 dark:hover:bg-white/[0.03]",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                          done
                            ? "bg-grad-ok text-white"
                            : isActive
                            ? "bg-grad-brand text-white"
                            : "bg-bg-2 text-ink-2 dark:bg-white/[0.06] dark:text-dark-ink-2",
                        )}
                      >
                        {done ? <Check size={11} /> : i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "truncate text-[12px] font-semibold",
                            isActive
                              ? "text-primary-600"
                              : "text-ink dark:text-dark-ink",
                          )}
                          title={header.headerText}
                        >
                          {header.headerText}
                        </div>
                        <div className="text-[11px] text-ink-2 dark:text-dark-ink-2">
                          {a} / {t} respondidas
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card radius={18} padding={16}>
              <div className="text-[11px] font-bold uppercase tracking-widest text-ink-2 dark:text-dark-ink-2">
                Resumen rápido
              </div>
              <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                {[
                  { l: "👍", n: reactionSummary.Bien, c: "text-ok-700" },
                  { l: "😐", n: reactionSummary.Regular, c: "text-warn-700" },
                  { l: "👎", n: reactionSummary.Mal, c: "text-primary-700" },
                  { l: "🚫", n: reactionSummary["N/A"], c: "text-ink-2" },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="rounded-[10px] bg-bg-2 p-2 text-center dark:bg-white/[0.03]"
                  >
                    <div className="text-base leading-none">{s.l}</div>
                    <div
                      className={cn(
                        "mt-1 text-[15px] font-extrabold",
                        s.c,
                      )}
                    >
                      {s.n}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* CTA Guardar / Completar — solo desktop (mobile usa la sticky bar) */}
            <Card radius={18} padding={16} className="hidden lg:block">
              <div className="flex flex-col gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={<Save size={14} />}
                  onClick={handleGoBack}
                  className="w-full justify-center"
                >
                  {pollCompleted ? "Volver" : "Guardar borrador"}
                </Button>
                {pollCompleted ? (
                  <div className="inline-flex items-center justify-center gap-1.5 rounded-full bg-grad-ok px-4 py-2 text-[13px] font-bold text-white">
                    <CheckCircle2 size={14} /> Encuesta completada
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={completePoll}
                    disabled={savingPoll || !isAllQuestionsAnswered()}
                    icon={
                      savingPoll ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )
                    }
                    className="w-full justify-center"
                    title={
                      !isAllQuestionsAnswered()
                        ? `Faltan ${totalQuestions - answeredQuestions} preguntas por responder.`
                        : "Completar la encuesta"
                    }
                  >
                    {savingPoll
                      ? "Completando…"
                      : isAllQuestionsAnswered()
                      ? "Completar"
                      : `Completar (${answeredQuestions}/${totalQuestions})`}
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* ─── Preguntas (columna principal) ─── */}
          <div className="order-1 flex min-w-0 flex-col gap-4 lg:order-2">
            {headers.map((header, headerIndex) => {
              const { totalQuestions: t, answeredQuestions: a } =
                getHeaderStats(header);
              const expanded = expandedHeaders.has(header.id);
              const done = t > 0 && a === t;
              return (
                <div
                  key={header.id}
                  id={`header-${header.id}`}
                  className="flex flex-col gap-3"
                >
                  <button
                    type="button"
                    onClick={() => toggleHeaderExpansion(header.id)}
                    className={cn(
                      "flex items-center justify-between gap-2 overflow-hidden rounded-[14px] border bg-surface px-3 py-2.5 text-left transition-colors sm:gap-3 sm:px-4 sm:py-3",
                      "border-hairline dark:border-hairline-dark dark:bg-dark-surface",
                      "hover:brightness-95",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-2 text-[11px] font-bold text-ink-2 dark:bg-white/[0.06] dark:text-dark-ink-2 sm:h-7 sm:w-7 sm:text-[12px]">
                        {headerIndex + 1}
                      </span>
                      <h2 className="m-0 truncate text-[15px] font-bold tracking-tight sm:text-[18px]">
                        {header.headerText}
                      </h2>
                      <Pill tone={done ? "ok" : a > 0 ? "brand" : "neutral"}>
                        {a}/{t}
                      </Pill>
                    </div>
                    <ChevronRight
                      size={18}
                      className={cn(
                        "shrink-0 text-ink-2 transition-transform dark:text-dark-ink-2",
                        expanded && "rotate-90",
                      )}
                    />
                  </button>

                  {expanded && (
                    <div className="flex flex-col gap-3">
                      {header.questions.map((question, qi) => {
                        const reaction = getReactionForQuestion(question.id);
                        const observation = getObservationForQuestion(
                          question.id,
                        );
                        const number =
                          headers
                            .slice(0, headerIndex)
                            .reduce(
                              (acc, h) => acc + h.questions.length,
                              0,
                            ) +
                          qi +
                          1;
                        return (
                          <QuestionCard
                            key={question.id}
                            number={number}
                            text={question.questionText}
                            reaction={reaction}
                            active={!pollCompleted && !reaction}
                            disabled={pollCompleted}
                            observation={
                              observation
                                ? {
                                    text: observation.text,
                                    photos: observation.photos,
                                  }
                                : null
                            }
                            onSelect={(r) =>
                              handleReaction(
                                question.id,
                                r,
                                question.questionText,
                              )
                            }
                            onOpenObservation={() => {
                              setCurrentQuestion({
                                id: question.id,
                                text: question.questionText,
                              });
                              setDialogOpen(true);
                            }}
                            onPhotoClick={(url) => openImageModal(url)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* CTA inferior — solo desktop (mobile usa la sticky bar) */}
            <div className="mt-2 hidden flex-wrap justify-between gap-2.5 lg:flex">
              <Button
                type="button"
                variant="ghost"
                icon={<ChevronLeft size={14} />}
                onClick={handleGoBack}
              >
                {pollCompleted ? "Volver" : "Guardar borrador"}
              </Button>
              {!pollCompleted && (
                <Button
                  type="button"
                  onClick={completePoll}
                  disabled={savingPoll || !isAllQuestionsAnswered()}
                  icon={
                    savingPoll ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )
                  }
                  title={
                    !isAllQuestionsAnswered()
                      ? `Faltan ${totalQuestions - answeredQuestions} preguntas por responder.`
                      : "Completar la encuesta"
                  }
                >
                  {savingPoll
                    ? "Completando…"
                    : isAllQuestionsAnswered()
                    ? "Completar inspección"
                    : `Completar (${answeredQuestions}/${totalQuestions})`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ─── Sticky bottom action bar (solo mobile) ─── */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 lg:hidden",
          "border-t border-hairline bg-surface/95 backdrop-blur-xl",
          "dark:border-hairline-dark dark:bg-dark-bg-2/95",
          "pb-safe",
        )}
      >
        <div className="mx-auto flex max-w-[1320px] items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={handleGoBack}
            aria-label={pollCompleted ? "Volver" : "Guardar borrador"}
            className={cn(
              "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]",
              "border border-hairline bg-bg-2 text-ink-2",
              "dark:border-hairline-dark dark:bg-white/[0.05] dark:text-dark-ink-2",
            )}
          >
            {pollCompleted ? <ChevronLeft size={18} /> : <Save size={18} />}
          </button>
          {pollCompleted ? (
            <div className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-grad-ok px-4 text-[14px] font-bold text-white">
              <CheckCircle2 size={16} /> Encuesta completada
            </div>
          ) : (
            <Button
              type="button"
              size="lg"
              onClick={completePoll}
              disabled={savingPoll || !isAllQuestionsAnswered()}
              icon={
                savingPoll ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )
              }
              className="flex-1 justify-center"
            >
              {savingPoll
                ? "Completando…"
                : isAllQuestionsAnswered()
                ? "Completar inspección"
                : `Completar (${answeredQuestions}/${totalQuestions})`}
            </Button>
          )}
        </div>
      </div>

      {dialogOpen && currentQuestion && (
        <ObservationDialog
          isOpen={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setCurrentQuestion(null);

            const existingObservation = getObservationForQuestion(
              currentQuestion.id
            );
            if (!existingObservation) {
              const currentReaction = getReactionForQuestion(
                currentQuestion.id
              );
              if (currentReaction === "Mal") {
                setReactions((prev) =>
                  prev.filter((r) => r.questionId !== currentQuestion.id)
                );
              }
            }
          }}
          onSave={handleSaveObservation}
          theme={theme}
          questionId={currentQuestion.id}
          questionText={currentQuestion.text}
          inspectionId={inspectionId ?? ""}
          initialObservation={getObservationForQuestion(currentQuestion.id)}
          pollCompleted={pollCompleted}
          isLoading={createAnswerLoading}
          // Props para funcionalidad de imagen
          onImageLoadStart={handleImageLoadStart}
          onImageLoad={handleImageLoad}
          onImageError={handleImageError}
          onImageClick={openImageModal}
          imageLoadingStates={imageLoadingStates}
        />
      )}

      {/* Modal para mostrar imagen en tamaño completo */}
      {isImageModalOpen && selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[2000] p-4"
          onClick={closeImageModal}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Botón de cerrar */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all z-20"
              aria-label="Cerrar modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Controles de zoom */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomIn();
                }}
                className="text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all"
                aria-label="Acercar"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomOut();
                }}
                className="text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all"
                aria-label="Alejar"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetZoom();
                }}
                className="text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all"
                aria-label="Ajustar a pantalla"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </button>
            </div>

            {/* Indicador de zoom */}
            <div
              className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 rounded px-3 py-1 text-sm z-20"
              onClick={(e) => e.stopPropagation()}
            >
              {Math.round(zoomLevel * 100)}%
            </div>

            {/* Contenedor de imagen con zoom */}
            <div
              className="relative max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] w-full h-full flex items-center justify-center overflow-hidden"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={(e) => e.stopPropagation()}
              style={{
                cursor:
                  zoomLevel > 1
                    ? isDragging
                      ? "grabbing"
                      : "grab"
                    : "default",
              }}
            >
              <div
                style={{
                  transform: `scale(${zoomLevel}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                  transformOrigin: "center center",
                  transition: isDragging ? "none" : "transform 0.2s ease-out",
                }}
                className="relative w-full h-full"
              >
                <Image
                  src={selectedImage}
                  alt="Imagen en tamaño completo"
                  fill
                  className="object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleResetZoom();
                  }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
