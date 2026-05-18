"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { IconBtn } from "@/components/ui/IconBtn";
import { Pill } from "@/components/ui/Pill";
import { SectionHead } from "@/components/ui/SectionHead";
import {
  GetActivities,
  GetClients,
  GetInspection,
  GetInspectionTypes,
  UpdateInspection,
} from "@/graphql/inspections";
import { useCamera } from "@/hooks/useCamera";
import { useKeyboardFocus } from "@/hooks/useKeyboardFocus";
import { deleteMediaByUrl, uploadObservationPhoto } from "@/lib/data/storage";
import {
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { cn, getFullImageUrl } from "@/lib/utils";
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
  FileText,
  Loader2,
  MapPin,
  Plus,
  RotateCw,
  Save,
  ShieldCheck,
  Upload,
  Users,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import NextImage from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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

interface Photo {
  photo: string;
}

interface FormData {
  projectCode: string;
  instalationName: string;
  inspectionTypeId: string;
  gpsLatitude: number;
  gpsLongitude: number;
  clientId: string;
  activityIds: string[];
  subcontrateNames: string[];
  observationText: string;
  photos: string[];
}

interface Client {
  id: string;
  clientName: string;
}
interface ClientEdge {
  node: Client;
}
interface Activity {
  id: string;
  activityText: string;
  inspectionType: { id: string; name: string };
}
interface ActivityEdge {
  node: Activity;
}
interface InspectionType {
  id: string;
  name: string;
}
interface InspectionTypeEdge {
  node: InspectionType;
}
interface SubcontrateEdge {
  node: { id: string; subcontrateName: string };
}

const EMPTY_FORM: FormData = {
  projectCode: "",
  instalationName: "",
  inspectionTypeId: "",
  gpsLatitude: 0,
  gpsLongitude: 0,
  clientId: "",
  activityIds: [],
  subcontrateNames: [],
  observationText: "",
  photos: [],
};

const same = (a: unknown, b: unknown) => {
  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  }
  return a === b;
};

