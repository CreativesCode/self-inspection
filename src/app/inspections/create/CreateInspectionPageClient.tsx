"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { IconBtn } from "@/components/ui/IconBtn";
import { Pill } from "@/components/ui/Pill";
import { SectionHead } from "@/components/ui/SectionHead";
import { Stepper } from "@/components/ui/Stepper";
import { GetUsers } from "@/graphql/auth";
import {
  CreateInspection,
  GetActivities,
  GetClients,
  GetInspectionTypes,
} from "@/graphql/inspections";
import { useCamera } from "@/hooks/useCamera";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useKeyboardFocus } from "@/hooks/useKeyboardFocus";
import { deleteMediaByUrl, uploadObservationPhoto } from "@/lib/data/storage";
import { fromGenericError, notifyError } from "@/lib/error-service";
import { cn } from "@/lib/utils";
import { useAuthStore, useRefreshStore } from "@/store";
import { useMutation, useQuery } from "@/lib/apollo-compat";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertCircle,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  RotateCw,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────
// Leaflet dinámico
// ─────────────────────────────────────────────────────────────
const LeafletIconConfig = dynamic(
  () => import("@/components/map/LeafletConfig"),
  { ssr: false },
);
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false },
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false },
);

// ─────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────
interface FormData {
  projectCode: string;
  instalationName: string;
  inspectionTypeId: string;
  gpsLatitude: number;
  gpsLongitude: number;
  clientId: string;
  activityIds: string[];
  selectedUserId: string;
  subcontrateNames: string[];
  observationText: string;
  photos: string[];
}
interface Client {
  id: string;
  clientName: string;
}
interface Activity {
  id: string;
  activityText: string;
  inspectionType: { id: string; name: string };
}
interface InspectionType {
  id: string;
  name: string;
}
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
}

const STEPS = [
  { label: "Datos", icon: FileText },
  { label: "Encuesta", icon: ClipboardList },
];

// ─────────────────────────────────────────────────────────────

