"use client";

import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { SectionHead } from "@/components/ui/SectionHead";
import { useTheme } from "@/contexts/ThemeContext";
import { DeleteInspection, GetInspection } from "@/graphql/inspections";
import { fromGenericError, notifyError } from "@/lib/error-service";
import { cn, getFullImageUrl } from "@/lib/utils";
import { useMutation, useQuery } from "@/lib/apollo-compat";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronLeft,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Maximize2,
  ShieldCheck,
  Trash2,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

// ─────────────────────────────────────────────────────────────
// Leaflet dinámico (evita SSR)
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
// Tipos (matchean el query GraphQL)
// ─────────────────────────────────────────────────────────────
interface Inspection {
  id: string;
  projectCode: string;
  instalationName: string;
  inspectionType: { id: string; name: string };
  dateTime: string;
  GPSLatitude: number;
  GPSLongitude: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  client: { id: string; clientName: string };
  activities: { edges: Array<{ node: { id: string; activityText: string } }> };
  subcontrateName: {
    edges: Array<{ node: { id: string; subcontrateName: string } }>;
  };
  observation: {
    id: string;
    observationText: string;
    photos: Array<{ photo: string }>;
  };
  polls: { edges: Array<{ node: { id: string; status: string } }> };
}

interface InspectionResponse {
  inspection: Inspection;
}

// ─────────────────────────────────────────────────────────────

