"use client";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { GradientBorder } from "@/components/ui/GradientBorder";
import { Logo } from "@/components/ui/Logo";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Mail,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Step {
  key: "team" | "site" | "catalog" | "mobile";
  label: string;
  badge: string;
  title: string;
  highlight: string;
  rest: string;
  description: string;
  Icon: React.ComponentType<{ size?: number | string }>;
}

const STEPS: Step[] = [
  {
    key: "team",
    label: "Crea tu equipo",
    badge: "Paso 1 · Equipo",
    title: "Invita a tu",
    highlight: "primer equipo",
    rest: "a Safe 360.",
    description:
      "Añade a tus inspectores, técnicos y jefes de obra. Recibirán un email para activar su cuenta.",
    Icon: Users,
  },
  {
    key: "site",
    label: "Configura tu primera obra",
    badge: "Paso 2 · Obra",
    title: "Conecta tu",
    highlight: "primera obra",
    rest: "a Safe 360.",
    description:
      "Asocia clientes, asigna inspectores y elige las plantillas TI que se usarán. Puedes cambiarlo en cualquier momento desde administración.",
    Icon: Building2,
  },
  {
    key: "catalog",
    label: "Importa el catálogo de TI",
    badge: "Paso 3 · Catálogo",
    title: "Importa tus",
    highlight: "tipos de inspección",
    rest: "y plantillas.",
    description:
      "Añade los tipos de inspección que utilizaréis y las preguntas asociadas. Puedes empezar con plantillas predefinidas.",
    Icon: ClipboardList,
  },
  {
    key: "mobile",
    label: "Habilita la app móvil",
    badge: "Paso 4 · Móvil",
    title: "Lleva Safe 360 a",
    highlight: "campo",
    rest: "con la app móvil.",
    description:
      "Tu equipo podrá realizar inspecciones desde el móvil con o sin conexión, hacer fotos y firmar reportes.",
    Icon: Smartphone,
  },
];