export default function CreateInspectionPageClient() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const bumpRefresh = useRefreshStore((s) => s.bump);

  useKeyboardFocus({
    enabled: true,
    offset: 20,
    delay: 300,
    behavior: "smooth",
    headerSelector: "header",
  });

  const [formData, setFormData] = useState<FormData>({
    projectCode: "",
    instalationName: "",
    inspectionTypeId: "",
    gpsLatitude: 0,
    gpsLongitude: 0,
    clientId: "",
    activityIds: [],
    selectedUserId: "",
    subcontrateNames: [],
    observationText: "",
    photos: [],
  });

  const [newSubcontrateName, setNewSubcontrateName] = useState("");
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  // ID temporal usado para organizar las fotos en Storage *antes* de tener un
  // inspection_id real (la inspección aún no se ha creado en la BD). El path
  // queda como `inspections/<tempUploadId>/<uuid>.jpg`. El `observation_photos`
  // guarda la URL pública completa, así que ese id no rompe nada si después
  // queremos reorganizar.
  const [tempUploadId] = useState<string>(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  const [photoValidationError, setPhotoValidationError] = useState<
    string | null
  >(null);

  // Error inline visible en la página al intentar crear la inspección.
  // Cubre 3 fuentes: validación local, errores de negocio del backend
  // (data.createInspection.errors) y errores de red/Apollo.
  type SubmitErrorEntry = {
    title?: string;
    message: string;
    field?: string;
    code?: string;
  };
  const [submitErrors, setSubmitErrors] = useState<SubmitErrorEntry[]>([]);

  // ─── Queries (preservados) ───
  const { data: clientsData, loading: clientsLoading } = useQuery<{
    clients: { edges: Array<{ node: Client }> };
  }>(GetClients);

  const { data: inspectionTypesData, loading: inspectionTypesLoading } =
    useQuery<{
      inspectionTypes: { edges: Array<{ node: InspectionType }> };
    }>(GetInspectionTypes);

  const { data: activitiesData, loading: activitiesLoading } = useQuery<{
    activities: { edges: Array<{ node: Activity }> };
  }>(GetActivities, {
    variables: {
      first: 100,
      pageOffset: 0,
      inspectionType: formData.inspectionTypeId || undefined,
    },
    skip: !formData.inspectionTypeId,
    fetchPolicy: "network-only",
  });

  const canSelectUser =
    user &&
    (user.userType === "ADMINISTRADOR" ||
      user.userType === "JEFE_DE_OBRA" ||
      user.userType === "TECNICO");

  const { data: usersData, loading: usersLoading } = useQuery<{
    users: { edges: Array<{ node: User }> };
  }>(GetUsers, { skip: !canSelectUser });

  const {
    loading: locationLoading,
    error: locationError,
    latitude,
    longitude,
    requestLocation,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
  });

  // ─── Cámara hook (preservado) ───
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

  // ─── Mutación CreateInspection ───
  const [createInspection, { loading }] = useMutation(CreateInspection, {
    onCompleted: async (data) => {
      // Si el backend devuelve errores de validación los mostramos al usuario
      // INLINE en la página + toast para visibilidad inmediata.
      const backendErrors = data?.createInspection?.errors;
      if (backendErrors && backendErrors.length) {
        // El backend devuelve AppError objects con shape:
        // { code, userMessage, developerMessage, detail, path, incidentId, timestamp }
        const entries: SubmitErrorEntry[] = backendErrors.map(
          (e: {
            userMessage?: string;
            developerMessage?: string;
            code?: string;
            path?: string;
            detail?: string;
          }) => ({
            title: "Error del servidor",
            message:
              e.userMessage ||
              e.developerMessage ||
              e.detail ||
              e.code ||
              "Error desconocido",
            field: e.path,
            code: e.code,
          }),
        );
        setSubmitErrors(entries);
        notifyError(
          fromGenericError(
            new Error(entries.map((x) => x.message).join(" · ")),
            "No se pudo crear la inspección",
          ),
        );
        // Scroll al panel de error para que sea visible al usuario.
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }
      const newId = data?.createInspection?.inspection?.id;
      if (newId) {
        setSubmitErrors([]);
        bumpRefresh();
        router.push(`/inspections/questions?id=${newId}`);
      } else {
        // Caso muy raro: no errors y no id. Avisamos para no quedarnos en silencio.
        setSubmitErrors([
          {
            title: "Respuesta inesperada",
            message:
              "El servidor respondió sin errores pero no devolvió el ID de la inspección. Inténtalo de nuevo.",
          },
        ]);
        notifyError(
          fromGenericError(
            new Error("La respuesta no incluye el ID de la inspección"),
            "Respuesta inesperada del servidor",
          ),
        );
      }
    },
    onError: (apolloError) => {
      // Network/GraphQL errors (no llegó al resolver o falló transport).
      const gqlMessages = (apolloError.graphQLErrors || []).map((g: any) => ({
        title: "Error GraphQL",
        message: g.message,
        code: (g.extensions?.code as string) || undefined,
        field: Array.isArray(g.path) ? g.path.join(".") : undefined,
      }));
      const netMessage = apolloError.networkError
        ? [
            {
              title: "Error de red",
              message:
                (apolloError.networkError as Error).message ||
                "No se pudo conectar con el servidor.",
            },
          ]
        : [];
      const entries =
        gqlMessages.length || netMessage.length
          ? [...gqlMessages, ...netMessage]
          : [{ title: "Error", message: apolloError.message }];
      setSubmitErrors(entries);
      notifyError(
        fromGenericError(apolloError, "Error al crear la inspección"),
      );
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
  });

  // ─── Effects ───
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      setFormData((p) => ({
        ...p,
        gpsLatitude: latitude,
        gpsLongitude: longitude,
      }));
    }
  }, [latitude, longitude]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (formData.inspectionTypeId) {
      setFormData((p) => ({ ...p, activityIds: [] }));
    }
  }, [formData.inspectionTypeId]);

  // ─── Handlers ───
  const capturePhoto = async () => {
    try {
      setIsUploadingPhoto(true);
      const blob = await capturePhotoBlob();
      if (!blob) {
        stopCamera();
        return;
      }
      const url = await uploadObservationPhoto(blob, tempUploadId);
      setPhotoPreviews((p) => [...p, url]);
      setFormData((p) => ({ ...p, photos: [...p.photos, url] }));
      stopCamera();
    } catch (err) {
      notifyError(fromGenericError(err, "Error al subir la foto"));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAddSubcontrateName = () => {
    if (newSubcontrateName.trim()) {
      setFormData((p) => ({
        ...p,
        subcontrateNames: [
          ...(p.subcontrateNames || []),
          newSubcontrateName.trim(),
        ],
      }));
      setNewSubcontrateName("");
    }
  };

  const handleRemoveSubcontrateName = (index: number) => {
    setFormData((p) => ({
      ...p,
      subcontrateNames: p.subcontrateNames?.filter((_, i) => i !== index) || [],
    }));
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
          validFiles.map((f) => uploadObservationPhoto(f, tempUploadId)),
        );
        setPhotoPreviews((p) => [...p, ...uploaded]);
        setFormData((p) => ({ ...p, photos: [...p.photos, ...uploaded] }));
      } catch (err) {
        notifyError(fromGenericError(err, "Error al subir las fotos"));
      } finally {
        setIsUploadingPhoto(false);
        e.target.value = "";
      }
    }
  };

  const removePhoto = (index: number) => {
    const url = formData.photos[index];
    setPhotoPreviews((p) => p.filter((_, i) => i !== index));
    setFormData((p) => ({
      ...p,
      photos: p.photos.filter((_, i) => i !== index),
    }));
    if (url) void deleteMediaByUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Log defensivo: si esto NO aparece en DevTools al hacer clic, el botón
    // no está disparando el submit del form (problema de markup, no de API).
    console.log("[CreateInspection] submit", {
      projectCode: formData.projectCode,
      instalationName: formData.instalationName,
      inspectionTypeId: formData.inspectionTypeId,
      clientId: formData.clientId,
      activitiesSelected: formData.activityIds.length,
      hasGps:
        formData.gpsLatitude !== 0 && formData.gpsLongitude !== 0,
    });

    // Reset del panel inline antes de intentar nuevo envío.
    setSubmitErrors([]);

    // Validaciones locales: acumulamos todas para mostrarlas juntas.
    const localErrors: SubmitErrorEntry[] = [];
    if (!formData.projectCode.trim()) {
      localErrors.push({
        title: "Falta código de proyecto",
        message: "Introduce el código del proyecto.",
        field: "projectCode",
      });
    }
    if (!formData.instalationName.trim()) {
      localErrors.push({
        title: "Falta instalación",
        message: "Introduce el nombre de la instalación.",
        field: "instalationName",
      });
    }
    if (!formData.clientId) {
      localErrors.push({
        title: "Falta cliente",
        message: "Selecciona un cliente.",
        field: "clientId",
      });
    }
    if (!formData.inspectionTypeId) {
      localErrors.push({
        title: "Falta tipo de inspección",
        message: "Selecciona un tipo de inspección.",
        field: "inspectionTypeId",
      });
    }
    if (formData.gpsLatitude === 0 || formData.gpsLongitude === 0) {
      localErrors.push({
        title: "Falta ubicación",
        message:
          "Es necesario obtener la ubicación GPS antes de crear la inspección.",
        field: "gps",
      });
    }
    if (formData.activityIds.length === 0) {
      localErrors.push({
        title: "Falta actividad",
        message: "Selecciona al menos una actividad para la inspección.",
        field: "activityIds",
      });
    }
    if (localErrors.length > 0) {
      setSubmitErrors(localErrors);
      // Aviso ligero por toast con resumen.
      notifyError(
        fromGenericError(
          new Error(localErrors.map((x) => x.message).join(" · ")),
          "Revisa los campos marcados",
        ),
      );
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    try {
      const inspectionUserId =
        canSelectUser && formData.selectedUserId
          ? formData.selectedUserId
          : user?.id;

      await createInspection({
        variables: {
          projectCode: formData.projectCode,
          instalationName: formData.instalationName,
          inspectionTypeId: formData.inspectionTypeId,
          dateTime: new Date().toISOString(),
          gpsLatitude: formData.gpsLatitude,
          gpsLongitude: formData.gpsLongitude,
          userId: inspectionUserId,
          clientId: formData.clientId,
          activityIds: formData.activityIds,
          subcontrateNames: formData.subcontrateNames,
          observationText: formData.observationText,
          photos: formData.photos,
        },
      });
    } catch (err) {
      // Apollo ya invoca onError; este catch es defensivo si la mutación
      // se rechaza de una forma que no pase por onError.
      setSubmitErrors([
        {
          title: "Error inesperado",
          message:
            err instanceof Error ? err.message : "Error desconocido al enviar.",
        },
      ]);
      notifyError(fromGenericError(err, "Error al crear la inspección"));
    }
  };

  // ─── Cliente, tipo y actividades seleccionados (para el resumen) ───
  const selectedType = inspectionTypesData?.inspectionTypes?.edges?.find(
    (e) => e.node.id === formData.inspectionTypeId,
  )?.node;
  const selectedClient = clientsData?.clients?.edges?.find(
    (e) => e.node.id === formData.clientId,
  )?.node;
  const totalActivities =
    activitiesData?.activities?.edges?.length || 0;
  const totalOperarios = formData.subcontrateNames.length;

  const canSubmit =
    formData.gpsLatitude !== 0 &&
    formData.gpsLongitude !== 0 &&
    formData.activityIds.length > 0 &&
    formData.projectCode &&
    formData.instalationName &&
    formData.inspectionTypeId &&
    formData.clientId &&
    !loading &&
    !locationLoading;

  return (
    <div className="min-h-screen overflow-x-hidden bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      <main className="mx-auto max-w-[1200px] px-3 pb-32 pt-5 sm:px-8 sm:pt-7 lg:pb-16">
        {/* ─── Breadcrumb ─── */}
        <nav className="mb-4 flex items-center gap-2 text-sm text-ink-2 dark:text-dark-ink-2">
          <button
            onClick={() => router.push("/inspections")}
            className="inline-flex items-center gap-1 hover:text-ink dark:hover:text-dark-ink"
          >
            <ChevronLeft size={13} /> Inspecciones
          </button>
          <span>·</span>
          <span className="font-semibold text-ink dark:text-dark-ink">
            Nueva inspección
          </span>
        </nav>

        {/* ─── Header con Stepper ─── */}
        <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
              Paso 1 de 2
            </div>
            <h1 className="m-0 mt-1.5 text-3xl font-extrabold tracking-tighter sm:text-[38px]">
              Nueva inspección
            </h1>
            <p className="m-0 mt-1.5 text-sm text-ink-2 dark:text-dark-ink-2">
              Completa los datos básicos. Las preguntas se generan según el tipo
              elegido.
            </p>
          </div>
          <div className="hidden sm:block">
            <Stepper items={STEPS} active={0} />
          </div>
        </header>

        {/* Panel inline de errores (validación local, backend y red) */}
        {submitErrors.length > 0 && (
          <Card
            radius={16}
            className="mb-5 !border-[rgba(var(--accent-rgb),0.32)] !bg-[rgba(var(--accent-rgb),0.06)]"
          >
            <div className="flex items-start gap-3">
              <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--accent-rgb),0.14)] text-primary-700">
                <AlertCircle size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="m-0 text-sm font-bold text-primary-700">
                    No se pudo crear la inspección
                    {submitErrors.length > 1 && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-[rgba(var(--accent-rgb),0.14)] px-2 py-0.5 text-[11px] font-semibold text-primary-700">
                        {submitErrors.length} {submitErrors.length === 1 ? "error" : "errores"}
                      </span>
                    )}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSubmitErrors([])}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-primary-700 hover:bg-[rgba(var(--accent-rgb),0.10)]"
                    title="Cerrar"
                  >
                    <X size={14} />
                  </button>
                </div>
                <ul className="mt-2 list-none space-y-1.5 pl-0">
                  {submitErrors.map((err, i) => (
                    <li
                      key={`${err.field || err.code || "err"}-${i}`}
                      className="flex items-start gap-2 text-[13px] text-primary-700"
                    >
                      <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary-700" />
                      <span className="break-words">
                        {err.title && (
                          <strong className="font-semibold">
                            {err.title}
                            {err.field ? ` (${err.field})` : ""}:
                          </strong>
                        )}{" "}
                        {err.message}
                        {err.code && (
                          <span className="ml-1 rounded bg-[rgba(var(--accent-rgb),0.10)] px-1.5 py-0.5 font-mono text-[10px]">
                            {err.code}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        <form
          onSubmit={handleSubmit}
          className="form-container mobile-scroll-container grid min-w-0 gap-5 lg:grid-cols-[1.6fr_1fr]"
        >
          {/* ─── Columna izquierda ─── */}
          <div className="flex min-w-0 flex-col gap-5">
            {/* Identificación del proyecto */}
            <Card radius={20}>
              <SectionHead
                title="Identificación del proyecto"
                subtitle="Datos de la obra y la instalación"
                icon={<Building2 size={16} />}
              />
              <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field
                  label="Código del proyecto"
                  value={formData.projectCode}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, projectCode: e.target.value }))
                  }
                  icon={<FileText size={16} />}
                  placeholder="ESP-24-..."
                  required
                />
                <Field
                  label="Nombre de la instalación"
                  value={formData.instalationName}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      instalationName: e.target.value,
                    }))
                  }
                  icon={<Building2 size={16} />}
                  placeholder="SE Castellón Sur"
                  required
                />

                {/* Cliente */}
                <SelectField
                  label="Cliente"
                  icon={<Building2 size={16} />}
                  value={formData.clientId}
                  loading={clientsLoading}
                  required
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, clientId: e.target.value }))
                  }
                >
                  <option value="">Seleccionar cliente…</option>
                  {clientsData?.clients?.edges?.map((edge) => (
                    <option key={edge.node.id} value={edge.node.id}>
                      {edge.node.clientName}
                    </option>
                  ))}
                </SelectField>

                {/* Tipo de inspección */}
                <SelectField
                  label="Tipo de inspección"
                  icon={<ShieldCheck size={16} />}
                  value={formData.inspectionTypeId}
                  loading={inspectionTypesLoading}
                  required
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      inspectionTypeId: e.target.value,
                    }))
                  }
                >
                  <option value="">Seleccionar tipo…</option>
                  {inspectionTypesData?.inspectionTypes?.edges?.map((edge) => (
                    <option key={edge.node.id} value={edge.node.id}>
                      {edge.node.name}
                    </option>
                  ))}
                </SelectField>

                {/* Inspector asignado (si canSelectUser) */}
                {canSelectUser && (
                  <SelectField
                    label="Usuario asignado"
                    icon={<Users size={16} />}
                    value={formData.selectedUserId}
                    loading={usersLoading}
                    hint="Si no seleccionas usuario, te asignamos a ti."
                    className="sm:col-span-2"
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        selectedUserId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Asignármela a mí</option>
                    {usersData?.users?.edges?.map((edge) => (
                      <option key={edge.node.id} value={edge.node.id}>
                        {edge.node.firstName} {edge.node.lastName} (
                        {edge.node.email})
                      </option>
                    ))}
                  </SelectField>
                )}
              </div>
            </Card>

            {/* Actividades */}
            <Card radius={20}>
              <SectionHead
                title="Actividades"
                subtitle={
                  formData.inspectionTypeId
                    ? `${activitiesData?.activities?.edges?.length || 0} disponibles · ${formData.activityIds.length} seleccionadas`
                    : "Selecciona primero un tipo de inspección"
                }
                icon={<Check size={16} />}
              />
              <div className="mt-4">
                {!formData.inspectionTypeId ? (
                  <p className="m-0 rounded-[14px] border border-dashed border-hairline bg-bg-2 p-5 text-center text-sm text-ink-2 dark:border-hairline-dark dark:bg-white/[0.03] dark:text-dark-ink-2">
                    Selecciona un tipo de inspección para ver sus actividades.
                  </p>
                ) : activitiesLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-2 dark:text-dark-ink-2">
                    <Loader2 size={16} className="animate-spin" />
                    Cargando actividades…
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {activitiesData?.activities?.edges?.map((edge) => {
                      const sel = formData.activityIds.includes(edge.node.id);
                      return (
                        <button
                          key={edge.node.id}
                          type="button"
                          onClick={() => {
                            setFormData((p) => ({
                              ...p,
                              activityIds: sel
                                ? p.activityIds.filter(
                                    (id) => id !== edge.node.id,
                                  )
                                : [...p.activityIds, edge.node.id],
                            }));
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium",
                            "transition-colors",
                            sel
                              ? "bg-grad-brand border-0 text-white"
                              : "border border-hairline bg-bg-2 text-ink-2 hover:brightness-95 " +
                                  "dark:border-hairline-dark dark:bg-white/[0.03] dark:text-dark-ink-2",
                          )}
                        >
                          {sel && <Check size={12} />}
                          {edge.node.activityText}
                        </button>
                      );
                    })}
                    {activitiesData?.activities?.edges?.length === 0 && (
                      <p className="m-0 text-sm text-ink-2 dark:text-dark-ink-2">
                        Este tipo de inspección no tiene actividades configuradas.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Subcontratas */}
            <Card radius={20}>
              <SectionHead
                title="Subcontratas presentes"
                subtitle={
                  formData.subcontrateNames.length > 0
                    ? `${formData.subcontrateNames.length} ${formData.subcontrateNames.length === 1 ? "empresa" : "empresas"}`
                    : "Opcional"
                }
                icon={<Users size={16} />}
              />
              <div className="mt-4 grid gap-2.5">
                {formData.subcontrateNames.map((name, index) => (
                  <div
                    key={`${name}-${index}`}
                    className="flex min-w-0 items-center gap-3 rounded-[14px] border border-hairline bg-bg-2 p-3 dark:border-hairline-dark dark:bg-white/[0.03]"
                  >
                    <Avatar
                      name={name
                        .split(" ")
                        .map((w) => w.charAt(0))
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                      size={32}
                    />
                    <div className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</div>
                    <IconBtn
                      tone="bad"
                      type="button"
                      onClick={() => handleRemoveSubcontrateName(index)}
                      title="Quitar"
                    >
                      <X size={14} />
                    </IconBtn>
                  </div>
                ))}
                <div className="flex gap-2.5">
                  <div className="flex-1">
                    <Field
                      value={newSubcontrateName}
                      onChange={(e) => setNewSubcontrateName(e.target.value)}
                      placeholder="Nombre de la subcontrata"
                      icon={<Users size={16} />}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSubcontrateName();
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddSubcontrateName}
                    icon={<Plus size={14} />}
                    className="self-end"
                  >
                    Añadir
                  </Button>
                </div>
              </div>
            </Card>

            {/* Observación inicial */}
            <Card radius={20}>
              <SectionHead
                title="Observación inicial"
                subtitle="Notas y evidencias (opcional)"
                icon={<FileText size={16} />}
              />
              <textarea
                value={formData.observationText}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    observationText: e.target.value,
                  }))
                }
                rows={4}
                placeholder="Describe el contexto de la inspección, accesos, permisos firmados…"
                className={cn(
                  "mt-3.5 min-h-[96px] w-full resize-y rounded-[12px] px-3.5 py-3 text-sm outline-none",
                  "border border-hairline bg-bg-2 text-ink",
                  "dark:border-hairline-dark dark:bg-white/[0.03] dark:text-dark-ink",
                )}
              />

              {/* Errores de fotos */}
              {photoValidationError && (
                <div className="mt-3 flex items-start gap-2 rounded-[12px] border border-[rgba(var(--accent-rgb),0.20)] bg-[rgba(var(--accent-rgb),0.06)] p-3 text-[13px] text-primary-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{photoValidationError}</span>
                </div>
              )}
              {cameraError && (
                <div className="mt-3 flex items-start gap-2 rounded-[12px] border border-[rgba(var(--accent-rgb),0.20)] bg-[rgba(var(--accent-rgb),0.06)] p-3 text-[13px] text-primary-700">
                  <Camera size={14} className="mt-0.5 shrink-0" />
                  <span>Error de cámara: {cameraError}</span>
                </div>
              )}

              {/* Botones foto */}
              <div className="mt-3.5 flex flex-wrap gap-2.5">
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
                  htmlFor="photos-upload"
                  className={cn(
                    "cursor-pointer",
                    isUploadingPhoto && "pointer-events-none opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium",
                      "border border-hairline bg-[rgba(27,22,20,0.03)] text-ink-2 hover:brightness-95",
                      "dark:border-hairline-dark dark:bg-white/[0.04] dark:text-dark-ink-2",
                    )}
                  >
                    {isUploadingPhoto ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Upload size={13} />
                    )}{" "}
                    {isUploadingPhoto ? "Subiendo…" : "Subir fotos"}
                  </span>
                </label>
                <input
                  id="photos-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
                {photoPreviews.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={13} />}
                    onClick={() => {
                      const toDelete = formData.photos.slice();
                      setPhotoPreviews([]);
                      setFormData((p) => ({ ...p, photos: [] }));
                      setPhotoValidationError(null);
                      toDelete.forEach((u) => void deleteMediaByUrl(u));
                    }}
                    className="!text-primary-600"
                  >
                    Limpiar todas
                  </Button>
                )}
              </div>
              <p className="m-0 mt-1.5 text-[11px] text-ink-3 dark:text-dark-ink-2">
                Tamaño máximo por imagen: 10 MB
              </p>

              {/* Vista previa de fotos */}
              {photoPreviews.length > 0 && (
                <div className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {photoPreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative aspect-[4/3] overflow-hidden rounded-[14px] border border-hairline dark:border-hairline-dark"
                    >
                      <Image
                        src={preview}
                        alt={`Foto ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/75"
                        title="Quitar foto"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* El canvas vive dentro del modal de cámara para evitar dos
                  refs compartidas (ver fix previo en QuestionsPageClient). */}
            </Card>

            {/* CTA bottom (solo desktop — mobile usa la sticky bar) */}
            <div className="hidden flex-wrap justify-between gap-2.5 lg:flex">
              <Button
                type="button"
                variant="ghost"
                icon={<ChevronLeft size={14} />}
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                icon={
                  loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : undefined
                }
              >
                {loading ? "Creando…" : "Continuar a encuesta"}
              </Button>
            </div>
          </div>

          {/* ─── Sidebar derecho ─── */}
          <div className="flex min-w-0 flex-col gap-5">
            {/* Resumen */}
            <Card glow radius={20} className="overflow-hidden">
              <div className="text-[11px] font-bold uppercase tracking-widest text-primary-500">
                Resumen
              </div>
              <div className="mt-1.5 break-words text-2xl font-extrabold tracking-tight">
                {formData.instalationName || "Sin instalación"}
              </div>
              <div className="break-words text-[13px] text-ink-2 dark:text-dark-ink-2">
                {formData.projectCode || "Sin código"}
                {selectedClient && ` · ${selectedClient.clientName}`}
              </div>

              <div className="my-4 h-px bg-hairline dark:bg-hairline-dark" />

              <SummaryRow label="Tipo" value={selectedType?.name || "—"} />
              <SummaryRow
                label="Actividades"
                value={
                  formData.activityIds.length > 0
                    ? `${formData.activityIds.length} de ${totalActivities}`
                    : "—"
                }
              />
              <SummaryRow
                label="Subcontratas"
                value={
                  totalOperarios > 0
                    ? `${totalOperarios} ${totalOperarios === 1 ? "empresa" : "empresas"}`
                    : "Ninguna"
                }
              />
              <SummaryRow
                label="Fotos"
                value={
                  photoPreviews.length > 0
                    ? `${photoPreviews.length} adjuntas`
                    : "—"
                }
                last
              />
            </Card>

            {/* Ubicación GPS */}
            <Card radius={20} padding={0} className="overflow-hidden">
              <div className="px-5 pb-3.5 pt-5">
                <SectionHead
                  title="Ubicación GPS"
                  subtitle={
                    formData.gpsLatitude !== 0
                      ? "Detectada automáticamente"
                      : locationLoading
                      ? "Detectando…"
                      : "Pendiente"
                  }
                  icon={<MapPin size={16} />}
                />
              </div>

              {/* Estado GPS */}
              <div className="px-5">
                <GpsStatus
                  loading={locationLoading}
                  error={locationError}
                  hasCoords={
                    formData.gpsLatitude !== 0 && formData.gpsLongitude !== 0
                  }
                  onRetry={requestLocation}
                />
              </div>

              {/* Mapa */}
              {formData.gpsLatitude !== 0 && formData.gpsLongitude !== 0 && (
                <div className="mt-4 h-[200px] w-full overflow-hidden">
                  <MapContainer
                    key={`${formData.gpsLatitude}-${formData.gpsLongitude}`}
                    center={
                      [
                        formData.gpsLatitude,
                        formData.gpsLongitude,
                      ] as LatLngExpression
                    }
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={false}
                  >
                    <LeafletIconConfig />
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker
                      position={
                        [
                          formData.gpsLatitude,
                          formData.gpsLongitude,
                        ] as LatLngExpression
                      }
                    >
                      <Popup>
                        {formData.instalationName || "Ubicación"}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}

              {/* Footer coords */}
              {formData.gpsLatitude !== 0 && formData.gpsLongitude !== 0 && (
                <div className="flex items-center justify-between border-t border-hairline px-5 py-3.5 dark:border-hairline-dark">
                  <span className="font-mono text-xs text-ink-2 dark:text-dark-ink-2">
                    {formData.gpsLatitude.toFixed(4)},{" "}
                    {formData.gpsLongitude.toFixed(4)}
                  </span>
                  <button
                    type="button"
                    onClick={requestLocation}
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary-500 hover:text-primary-600"
                  >
                    <RefreshCw size={12} /> Actualizar
                  </button>
                </div>
              )}
            </Card>

            {/* Aviso "draft" */}
            <Card radius={20}>
              <div className="flex items-center gap-3">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[rgba(232,163,61,0.14)] text-warn-700">
                  <Clock size={16} />
                </div>
                <div>
                  <div className="text-[13px] font-bold">
                    Borrador en memoria
                  </div>
                  <div className="text-[11px] text-ink-2 dark:text-dark-ink-2">
                    Se enviará al pulsar &ldquo;Continuar a encuesta&rdquo;.
                  </div>
                </div>
              </div>
            </Card>
          </div>

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
                onClick={() => router.back()}
                aria-label="Cancelar"
                className={cn(
                  "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]",
                  "border border-hairline bg-bg-2 text-ink-2",
                  "dark:border-hairline-dark dark:bg-white/[0.05] dark:text-dark-ink-2",
                )}
              >
                <ChevronLeft size={18} />
              </button>
              <Button
                type="submit"
                size="lg"
                disabled={!canSubmit}
                icon={
                  loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : undefined
                }
                className="flex-1 justify-center"
              >
                {loading ? "Creando…" : "Continuar a encuesta"}
              </Button>
            </div>
          </div>
        </form>
      </main>

      {/* ─── Modal cámara ─── */}
      {isCameraOpen && (
        <div
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-bg-2 text-ink-2 hover:brightness-95 dark:bg-white/[0.06] dark:text-dark-ink-2"
              >
                <X size={18} />
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
              {/* Canvas oculto: capturePhotoBlob lo necesita para renderizar
                  el frame del video. Vive aquí (no en el formulario) para
                  no compartir la ref con otro canvas, ver bug previo. */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex flex-col items-center gap-3 px-5 py-4">
              <Pill>
                Cámara{" "}
                {currentFacingMode === "environment" ? "trasera" : "frontal"}
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
                  {isUploadingPhoto ? "Subiendo…" : "Capturar foto"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => switchCamera()}
                  disabled={!videoReady}
                  icon={<RotateCw size={14} />}
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
}

// ─────────────────────────────────────────────────────────────
// Helpers locales
// ─────────────────────────────────────────────────────────────

/**
 * SelectField — Select estilizado con la misma "caja" que `<Field>`,
 * usado aquí mismo para los pickers de cliente/tipo/usuario.
 */
function SelectField({
  label,
  icon,
  loading,
  required,
  hint,
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  icon?: React.ReactNode;
  loading?: boolean;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <label className="text-xs font-semibold tracking-tight text-ink-2 dark:text-dark-ink-2">
        {label} {required && <span className="text-primary-500">*</span>}
      </label>
      <div
        className={cn(
          "mt-1.5 flex items-center gap-2.5 overflow-hidden rounded-[12px] border px-3.5 py-3",
          "border-hairline bg-bg-2 dark:border-hairline-dark dark:bg-white/[0.03]",
        )}
      >
        {icon && (
          <span className="inline-flex shrink-0 text-ink-2 dark:text-dark-ink-2">
            {icon}
          </span>
        )}
        <select
          {...rest}
          className="w-full min-w-0 flex-1 cursor-pointer appearance-none truncate bg-transparent text-sm text-ink outline-none disabled:cursor-not-allowed dark:text-dark-ink"
          disabled={loading || rest.disabled}
        >
          {children}
        </select>
        <ChevronDown
          size={14}
          className="shrink-0 text-ink-2 dark:text-dark-ink-2"
        />
      </div>
      {(loading || hint) && (
        <p className="mt-1 text-[11px] text-ink-3 dark:text-dark-ink-2">
          {loading ? "Cargando…" : hint}
        </p>
      )}
    </div>
  );
}

/**
 * SummaryRow — fila label/value del resumen.
 */
function SummaryRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 py-2.5 text-[13px]",
        !last &&
          "border-b border-dashed border-hairline dark:border-hairline-dark",
      )}
    >
      <span className="shrink-0 text-ink-2 dark:text-dark-ink-2">{label}</span>
      <span className="min-w-0 truncate text-right font-semibold">{value}</span>
    </div>
  );
}

/**
 * GpsStatus — bloque visual del estado del GPS.
 */
function GpsStatus({
  loading,
  error,
  hasCoords,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  hasCoords: boolean;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2.5 rounded-[12px] border border-hairline bg-bg-2 p-3.5 text-sm text-ink-2 dark:border-hairline-dark dark:bg-white/[0.03] dark:text-dark-ink-2">
        <Loader2 size={14} className="animate-spin" />
        Obteniendo ubicación GPS…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-[12px] border border-[rgba(var(--accent-rgb),0.20)] bg-[rgba(var(--accent-rgb),0.06)] p-3.5 text-[13px] text-primary-700">
        <div className="mb-2 flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={13} />}
          onClick={onRetry}
        >
          Reintentar
        </Button>
      </div>
    );
  }
  if (!hasCoords) {
    return (
      <div className="rounded-[12px] border border-[rgba(232,163,61,0.32)] bg-[rgba(232,163,61,0.10)] p-3.5 text-[13px] text-warn-700">
        <div className="mb-2 flex items-start gap-2">
          <MapPin size={14} className="mt-0.5 shrink-0" />
          <span>Ubicación GPS requerida para crear la inspección.</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<MapPin size={13} />}
          onClick={onRetry}
        >
          Obtener ubicación
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5 rounded-[12px] border border-[rgba(47,158,106,0.28)] bg-[rgba(47,158,106,0.10)] p-3.5 text-sm text-ok-700">
      <CheckCircle2 size={14} className="shrink-0" />
      Ubicación GPS obtenida.
    </div>
  );
}