export default function InspectionDetailsPageClient() {
  const router = useRouter();
  const { isDark } = useTheme();
  const searchParams = useSearchParams();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Modal de imagen
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoadingStates, setImageLoadingStates] = useState<{
    [key: number]: boolean;
  }>({});

  // ─── Decode del ID base64 (con padding) — preservado del original ───
  const inspectionId = searchParams.get("id");
  let inspectionId_ = inspectionId || "";
  try {
    let decoded = decodeURIComponent(inspectionId || "");
    while (decoded.length % 4 !== 0) decoded += "=";
    inspectionId_ = decoded;
  } catch (e) {
    notifyError(fromGenericError(e, "Error al procesar el ID de inspección"));
  }

  const { loading, error, data } = useQuery<InspectionResponse>(GetInspection, {
    variables: { id: inspectionId_ },
  });

  const [deleteInspection, { loading: deleteLoading }] = useMutation(
    DeleteInspection,
    {
      onCompleted: () => {
        setIsDeleteDialogOpen(false);
        router.push("/inspections");
      },
      onError: () => setIsDeleteDialogOpen(false),
    },
  );

  // ─── Handlers de imagen modal (preservados) ───
  const openImageModal = (url: string) => {
    setSelectedImage(url);
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
  const handleZoomIn = () => setZoomLevel((p) => Math.min(p * 1.2, 5));
  const handleZoomOut = () => setZoomLevel((p) => Math.max(p / 1.2, 1));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
    setIsDragging(false);
  };
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoomLevel((p) => Math.min(Math.max(p * delta, 1), 5));
    if (zoomLevel <= 1 && e.deltaY > 0) setImagePosition({ x: 0, y: 0 });
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
  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoomLevel > 1) {
      setIsDragging(true);
      const t = e.touches[0];
      setDragStart({
        x: t.clientX - imagePosition.x,
        y: t.clientY - imagePosition.y,
      });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const distance = Math.hypot(
        t2.clientX - t1.clientX,
        t2.clientY - t1.clientY,
      );
      setDragStart({ x: distance, y: 0 });
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
      const t = e.touches[0];
      setImagePosition({
        x: t.clientX - dragStart.x,
        y: t.clientY - dragStart.y,
      });
    } else if (e.touches.length === 2) {
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const distance = Math.hypot(
        t2.clientX - t1.clientX,
        t2.clientY - t1.clientY,
      );
      const initialDistance = dragStart.x;
      if (initialDistance > 0) {
        const scale = distance / initialDistance;
        setZoomLevel((z) => Math.min(Math.max(z * scale, 1), 5));
        setDragStart({ x: distance, y: 0 });
      }
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) setIsDragging(false);
  };

  // ─── Estados especiales ───
  if (!inspectionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg dark:bg-dark-bg">
        <Card>
          <h2 className="m-0 text-xl font-bold">ID de inspección requerido</h2>
          <p className="mt-2 text-sm text-ink-2 dark:text-dark-ink-2">
            No se proporcionó un ID de inspección válido.
          </p>
        </Card>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg dark:bg-dark-bg">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500" />
      </div>
    );
  }
  if (error || !data?.inspection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg dark:bg-dark-bg">
        <Card>
          <p className="text-primary-600">
            {error
              ? "Error al cargar la inspección"
              : "Inspección no encontrada"}
          </p>
        </Card>
      </div>
    );
  }

  const inspection = data.inspection;
  const completed = inspection.polls?.edges?.some(
    (e) => e.node.status === "COMPLETED",
  );
  const inspectorInitials =
    inspection.user?.firstName && inspection.user?.lastName
      ? `${inspection.user.firstName.charAt(0)}${inspection.user.lastName.charAt(
          0,
        )}`.toUpperCase()
      : "?";
  const clientInitials = inspection.client?.clientName
    ? inspection.client.clientName
        .split(" ")
        .map((w) => w.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";
  const dateObj = new Date(inspection.dateTime);
  const dateLong = dateObj.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeShort = dateObj.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const subcontractors = inspection.subcontrateName?.edges || [];
  const photos = inspection.observation?.photos || [];

  const gpsLat = Number(inspection.GPSLatitude);
  const gpsLng = Number(inspection.GPSLongitude);
  const mapCenter: LatLngExpression = [gpsLat, gpsLng];

  // Línea de tiempo derivada de los datos disponibles
  const pollState = inspection.polls?.edges?.[0]?.node?.status;
  const timeline: Array<{
    label: string;
    when: string;
    tone: "neutral" | "info" | "warn" | "ok" | "brand";
  }> = [
    {
      label: "Inspección creada",
      when: `${dateLong} · ${timeShort}`,
      tone: "neutral",
    },
  ];
  if (pollState) {
    timeline.push({
      label: pollState === "COMPLETED" ? "Encuesta completada" : "Encuesta iniciada",
      when: pollState === "COMPLETED" ? `${dateLong}` : "En progreso",
      tone: pollState === "COMPLETED" ? "ok" : "info",
    });
  }
  if (photos.length > 0) {
    timeline.push({
      label: `${photos.length} foto${photos.length > 1 ? "s" : ""} adjuntada${photos.length > 1 ? "s" : ""}`,
      when: "Observación general",
      tone: "warn",
    });
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      <main className="mx-auto max-w-[1320px] px-3 pb-16 pt-5 sm:px-8 sm:pt-8">
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
            {inspection.projectCode}
          </span>
        </nav>

        {/* ─── Hero Card glow ─── */}
        <Card glow radius={24} padding={28}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <span className="rounded-lg bg-[rgba(var(--accent-rgb),0.10)] px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-primary-600">
                  {inspection.projectCode}
                </span>
                {completed ? (
                  <Pill tone="ok">
                    <Check size={11} /> Completada
                  </Pill>
                ) : (
                  <Pill tone="warn">
                    <Clock size={11} /> En progreso
                  </Pill>
                )}
                {inspection.inspectionType?.name && (
                  <Pill>{inspection.inspectionType.name}</Pill>
                )}
              </div>
              <h1 className="m-0 text-3xl font-extrabold tracking-tighter sm:text-[36px]">
                {inspection.instalationName}
              </h1>
              <p className="m-0 mt-2 text-[15px] text-ink-2 dark:text-dark-ink-2">
                {inspection.client?.clientName} · Inspección de seguridad
                realizada el{" "}
                <b className="text-ink dark:text-dark-ink">
                  {dateLong}, {timeShort}
                </b>
              </p>

              {/* Meta grid */}
              <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
                <Meta
                  k="Inspector"
                  v={
                    inspection.user
                      ? `${inspection.user.firstName} ${inspection.user.lastName}`
                      : "—"
                  }
                />
                <Meta
                  k="Tipo"
                  v={inspection.inspectionType?.name || "—"}
                />
                <Meta
                  k="Subcontratistas"
                  v={
                    subcontractors.length > 0
                      ? subcontractors
                          .map((s) => s.node.subcontrateName)
                          .join(" · ")
                      : "—"
                  }
                />
                <Meta
                  k="Estado"
                  v={
                    completed
                      ? "Encuesta completada"
                      : pollState
                      ? "Encuesta en curso"
                      : "Encuesta pendiente"
                  }
                />
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-2.5 lg:items-end">
              <Button
                icon={<FileText size={14} />}
                onClick={() =>
                  router.push(`/inspections/questions?id=${inspectionId_}`)
                }
              >
                Ver preguntas
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Edit3 size={13} />}
                  onClick={() =>
                    router.push(`/inspections/edit?id=${inspectionId_}`)
                  }
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={
                    deleteLoading ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )
                  }
                  disabled={deleteLoading}
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="!text-primary-600"
                >
                  {deleteLoading ? "Eliminando…" : "Eliminar"}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* ─── Grid principal ─── */}
        <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[1.4fr_1fr]">
          {/* ─── Columna izquierda ─── */}
          <div className="flex min-w-0 flex-col gap-5">
            {/* Actividades inspeccionadas */}
            <Card radius={20}>
              <SectionHead
                title="Actividades inspeccionadas"
                subtitle={`${inspection.activities?.edges?.length || 0} actividades`}
                icon={<ShieldCheck size={16} />}
              />
              <div className="mt-4 grid gap-2.5">
                {inspection.activities?.edges?.length ? (
                  inspection.activities.edges.map(({ node }) => (
                    <div
                      key={node.id}
                      className="flex items-center gap-3.5 rounded-[14px] border border-hairline bg-bg-2 p-3.5 dark:border-hairline-dark dark:bg-white/[0.03]"
                    >
                      <div className="bg-grad-ok inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-white">
                        <Check size={16} />
                      </div>
                      <div className="flex-1 text-sm font-semibold">
                        {node.activityText}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="m-0 text-sm text-ink-2 dark:text-dark-ink-2">
                    No se registraron actividades.
                  </p>
                )}
              </div>
            </Card>

            {/* Subcontratistas (si hay) */}
            {subcontractors.length > 0 && (
              <Card radius={20}>
                <SectionHead
                  title="Subcontratistas presentes"
                  subtitle={`${subcontractors.length} ${subcontractors.length === 1 ? "empresa" : "empresas"}`}
                  icon={<Users size={16} />}
                />
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {subcontractors.map(({ node }) => (
                    <div
                      key={node.id}
                      className="flex items-center gap-3 rounded-[14px] border border-hairline bg-bg-2 p-3 dark:border-hairline-dark dark:bg-white/[0.03]"
                    >
                      <Avatar
                        name={node.subcontrateName
                          .split(" ")
                          .map((w) => w.charAt(0))
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                        size={32}
                      />
                      <div className="flex-1 text-sm font-semibold">
                        {node.subcontrateName}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Observación general */}
            {inspection.observation && (
              <Card radius={20}>
                <SectionHead
                  title="Observación general"
                  subtitle={
                    photos.length > 0
                      ? `${photos.length} foto${photos.length > 1 ? "s" : ""} adjunta${photos.length > 1 ? "s" : ""}`
                      : "Sin fotos adjuntas"
                  }
                  icon={<FileText size={16} />}
                />
                {inspection.observation.observationText && (
                  <p className="m-0 mt-3.5 rounded-[14px] border border-hairline bg-bg-2 p-4 text-sm leading-[1.65] dark:border-hairline-dark dark:bg-white/[0.03]">
                    {inspection.observation.observationText}
                  </p>
                )}
                {photos.length > 0 && (
                  <div className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {photos.map((photo, index) => {
                      const url = getFullImageUrl(photo.photo) || "";
                      return (
                        <button
                          key={index}
                          onClick={() => openImageModal(url)}
                          className="group relative aspect-[4/3] overflow-hidden rounded-[14px] border border-hairline bg-bg-2 dark:border-hairline-dark"
                        >
                          {imageLoadingStates[index] && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-2 dark:bg-white/[0.06]">
                              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                            </div>
                          )}
                          <Image
                            src={url}
                            alt={`Foto ${index + 1}`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-200 group-hover:scale-105"
                            onLoadStart={() =>
                              setImageLoadingStates((p) => ({ ...p, [index]: true }))
                            }
                            onLoad={() =>
                              setImageLoadingStates((p) => ({ ...p, [index]: false }))
                            }
                            onError={() =>
                              setImageLoadingStates((p) => ({ ...p, [index]: false }))
                            }
                          />
                          <div className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/40 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                            <Maximize2 size={14} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* ─── Columna derecha ─── */}
          <div className="flex min-w-0 flex-col gap-5">
            {/* Ubicación + mapa */}
            <Card radius={20} padding={0}>
              <div className="px-5 pb-3.5 pt-5">
                <SectionHead
                  title="Ubicación"
                  subtitle={`${gpsLat.toFixed(4)}° N, ${gpsLng.toFixed(4)}° E`}
                  icon={<MapPin size={16} />}
                />
              </div>
              <div className="h-[240px] w-full overflow-hidden">
                <MapContainer
                  center={mapCenter}
                  zoom={15}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={false}
                >
                  <LeafletIconConfig />
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={mapCenter}>
                    <Popup>{inspection.instalationName}</Popup>
                  </Marker>
                </MapContainer>
              </div>
              <div className="flex items-center justify-between border-t border-hairline px-5 py-4 dark:border-hairline-dark">
                <div className="inline-flex items-center gap-2.5">
                  <MapPin size={14} className="text-ink-2 dark:text-dark-ink-2" />
                  <span className="text-[13px] font-mono">
                    {gpsLat.toFixed(4)},{" "}
                    {gpsLng.toFixed(4)}
                  </span>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${gpsLat},${gpsLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ExternalLink size={13} />}
                  >
                    Abrir en mapas
                  </Button>
                </a>
              </div>
            </Card>

            {/* Cliente */}
            {inspection.client && (
              <Card radius={20}>
                <SectionHead title="Cliente" icon={<Building2 size={16} />} />
                <div className="mt-3.5 flex items-center gap-3.5 rounded-[14px] border border-hairline bg-bg-2 p-3.5 dark:border-hairline-dark dark:bg-white/[0.03]">
                  <div className="bg-grad-brand inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-extrabold text-white">
                    {clientInitials}
                  </div>
                  <div className="flex-1">
                    <div className="text-[15px] font-bold">
                      {inspection.client.clientName}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Inspector */}
            {inspection.user && (
              <Card radius={20}>
                <SectionHead title="Inspector" icon={<Users size={16} />} />
                <div className="mt-3.5 flex items-center gap-3.5 rounded-[14px] border border-hairline bg-bg-2 p-3.5 dark:border-hairline-dark dark:bg-white/[0.03]">
                  <Avatar name={inspectorInitials} size={48} />
                  <div className="flex-1">
                    <div className="text-[15px] font-bold">
                      {inspection.user.firstName} {inspection.user.lastName}
                    </div>
                    <div className="text-xs text-ink-2 dark:text-dark-ink-2">
                      {inspection.user.email}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Línea de tiempo */}
            <Card radius={20}>
              <SectionHead title="Línea de tiempo" icon={<Clock size={16} />} />
              <div className="relative mt-3.5">
                <div className="absolute bottom-1.5 left-[11px] top-1.5 w-0.5 bg-hairline dark:bg-hairline-dark" />
                {timeline.map((e, i) => (
                  <div key={i} className="relative flex gap-3.5 py-2.5">
                    <div
                      className={cn(
                        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white",
                        e.tone === "ok" && "bg-grad-ok",
                        e.tone === "warn" && "bg-grad-warn",
                        e.tone === "info" && "bg-grad-info",
                        e.tone === "brand" && "bg-grad-brand",
                        e.tone === "neutral" && "bg-ink-3",
                      )}
                      style={{
                        boxShadow: `0 0 0 3px ${
                          isDark ? "#241D1A" : "#FFFFFF"
                        }`,
                      }}
                    >
                      <Check size={11} />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold">{e.label}</div>
                      <div className="text-xs text-ink-2 dark:text-dark-ink-2">
                        {e.when}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Volver */}
            <Button
              variant="ghost"
              icon={<ArrowLeft size={14} />}
              onClick={() => router.push("/inspections")}
            >
              Volver al listado
            </Button>
          </div>
        </div>
      </main>

      {/* ─── Modal de imagen (preservado al 100%, con styling actualizado) ─── */}
      {isImageModalOpen && selectedImage && (
        <div
          className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/75 p-4"
          onClick={closeImageModal}
        >
          <div className="relative flex h-full w-full items-center justify-center">
            {/* Cerrar */}
            <button
              onClick={closeImageModal}
              className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/75"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>

            {/* Controles zoom */}
            <div className="absolute left-4 top-4 z-20 flex flex-col gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomIn();
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/75"
                aria-label="Acercar"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomOut();
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/75"
                aria-label="Alejar"
              >
                <ZoomOut size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetZoom();
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/75"
                aria-label="Ajustar"
              >
                <Maximize2 size={18} />
              </button>
            </div>

            {/* Indicador zoom */}
            <div
              className="absolute bottom-4 left-4 z-20 rounded-md bg-black/50 px-3 py-1 text-sm text-white backdrop-blur"
              onClick={(e) => e.stopPropagation()}
            >
              {Math.round(zoomLevel * 100)}%
            </div>

            {/* Contenedor de imagen */}
            <div
              className="relative flex h-full w-full max-w-[calc(100vw-2rem)] items-center justify-center overflow-hidden"
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
                className="relative h-full w-full"
              >
                <Image
                  src={selectedImage}
                  alt="Imagen ampliada"
                  fill
                  className="rounded-lg object-contain"
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

      {/* ─── Confirmación delete ─── */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={async () => {
          try {
            await deleteInspection({ variables: { id: inspectionId_ } });
          } catch {
            // Apollo Link gestiona errores
          }
        }}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que deseas eliminar la inspección "${inspection.projectCode}"? Esta acción no se puede deshacer.`}
        isDark={isDark}
        isLoading={deleteLoading}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helper interno: par etiqueta + valor del hero meta
// ─────────────────────────────────────────────────────────────
function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-2 dark:text-dark-ink-2">
        {k}
      </div>
      <div className="mt-0.5 text-sm font-semibold">{v}</div>
    </div>
  );
}