export default function OnboardingPage() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(1);
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set([0]));

  // Estado del form de obra (paso 2)
  const [siteName, setSiteName] = useState("SE Bilbao Norte");
  const [siteCode, setSiteCode] = useState("ESP-24-001");
  const [client, setClient] = useState("Iberdrola Distribución");
  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(
    new Set(["TI-01", "TI-04", "TI-06"]),
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-2 dark:text-dark-ink-2">
        <Loader2 size={18} className="mr-2 animate-spin" /> Cargando…
      </div>
    );
  }
  if (!isAuthenticated || !user) return null;

  const step = STEPS[currentIndex];

  const handleContinue = () => {
    setDoneSteps((prev) => new Set(prev).add(currentIndex));
    if (currentIndex < STEPS.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      router.push("/");
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const toggleType = (code: string) => {
    setEnabledTypes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      {/* Atmosphere */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0",
          "[background:radial-gradient(700px_480px_at_0%_100%,rgba(247,140,124,0.30),transparent_60%),radial-gradient(800px_400px_at_100%_0%,rgba(var(--accent-rgb),0.08),transparent_60%)]",
          "dark:[background:radial-gradient(700px_480px_at_0%_100%,rgba(var(--accent-rgb),0.18),transparent_60%),radial-gradient(800px_400px_at_100%_0%,rgba(247,140,124,0.08),transparent_60%)]",
        )}
      />

      {/* Top */}
      <div className="relative flex items-center justify-between px-4 py-7 sm:px-10">
        <Logo size={32} />
        <div className="flex items-center gap-4">
          <span className="hidden text-[13px] font-medium text-ink-2 dark:text-dark-ink-2 sm:inline">
            Paso {currentIndex + 1} de {STEPS.length}
          </span>
          <div className="flex gap-1">
            {STEPS.map((s, i) => {
              const isDone = doneSteps.has(i);
              const isCurrent = i === currentIndex;
              return (
                <span
                  key={s.key}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    isCurrent
                      ? "w-7 bg-grad-brand"
                      : isDone
                        ? "w-3 bg-primary-500"
                        : "w-3 bg-[rgba(27,22,20,0.12)] dark:bg-white/[0.12]",
                  )}
                />
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-[13px] font-semibold text-ink-2 transition-colors hover:text-ink dark:text-dark-ink-2 dark:hover:text-dark-ink"
          >
            Saltar configuración
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative mx-auto grid max-w-[1200px] gap-10 px-4 pb-12 sm:px-10 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-16">
        {/* Left text + checklist */}
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(var(--accent-rgb),0.24)] bg-[rgba(var(--accent-rgb),0.08)] px-3 py-1.5 text-[12px] font-semibold text-primary-500">
            <ShieldCheck size={12} />
            {step.badge}
          </div>
          <h1 className="m-0 text-[42px] font-extrabold leading-[1.02] tracking-tighter sm:text-[52px]">
            {step.title}{" "}
            <span className="bg-grad-brand bg-clip-text text-transparent">
              {step.highlight}
            </span>{" "}
            {step.rest}
          </h1>
          <p className="m-0 mt-4 max-w-[460px] text-base leading-relaxed text-ink-2 dark:text-dark-ink-2">
            {step.description}
          </p>

          <div className="mt-7 flex flex-col gap-2.5">
            {STEPS.map((s, i) => {
              const isDone = doneSteps.has(i);
              const isCurrent = i === currentIndex;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold",
                      isDone
                        ? "bg-grad-ok text-white"
                        : isCurrent
                          ? "bg-grad-brand text-white"
                          : "bg-bg-2 text-ink-2 dark:bg-white/[0.06] dark:text-dark-ink-2",
                    )}
                  >
                    {isDone ? <Check size={13} /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      "text-[14px] font-semibold",
                      isDone
                        ? "text-ink-2 line-through dark:text-dark-ink-2"
                        : "",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-9 flex gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              icon={<ArrowLeft size={14} />}
              onClick={handleBack}
              disabled={currentIndex === 0}
            >
              Atrás
            </Button>
            <Button
              type="button"
              size="lg"
              icon={<ArrowRight size={14} />}
              iconPosition="right"
              onClick={handleContinue}
            >
              {currentIndex === STEPS.length - 1 ? "Finalizar" : "Continuar"}
            </Button>
          </div>
        </div>

        {/* Right preview */}
        <GradientBorder radius={24}>
          <div className="min-h-[420px] p-6">
            {step.key === "site" && (
              <SitePreview
                siteName={siteName}
                setSiteName={setSiteName}
                siteCode={siteCode}
                setSiteCode={setSiteCode}
                client={client}
                setClient={setClient}
                enabledTypes={enabledTypes}
                onToggleType={toggleType}
              />
            )}
            {step.key === "team" && <TeamPreview />}
            {step.key === "catalog" && <CatalogPreview />}
            {step.key === "mobile" && <MobilePreview />}
          </div>
        </GradientBorder>
      </div>
    </div>
  );
}

const TI_OPTIONS = [
  { code: "TI-01", name: "Obra civil", color: "#4F75E1" },
  { code: "TI-04", name: "Altura", color: "#DA291C" },
  { code: "TI-06", name: "Distribución", color: "#0E7490" },
  { code: "TI-02", name: "Química", color: "#E8A33D" },
  { code: "TI-05", name: "Eólica", color: "#2F9E6A" },
];

function SitePreview({
  siteName,
  setSiteName,
  siteCode,
  setSiteCode,
  client,
  setClient,
  enabledTypes,
  onToggleType,
}: {
  siteName: string;
  setSiteName: (v: string) => void;
  siteCode: string;
  setSiteCode: (v: string) => void;
  client: string;
  setClient: (v: string) => void;
  enabledTypes: Set<string>;
  onToggleType: (code: string) => void;
}) {
  return (
    <>
      <div className="text-[11px] font-bold uppercase tracking-widest text-ink-2 dark:text-dark-ink-2">
        Datos de la obra
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field
          label="Nombre"
          icon={<Building2 size={15} />}
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
        />
        <Field
          label="Código"
          icon={<ClipboardList size={15} />}
          value={siteCode}
          onChange={(e) => setSiteCode(e.target.value)}
        />
      </div>

      <div className="mt-3">
        <Select
          label="Cliente"
          icon={<Building2 size={15} />}
          value={client}
          onChange={(e) => setClient(e.target.value)}
        >
          <option value="Iberdrola Distribución">Iberdrola Distribución</option>
          <option value="Repsol">Repsol</option>
          <option value="ACS">ACS</option>
          <option value="Cepsa">Cepsa</option>
        </Select>
      </div>

      <div className="mt-4">
        <div className="text-[12px] font-semibold text-ink-2 dark:text-dark-ink-2">
          Tipos de inspección habilitados
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TI_OPTIONS.map((t) => {
            const sel = enabledTypes.has(t.code);
            return (
              <button
                key={t.code}
                type="button"
                onClick={() => onToggleType(t.code)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold",
                  "transition-colors",
                )}
                style={
                  sel
                    ? {
                        backgroundColor: `${t.color}1A`,
                        borderColor: `${t.color}55`,
                        color: t.color,
                      }
                    : undefined
                }
              >
                {!sel && (
                  <span className="rounded-full border border-current px-2 py-0 text-[10px] font-bold opacity-70">
                    {t.code}
                  </span>
                )}
                {sel && <Check size={11} />}
                {sel && (
                  <span className="font-mono text-[11px] font-bold opacity-85">
                    {t.code}
                  </span>
                )}{" "}
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[12px] font-semibold text-ink-2 dark:text-dark-ink-2">
          Equipo asignado
        </div>
        <div className="mt-2 flex items-center gap-2.5">
          <div className="flex">
            {["LS", "AG", "MV", "PM", "CR"].map((n, i) => (
              <div
                key={n}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full bg-grad-brand text-[11px] font-bold text-white ring-2 ring-surface dark:ring-dark-surface",
                  i > 0 && "-ml-2.5",
                )}
              >
                {n}
              </div>
            ))}
          </div>
          <span className="text-[12px] text-ink-2 dark:text-dark-ink-2">
            5 personas · 1 admin · 3 inspectores · 1 técnico
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2.5 rounded-[12px] border border-[rgba(47,158,106,0.28)] bg-[rgba(47,158,106,0.10)] p-3.5">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-grad-ok text-white">
          <Check size={14} />
        </div>
        <div>
          <div className="text-[13px] font-bold text-[#1F7A50]">
            Obra lista para empezar
          </div>
          <div className="text-[11px] text-ink-2 dark:text-dark-ink-2">
            Tu equipo puede iniciar inspecciones desde el móvil hoy mismo.
          </div>
        </div>
      </div>
    </>
  );
}

function TeamPreview() {
  return (
    <>
      <div className="text-[11px] font-bold uppercase tracking-widest text-ink-2 dark:text-dark-ink-2">
        Invita a tu equipo
      </div>
      <div className="mt-3 grid gap-2.5">
        {[
          { name: "Luis Sáez Bermejo", email: "luis.saez@empresa.com", role: "Inspector" },
          { name: "Ana Gil Pérez", email: "ana.gil@empresa.com", role: "Inspector" },
          { name: "Marc Vidal", email: "marc.vidal@empresa.com", role: "Técnico" },
          { name: "Pilar Moya", email: "pilar.moya@empresa.com", role: "Jefe de obra" },
        ].map((u, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-[12px] border border-hairline bg-bg-2 p-3 dark:border-hairline-dark dark:bg-white/[0.03]"
          >
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-grad-brand text-[12px] font-bold text-white">
              {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{u.name}</div>
              <div className="flex items-center gap-1.5 text-[11px] text-ink-2 dark:text-dark-ink-2">
                <Mail size={10} /> {u.email}
              </div>
            </div>
            <span className="rounded-full bg-grad-info px-2.5 py-1 text-[10px] font-bold text-white">
              {u.role}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2.5 rounded-[12px] border border-[rgba(47,158,106,0.28)] bg-[rgba(47,158,106,0.10)] p-3.5">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-grad-ok text-white">
          <Check size={14} />
        </div>
        <div className="text-[13px] font-bold text-[#1F7A50]">
          4 invitaciones enviadas
        </div>
      </div>
    </>
  );
}

function CatalogPreview() {
  return (
    <>
      <div className="text-[11px] font-bold uppercase tracking-widest text-ink-2 dark:text-dark-ink-2">
        Catálogo de tipos
      </div>
      <div className="mt-3 grid gap-2.5">
        {[
          { code: "TI-01", name: "Obra civil", q: 24 },
          { code: "TI-04", name: "Altura", q: 18 },
          { code: "TI-06", name: "Distribución", q: 32 },
        ].map((t) => (
          <div
            key={t.code}
            className="flex items-center gap-3 rounded-[12px] border border-hairline bg-bg-2 p-3 dark:border-hairline-dark dark:bg-white/[0.03]"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-grad-info text-white">
              <ShieldCheck size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[11px] font-bold text-ink-2 dark:text-dark-ink-2">
                {t.code}
              </div>
              <div className="text-[14px] font-semibold">{t.name}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-ink-2 dark:text-dark-ink-2">
                Preguntas
              </div>
              <div className="text-[15px] font-bold">{t.q}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[12px] border border-dashed border-hairline bg-bg-2 p-4 text-center text-[12px] text-ink-2 dark:border-hairline-dark dark:bg-white/[0.03] dark:text-dark-ink-2">
        Puedes añadir más tipos desde Administración cuando lo necesites.
      </div>
    </>
  );
}

function MobilePreview() {
  return (
    <>
      <div className="text-[11px] font-bold uppercase tracking-widest text-ink-2 dark:text-dark-ink-2">
        App móvil para campo
      </div>
      <div className="mt-3 grid gap-2.5">
        {[
          {
            icon: Smartphone,
            title: "Modo offline",
            body: "Inspecciona sin conexión. Los datos se sincronizan al recuperar señal.",
          },
          {
            icon: CheckCircle2,
            title: "Fotos y firmas",
            body: "Captura evidencia y recoge firmas digitalmente desde el móvil.",
          },
          {
            icon: Sparkles,
            title: "Plantillas inteligentes",
            body: "Las preguntas se cargan según el tipo de inspección seleccionado.",
          },
        ].map((feat, i) => (
          <div
            key={i}
            className="flex gap-3 rounded-[12px] border border-hairline bg-bg-2 p-3 dark:border-hairline-dark dark:bg-white/[0.03]"
          >
            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-grad-brand text-white">
              <feat.icon size={16} />
            </div>
            <div>
              <div className="text-[14px] font-semibold">{feat.title}</div>
              <div className="text-[12px] leading-relaxed text-ink-2 dark:text-dark-ink-2">
                {feat.body}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[12px] border border-[rgba(47,158,106,0.28)] bg-[rgba(47,158,106,0.10)] p-4">
        <div className="text-[13px] font-bold text-[#1F7A50]">
          Disponible para iOS y Android
        </div>
        <div className="mt-1 text-[11px] text-ink-2 dark:text-dark-ink-2">
          Tu equipo recibirá el enlace de instalación tras finalizar la
          configuración.
        </div>
      </div>
    </>
  );
}