export default function EditInspectionPageClient() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const bumpRefresh = useRefreshStore((s) => s.bump);
  const searchParams = useSearchParams();

  useKeyboardFocus({
    enabled: true,
    offset: 20,
    delay: 300,
    behavior: "smooth",
    headerSelector: "header",
  });

  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  // Snapshot del estado cargado desde el backend para detectar cambios.
  const initialDataRef = useRef<FormData | null>(null);

  const [newSubcontrateName, setNewSubcontrateName] = useState("");
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoValidationError, setPhotoValidationError] = useState<
    string | null
  >(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  // URLs subidas en esta sesión: las podemos borrar del bucket inmediatamente
  // al quitarlas (no había referencia previa en BD).
  const sessionUploadsRef = useRef<Set<string>>(new Set());
  // URLs que el usuario quitó del formulario pero que SÍ existen en BD: se
  // borran del bucket solo cuando el `updateInspection` se complete con éxito.
  const pendingDeleteRef = useRef<Set<string>>(new Set());

  type SubmitErrorEntry = {
    title?: string;
    message: string;
    field?: string;
    code?: string;
  };
  const [submitErrors, setSubmitErrors] = useState<SubmitErrorEntry[]>([]);

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

  const id = searchParams.get("id");
  const inspectionId = id || "";

  let inspectionId_ = inspectionId;
  try {
    let decoded = decodeURIComponent(inspectionId);
    while (decoded.length % 4 !== 0) {
      decoded += "=";
    }
    inspectionId_ = decoded;
  } catch (e) {
    notifyError(fromGenericError(e, "Error al procesar el ID de inspección"));
  }

  const { data: inspectionData, loading: inspectionLoading } = useQuery(
    GetInspection,
    { variables: { id: inspectionId_ }, skip: !inspectionId },
  );

  // Una inspección con encuesta completada ya no es editable: redirigir a
  // detalles para que el usuario solo pueda ver/descargar el PDF.
  useEffect(() => {
    const insp = inspectionData?.inspection;
    if (!insp) return;
    const isCompleted = (insp.polls?.edges ?? []).some(
      (e: { node: { status: string } }) => e.node.status === "COMPLETED",
    );
    if (isCompleted) {
      router.replace(`/inspections/details?id=${insp.id}`);
    }
  }, [inspectionData, router]);

  const { data: clientsData, loading: clientsLoading } = useQuery<{
    clients: { edges: ClientEdge[] };
  }>(GetClients);

  const { data: inspectionTypesData, loading: inspectionTypesLoading } =
    useQuery<{ inspectionTypes: { edges: InspectionTypeEdge[] } }>(
      GetInspectionTypes,
    );

  const { data: activitiesData, loading: activitiesLoading } = useQuery<{
    activities: { edges: ActivityEdge[] };
  }>(GetActivities, {
    variables: {
      first: 100,
      pageOffset: 0,
      inspectionType: formData.inspectionTypeId || undefined,
    },
    skip: !formData.inspectionTypeId,
    fetchPolicy: "network-only",
  });

  // Carga inicial desde la inspección.
  useEffect(() => {
    if (inspectionData?.inspection) {
      const insp = inspectionData.inspection;
      const activityIds: string[] =
        insp.activities?.edges?.map(
          (edge: { node: { id: string } }) => edge.node.id,
        ) || [];
      const next: FormData = {
        projectCode: insp.projectCode || "",
        instalationName: insp.instalationName || "",
        inspectionTypeId: insp.inspectionType?.id || "",
        gpsLatitude: parseFloat(insp.GPSLatitude) || 0,
        gpsLongitude: parseFloat(insp.GPSLongitude) || 0,
        clientId: insp.client?.id || "",
        activityIds,
        subcontrateNames:
          insp.subcontrateName?.edges?.map(
            (e: SubcontrateEdge) => e.node.subcontrateName,
          ) || [],
        observationText: insp.observation?.observationText || "",
        photos: insp.observation?.photos?.map((p: Photo) => p.photo) || [],
      };
      setFormData(next);
      initialDataRef.current = { ...next, activityIds: [...activityIds] };
      if (insp.observation?.photos) {
        setPhotoPreviews(
          insp.observation.photos.map(
            (p: Photo) => getFullImageUrl(p.photo) || p.photo,
          ),
        );
      }
    }
  }, [inspectionData]);

  // Resetear actividades sólo si el usuario cambia manualmente el tipo de inspección.
  useEffect(() => {
    if (formData.inspectionTypeId && inspectionData?.inspection) {
      const original = inspectionData.inspection.inspectionType?.id;
      if (original && formData.inspectionTypeId !== original) {
        setFormData((prev) => ({ ...prev, activityIds: [] }));
      }
    }
  }, [formData.inspectionTypeId, inspectionData]);

  const [updateInspection, { loading }] = useMutation(UpdateInspection, {
    onCompleted: (data) => {
      const backendErrors = data?.updateInspection?.errors;
      if (backendErrors && backendErrors.length) {
        processGraphQLErrors(backendErrors);
        setSubmitErrors(
          backendErrors.map(
            (e: {
              userMessage?: string;
              developerMessage?: string;
              code?: string;
              path?: string;
            }) => ({
              title: "Error del servidor",
              message:
                e.userMessage ||
                e.developerMessage ||
                e.code ||
                "Error desconocido",
              field: e.path,
              code: e.code,
            }),
          ),
        );
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }
      // Guardado OK → borrar del bucket las fotos que el usuario quitó.
      const toDelete = Array.from(pendingDeleteRef.current);
      pendingDeleteRef.current.clear();
      toDelete.forEach((u) => void deleteMediaByUrl(u));
      bumpRefresh();
      router.push("/inspections");
    },
    onError: (apolloError) => {
      const gqlMessages = (apolloError.graphQLErrors || []).map((g: any) => ({
        title: "Error GraphQL",
        message: g.message,
        code: (g.extensions?.code as string) || undefined,
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
        fromGenericError(apolloError, "Error al actualizar la inspección"),
      );
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
  });

  // Cambios detectados por campo.
  const changed = useMemo(() => {
    const initial = initialDataRef.current;
    if (!initial) {
      return {
        projectCode: false,
        instalationName: false,
        inspectionTypeId: false,
        clientId: false,
        observationText: false,
        gps: false,
        activityIds: false,
        subcontrateNames: false,
        photos: false,
      };
    }
    return {
      projectCode: !same(formData.projectCode, initial.projectCode),
      instalationName: !same(
        formData.instalationName,
        initial.instalationName,
      ),
      inspectionTypeId: !same(
        formData.inspectionTypeId,
        initial.inspectionTypeId,
      ),
      clientId: !same(formData.clientId, initial.clientId),
      observationText: !same(
        formData.observationText,
        initial.observationText,
      ),
      gps:
        !same(formData.gpsLatitude, initial.gpsLatitude) ||
        !same(formData.gpsLongitude, initial.gpsLongitude),
      activityIds: !same(formData.activityIds, initial.activityIds),
      subcontrateNames: !same(
        formData.subcontrateNames,
        initial.subcontrateNames,
      ),
      photos: !same(formData.photos, initial.photos),
    };
  }, [formData]);

  const totalChanges = Object.values(changed).filter(Boolean).length;
  const hasChanges = totalChanges > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErrors([]);

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
    if (formData.activityIds.length === 0) {
      localErrors.push({
        title: "Falta actividad",
        message: "Selecciona al menos una actividad.",
        field: "activityIds",
      });
    }
    if (localErrors.length > 0) {
      setSubmitErrors(localErrors);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    try {
      await updateInspection({
        variables: {
          id: inspectionId_,
          projectCode: formData.projectCode,
          instalationName: formData.instalationName,
          inspectionTypeId: formData.inspectionTypeId,
          dateTime: new Date().toISOString(),
          gpsLatitude: parseFloat(formData.gpsLatitude.toString()),
          gpsLongitude: parseFloat(formData.gpsLongitude.toString()),
          userId: user?.id,
          clientId: formData.clientId,
          activityIds: formData.activityIds,
          subcontrateNames: formData.subcontrateNames,
          observationText: formData.observationText,
          photos: formData.photos,
        },
      });
    } catch (err) {
      setSubmitErrors([
        {
          title: "Error inesperado",
          message:
            err instanceof Error ? err.message : "Error desconocido al enviar.",
        },
      ]);
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
          validFiles.map((f) => uploadObservationPhoto(f, inspectionId_)),
        );
        uploaded.forEach((u) => sessionUploadsRef.current.add(u));
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

  const capturePhoto = async () => {
    try {
      setIsUploadingPhoto(true);
      const blob = await capturePhotoBlob();
      if (!blob) {
        stopCamera();
        return;
      }
      const url = await uploadObservationPhoto(blob, inspectionId_);
      sessionUploadsRef.current.add(url);
      setPhotoPreviews((p) => [...p, url]);
      setFormData((p) => ({ ...p, photos: [...p.photos, url] }));
      stopCamera();
    } catch (err) {
      notifyError(fromGenericError(err, "Error al subir la foto"));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const removePhoto = (index: number) => {
    const url = formData.photos[index];
    setPhotoPreviews((p) => p.filter((_, i) => i !== index));
    setFormData((p) => ({
      ...p,
      photos: p.photos.filter((_, i) => i !== index),
    }));
    if (!url) return;
    if (sessionUploadsRef.current.has(url)) {
      // Subida de esta sesión: nada en BD referencia esta URL todavía,
      // se puede borrar del bucket sin riesgo de dejar links rotos.
      sessionUploadsRef.current.delete(url);
      void deleteMediaByUrl(url);
    } else {
      // Foto cargada de BD: marcar para borrar tras un guardado exitoso.
      pendingDeleteRef.current.add(url);
    }
  };

  const selectedType = inspectionTypesData?.inspectionTypes?.edges?.find(
    (e) => e.node.id === formData.inspectionTypeId,
  )?.node;
  const selectedClient = clientsData?.clients?.edges?.find(
    (e) => e.node.id === formData.clientId,
  )?.node;
  const totalActivities = activitiesData?.activities?.edges?.length || 0;
  const initialActivityIds = initialDataRef.current?.activityIds || [];

  if (!id) {
    return (
      <div className="min-h-screen bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
        <main className="mx-auto flex max-w-[1320px] items-center justify-center px-6 py-24">
          <Card radius={16}>
            <div className="text-center">
              <h2 className="m-0 text-xl font-bold">
                ID de inspección requerido
              </h2>
              <p className="mt-2 text-sm text-ink-2 dark:text-dark-ink-2">
                No se proporcionó un ID de inspección válido.
              </p>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (inspectionLoading) {
    return (
      <div className="min-h-screen bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
        <main className="mx-auto flex max-w-[1320px] items-center justify-center px-6 py-24">
          <div className="inline-flex items-center gap-3 text-sm text-ink-2 dark:text-dark-ink-2">
            <Loader2 size={18} className="animate-spin" />
            Cargando inspección…
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      <main className="mx-auto max-w-[1320px] px-4 pb-32 pt-5 sm:px-8 sm:pt-7 lg:pb-16">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-sm text-ink-2 dark:text-dark-ink-2">
          <button
            onClick={() => router.push("/inspections")}
            className="inline-flex items-center gap-1 hover:text-ink dark:hover:text-dark-ink"
          >
            <ChevronLeft size={13} /> Inspecciones
          </button>
          <span>·</span>
          <span className="font-mono text-[12px]">{formData.projectCode}</span>
          <span>·</span>
          <span className="font-semibold text-ink dark:text-dark-ink">
            Editar
          </span>
        </nav>

        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
              Editar inspección
            </div>
            <h1 className="m-0 mt-1.5 text-3xl font-extrabold tracking-tighter sm:text-[34px]">
              {formData.instalationName || "Sin instalación"}
            </h1>
            <p className="m-0 mt-1.5 text-sm text-ink-2 dark:text-dark-ink-2">
              {selectedType?.name || "Tipo sin definir"}
              {selectedClient && ` · ${selectedClient.clientName}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {hasChanges ? (
              <Pill tone="warn">
                {totalChanges}{" "}
                {totalChanges === 1 ? "cambio pendiente" : "cambios pendientes"}
              </Pill>
            ) : (
              <Pill tone="ok">Sin cambios</Pill>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<ClipboardList size={13} />}
              onClick={() =>
                router.push(`/inspections/questions?id=${inspectionId_}`)
              }
            >
              Ver preguntas
            </Button>
          </div>
        </header>

        {/* Panel inline de errores */}
        {submitErrors.length > 0 && (
          <Card
            radius={16}
            className="mb-5 !border-[rgba(var(--accent-rgb),0.32)] !bg-[rgba(var(--accent-rgb),0.06)]"
          >
            <div className="flex items-start gap-3">
              <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--accent-rgb),0.14)] text-primary-700">
                <AlertCircle size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="m-0 text-sm font-bold text-primary-700">
                    No se pudo actualizar la inspección
                    {submitErrors.length > 1 && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-[rgba(var(--accent-rgb),0.14)] px-2 py-0.5 text-[11px] font-semibold text-primary-700">
                        {submitErrors.length} errores
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
          className="grid gap-5 lg:grid-cols-[1.6fr_1fr]"
        >
          {/* ─── Columna izquierda ─── */}
          <div className="flex flex-col gap-5">
            {/* Identificación */}
            <Card radius={20}>
              <SectionHead
                title="Identificación del proyecto"
                subtitle="Edita los datos de la obra y la instalación"
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
                  changed={changed.projectCode}
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
                  changed={changed.instalationName}
                  required
                />

                <DiffSelectField
                  label="Cliente"
                  icon={<Building2 size={16} />}
                  value={formData.clientId}
                  loading={clientsLoading}
                  changed={changed.clientId}
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
                </DiffSelectField>

                <DiffSelectField
                  label="Tipo de inspección"
                  icon={<ShieldCheck size={16} />}
                  value={formData.inspectionTypeId}
                  loading={inspectionTypesLoading}
                  changed={changed.inspectionTypeId}
                  tag={
                    changed.inspectionTypeId
                      ? "Cambiar el tipo reinicia las actividades seleccionadas."
                      : undefined
                  }
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
                </DiffSelectField>
              </div>
            </Card>

            {/* Actividades */}
            <Card radius={20}>
              <SectionHead
                title="Actividades"
                subtitle={
                  formData.inspectionTypeId
                    ? `${totalActivities} disponibles · ${formData.activityIds.length} seleccionadas`
                    : "Selecciona primero un tipo de inspección"
                }
                icon={<Check size={16} />}
                action={
                  changed.activityIds ? (
                    <Pill tone="warn" className="!px-2 !py-0.5 !text-[10px]">
                      Modificado
                    </Pill>
                  ) : undefined
                }
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
                      // Una actividad "editada" es: ahora seleccionada y antes
                      // no, o viceversa.
                      const wasInitial = initialActivityIds.includes(
                        edge.node.id,
                      );
                      const edited = sel !== wasInitial;
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
                            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors",
                            sel
                              ? edited
                                ? "border-[rgba(232,163,61,0.40)] bg-[rgba(232,163,61,0.14)] text-warn-700"
                                : "border-transparent bg-grad-brand text-white"
                              : edited
                              ? "border-[rgba(232,163,61,0.40)] bg-[rgba(232,163,61,0.06)] text-warn-700"
                              : "border-hairline bg-bg-2 text-ink-2 hover:brightness-95 " +
                                  "dark:border-hairline-dark dark:bg-white/[0.03] dark:text-dark-ink-2",
                          )}
                          title={
                            edited
                              ? wasInitial
                                ? "Eliminada en este cambio"
                                : "Añadida en este cambio"
                              : undefined
                          }
                        >
                          {edited ? (
                            <span className="font-bold">
                              {wasInitial ? "−" : "+"}
                            </span>
                          ) : sel ? (
                            <Check size={12} />
                          ) : null}
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
                action={
                  changed.subcontrateNames ? (
                    <Pill tone="warn" className="!px-2 !py-0.5 !text-[10px]">
                      Modificado
                    </Pill>
                  ) : undefined
                }
              />
              <div className="mt-4 grid gap-2.5">
                {formData.subcontrateNames.map((name, index) => (
                  <div
                    key={`${name}-${index}`}
                    className="flex items-center gap-3 rounded-[14px] border border-hairline bg-bg-2 p-3 dark:border-hairline-dark dark:bg-white/[0.03]"
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
                    <div className="flex-1 text-sm font-semibold">{name}</div>
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

            {/* Observación */}
            <Card radius={20}>
              <SectionHead
                title="Observación"
                subtitle="Notas, evidencias y fotos"
                icon={<FileText size={16} />}
                action={
                  changed.observationText || changed.photos ? (
                    <Pill tone="warn" className="!px-2 !py-0.5 !text-[10px]">
                      Modificado
                    </Pill>
                  ) : undefined
                }
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
                  "border text-ink dark:text-dark-ink",
                  changed.observationText
                    ? "border-[rgba(232,163,61,0.32)] bg-[rgba(232,163,61,0.08)]"
                    : "border-hairline bg-bg-2 dark:border-hairline-dark dark:bg-white/[0.03]",
                )}
              />

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
                  htmlFor="photos-upload-edit"
                  className={cn(
                    "cursor-pointer",
                    isUploadingPhoto && "pointer-events-none opacity-60",
                  )}
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-[rgba(27,22,20,0.03)] px-3.5 py-2 text-[13px] font-medium text-ink-2 hover:brightness-95 dark:border-hairline-dark dark:bg-white/[0.04] dark:text-dark-ink-2">
                    {isUploadingPhoto ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Upload size={13} />
                    )}{" "}
                    {isUploadingPhoto ? "Subiendo…" : "Subir fotos"}
                  </span>
                </label>
                <input
                  id="photos-upload-edit"
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
                    icon={<X size={13} />}
                    onClick={() => {
                      const allUrls = formData.photos.slice();
                      setPhotoPreviews([]);
                      setFormData((p) => ({ ...p, photos: [] }));
                      setPhotoValidationError(null);
                      // Reaprovecha la misma lógica session vs BD
                      allUrls.forEach((u) => {
                        if (sessionUploadsRef.current.has(u)) {
                          sessionUploadsRef.current.delete(u);
                          void deleteMediaByUrl(u);
                        } else {
                          pendingDeleteRef.current.add(u);
                        }
                      });
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

              {photoPreviews.length > 0 && (
                <div className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {photoPreviews.map((preview, index) => (
                    <div
                      key={`${preview.slice(-20)}-${index}`}
                      className="relative aspect-[4/3] overflow-hidden rounded-[14px] border border-hairline dark:border-hairline-dark"
                    >
                      <NextImage
                        src={preview}
                        alt={`Foto ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                        unoptimized
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

              {/* El canvas vive dentro del modal de cámara para evitar
                  refs compartidas con un canvas duplicado. */}
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
                disabled={loading || !hasChanges}
                icon={
                  loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )
                }
                title={
                  !hasChanges
                    ? "No hay cambios para guardar"
                    : "Guardar cambios"
                }
              >
                {loading ? "Guardando…" : "Guardar cambios"}
              </Button>
            </div>
          </div>

          {/* ─── Sidebar derecho ─── */}
          <div className="flex flex-col gap-5">
            {/* Resumen de cambios */}
            <Card glow radius={20}>
              <div className="text-[11px] font-bold uppercase tracking-widest text-primary-500">
                Resumen de cambios
              </div>
              <div className="mt-1.5 text-2xl font-extrabold tracking-tight">
                {hasChanges
                  ? `${totalChanges} ${totalChanges === 1 ? "campo modificado" : "campos modificados"}`
                  : "Sin cambios"}
              </div>
              <div className="text-[13px] text-ink-2 dark:text-dark-ink-2">
                Los cambios quedan registrados con tu nombre y fecha.
              </div>

              <div className="my-4 h-px bg-hairline dark:bg-hairline-dark" />

              <ChangeRow label="Datos generales" active={
                changed.projectCode ||
                changed.instalationName ||
                changed.clientId ||
                changed.inspectionTypeId
              }/>
              <ChangeRow label="Actividades" active={changed.activityIds} />
              <ChangeRow label="Subcontratas" active={changed.subcontrateNames} />
              <ChangeRow label="Observación" active={changed.observationText} />
              <ChangeRow label="Fotos" active={changed.photos} />
              <ChangeRow label="Ubicación GPS" active={changed.gps} last />
            </Card>

            {/* Ubicación GPS */}
            <Card radius={20} padding={0}>
              <div className="px-5 pb-3.5 pt-5">
                <SectionHead
                  title="Ubicación GPS"
                  subtitle="Sólo lectura"
                  icon={<MapPin size={16} />}
                  action={
                    <Pill tone="neutral" className="!px-2 !py-0.5 !text-[10px]">
                      Bloqueado
                    </Pill>
                  }
                />
              </div>

              {formData.gpsLatitude !== 0 && formData.gpsLongitude !== 0 ? (
                <div className="h-[200px] w-full overflow-hidden">
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
                      <Popup>{formData.instalationName || "Ubicación"}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              ) : (
                <div className="mx-5 mb-4 rounded-[12px] border border-dashed border-hairline bg-bg-2 p-5 text-center text-sm text-ink-2 dark:border-hairline-dark dark:bg-white/[0.03] dark:text-dark-ink-2">
                  Esta inspección no tiene coordenadas GPS registradas.
                </div>
              )}

              {formData.gpsLatitude !== 0 && formData.gpsLongitude !== 0 && (
                <div className="flex items-center justify-between border-t border-hairline px-5 py-3.5 dark:border-hairline-dark">
                  <span className="font-mono text-xs text-ink-2 dark:text-dark-ink-2">
                    {formData.gpsLatitude.toFixed(4)},{" "}
                    {formData.gpsLongitude.toFixed(4)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-ink-3 dark:text-dark-ink-2">
                    <Pill tone="neutral" className="!px-2 !py-0.5 !text-[10px]">
                      No editable
                    </Pill>
                  </span>
                </div>
              )}
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
                disabled={loading || !hasChanges}
                icon={
                  loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )
                }
                className="flex-1 justify-center"
              >
                {loading
                  ? "Guardando…"
                  : hasChanges
                    ? `Guardar (${totalChanges})`
                    : "Sin cambios"}
              </Button>
            </div>
          </div>
        </form>
      </main>

      {/* Modal cámara */}
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

/**
 * Select con la misma "caja" que `<Field>` + pill de modificado/tag.
 */
function DiffSelectField({
  label,
  icon,
  loading,
  required,
  hint,
  tag,
  changed,
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  icon?: React.ReactNode;
  loading?: boolean;
  required?: boolean;
  hint?: string;
  tag?: string;
  changed?: boolean;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold tracking-tight text-ink-2 dark:text-dark-ink-2">
          {label} {required && <span className="text-primary-500">*</span>}
        </label>
        {changed && (
          <Pill tone="warn" className="!px-2 !py-0.5 !text-[10px]">
            Modificado
          </Pill>
        )}
      </div>
      <div
        className={cn(
          "mt-1.5 flex items-center gap-2.5 rounded-[12px] border px-3.5 py-3",
          changed
            ? "border-[rgba(232,163,61,0.32)] bg-[rgba(232,163,61,0.08)]"
            : "border-hairline bg-bg-2 dark:border-hairline-dark dark:bg-white/[0.03]",
        )}
      >
        {icon && (
          <span className="inline-flex shrink-0 text-ink-2 dark:text-dark-ink-2">
            {icon}
          </span>
        )}
        <select
          {...rest}
          className="flex-1 cursor-pointer appearance-none bg-transparent text-sm text-ink outline-none disabled:cursor-not-allowed dark:text-dark-ink"
          disabled={loading || rest.disabled}
        >
          {children}
        </select>
        <ChevronDown
          size={14}
          className="shrink-0 text-ink-2 dark:text-dark-ink-2"
        />
      </div>
      {(loading || hint || tag) && (
        <p className="mt-1 text-[11px] text-ink-3 dark:text-dark-ink-2">
          {loading ? "Cargando…" : hint || tag}
        </p>
      )}
    </div>
  );
}

function ChangeRow({
  label,
  active,
  last,
}: {
  label: string;
  active: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2.5 text-[13px]",
        !last &&
          "border-b border-dashed border-hairline dark:border-hairline-dark",
      )}
    >
      <span className="text-ink-2 dark:text-dark-ink-2">{label}</span>
      {active ? (
        <Pill tone="warn" className="!px-2 !py-0.5 !text-[10px]">
          Modificado
        </Pill>
      ) : (
        <span className="font-mono text-[11px] text-ink-3 dark:text-dark-ink-2">
          sin cambios
        </span>
      )}
    </div>
  );
}
