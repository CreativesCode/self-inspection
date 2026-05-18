"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GradientBorder } from "@/components/ui/GradientBorder";
import { Logo } from "@/components/ui/Logo";
import { Pill } from "@/components/ui/Pill";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";
import {
  ArrowRight,
  BarChart3,
  Camera,
  Check,
  ClipboardList,
  FileDown,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

const HERO_PREVIEW_STATS = [
  { k: "Cumplimiento", v: "94%" },
  { k: "Observaciones", v: "3" },
  { k: "Preguntas", v: "42 / 42" },
  { k: "Tiempo", v: "26 min" },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Auto-inspecciones",
    desc:
      "Checklists digitales por tipo de instalación. Captura fotos, GPS y observaciones desde el móvil.",
    grad: "bg-grad-brand",
  },
  {
    icon: BarChart3,
    title: "Ranking & evaluaciones",
    desc:
      "Dashboards y rankings para comparar desempeño entre técnicos, obras y clientes.",
    grad: "bg-grad-info",
  },
  {
    icon: Users,
    title: "Gestión de equipos",
    desc:
      "Coordina jefes de obra, técnicos e inspectores con permisos y trazabilidad completa.",
    grad: "bg-grad-ok",
  },
];

const KPIS = [
  { v: "1,284", l: "Inspecciones / mes", d: "promedio últimos 90d" },
  { v: "98.4%", l: "Cobertura checklist", d: "preguntas respondidas" },
  { v: "38", l: "Inspectores activos", d: "en 8 obras" },
  { v: "26m", l: "Tiempo medio", d: "por inspección" },
];

const ABOUT_BULLETS = [
  "Digitaliza inspecciones de seguridad en subestaciones, plantas y obras.",
  "Genera reportes inteligentes y análisis de tendencias para mejora continua.",
  "Coordina equipos, asigna responsabilidades y asegura la trazabilidad.",
  "Cumple los más altos estándares de calidad y seguridad del sector.",
];

const STEPS = [
  {
    n: "01",
    icon: ClipboardList,
    title: "Crea la inspección",
    desc:
      "Selecciona obra, tipo TI y actividades. El checklist correcto se monta solo.",
  },
  {
    n: "02",
    icon: Camera,
    title: "Captura en campo",
    desc:
      "Respuestas con emoji, fotos, GPS y notas. Funciona sin conexión.",
  },
  {
    n: "03",
    icon: BarChart3,
    title: "Reporta y evalúa",
    desc:
      "PDF automático, ranking en tiempo real y tendencias por obra y cliente.",
  },
];

const CLIENT_LOGOS = [
  "Iberdrola",
  "Endesa",
  "Naturgy",
  "Repsol",
  "Cepsa",
  "ACS",
  "Enagás",
  "Red Eléctrica",
];

export default function Home() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const { isDark } = useTheme();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg dark:bg-dark-bg">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      {/* Atmosphere — radiales decorativos */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(800px 400px at 80% -10%, rgba(var(--accent-rgb),0.18), transparent 60%), radial-gradient(600px 400px at 0% 50%, rgba(247,140,124,0.08), transparent 60%)"
            : "radial-gradient(900px 480px at 85% -10%, rgba(247,140,124,0.30), transparent 60%), radial-gradient(700px 460px at -5% 30%, rgba(var(--accent-rgb),0.08), transparent 60%)",
        }}
      />

      <main className="relative mx-auto max-w-[1280px] px-6 pb-20 pt-14 sm:px-8">
        {/* ─── HERO ─── */}
        <section className="mb-16 grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(var(--accent-rgb),0.24)] bg-[rgba(var(--accent-rgb),0.08)] px-3 py-1.5 text-xs font-semibold text-primary-500">
              <Sparkles size={12} /> Novedad · Reportes inteligentes v2
            </span>
            <h1 className="m-0 text-4xl font-extrabold leading-[1.02] tracking-tightest sm:text-5xl lg:text-[68px]">
              Auto-inspección{" "}
              <span className="text-grad-brand">de la mano de la obra.</span>
            </h1>
            <p className="mt-5 max-w-[560px] text-base leading-[1.55] text-ink-2 dark:text-dark-ink-2 sm:text-[19px]">
              Captura, evalúa y reporta — todo en un mismo lugar. La plataforma
              que <b className="text-ink dark:text-dark-ink">360 Ingeco</b> usa
              para llevar inspecciones de seguridad en subestaciones, plantas y
              obra civil.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                icon={<Plus size={16} />}
                onClick={() => (window.location.href = "/inspections/create")}
              >
                Nueva inspección
              </Button>
              <Link href="/evaluations">
                <Button
                  variant="ghost"
                  size="lg"
                  icon={<BarChart3 size={16} />}
                >
                  Ver evaluaciones
                </Button>
              </Link>
            </div>
          </div>

          {/* Preview card con métricas */}
          <GradientBorder radius={28}>
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="bg-grad-brand inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-white">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold">SE-Bilbao · TI-04</div>
                    <div className="text-xs text-ink-2 dark:text-dark-ink-2">
                      Iberdrola · Trabajos en altura
                    </div>
                  </div>
                </div>
                <Pill tone="ok">
                  <Check size={11} /> Completada
                </Pill>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {HERO_PREVIEW_STATS.map((s) => (
                  <div
                    key={s.k}
                    className="rounded-[14px] border border-hairline bg-bg-2 p-3.5 dark:border-hairline-dark dark:bg-white/[0.03]"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-2 dark:text-dark-ink-2">
                      {s.k}
                    </div>
                    <div className="mt-1 text-[22px] font-extrabold tracking-tight">
                      {s.v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center">
                  {["AM", "JR", "CS"].map((n, i) => (
                    <div key={n} style={{ marginLeft: i ? -8 : 0 }}>
                      <Avatar name={n} size={28} ring />
                    </div>
                  ))}
                  <span className="ml-2.5 text-xs text-ink-2 dark:text-dark-ink-2">
                    Equipo de inspección
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<FileDown size={14} />}
                >
                  PDF
                </Button>
              </div>
            </div>
          </GradientBorder>
        </section>

        {/* ─── FEATURE TRIO ─── */}
        <section className="mb-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} radius={22}>
                <div
                  className={cn(
                    "mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-white",
                    f.grad,
                  )}
                  style={{
                    boxShadow: "0 8px 20px -10px rgba(var(--accent-rgb),0.4)",
                  }}
                >
                  <Icon size={20} />
                </div>
                <h3 className="m-0 text-[19px] font-bold tracking-tight">
                  {f.title}
                </h3>
                <p className="mb-3.5 mt-2 text-sm leading-[1.55] text-ink-2 dark:text-dark-ink-2">
                  {f.desc}
                </p>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-500">
                  Conocer más <ArrowRight size={13} />
                </span>
              </Card>
            );
          })}
        </section>

        {/* ─── STATS STRIP ─── */}
        <section
          className={cn(
            "mb-16 grid grid-cols-2 overflow-hidden rounded-[20px] border border-hairline lg:grid-cols-4",
            "gap-px bg-hairline dark:border-hairline-dark dark:bg-hairline-dark",
          )}
        >
          {KPIS.map((s) => (
            <div
              key={s.l}
              className="bg-surface p-7 dark:bg-dark-surface"
            >
              <div className="text-grad-brand text-[44px] font-extrabold leading-none tracking-tightest">
                {s.v}
              </div>
              <div className="mt-2 text-sm font-bold">{s.l}</div>
              <div className="text-xs text-ink-2 dark:text-dark-ink-2">
                {s.d}
              </div>
            </div>
          ))}
        </section>

        {/* ─── ABOUT ─── */}
        <Card glow radius={28} padding={40}>
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
                Acerca de
              </div>
              <h2 className="m-0 mt-2 text-3xl font-extrabold tracking-tighter sm:text-[40px]">
                ¿Qué es <span className="text-grad-brand">Safe 360</span>?
              </h2>
              <p className="mt-4 text-[15px] leading-[1.6] text-ink-2 dark:text-dark-ink-2">
                La solución digital de{" "}
                <b className="text-ink dark:text-dark-ink">360 Ingeco</b> para
                optimizar la auto-inspección y la gestión de seguridad en
                infraestructuras industriales, subestaciones eléctricas, obra
                civil y proyectos energéticos.
              </p>
            </div>
            <div className="grid gap-3.5">
              {ABOUT_BULLETS.map((p) => (
                <div
                  key={p}
                  className="flex items-start gap-3.5 rounded-[14px] border border-hairline bg-bg-2 p-4 dark:border-hairline-dark dark:bg-white/[0.03]"
                >
                  <div className="bg-grad-brand mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white">
                    <Check size={13} />
                  </div>
                  <p className="m-0 text-sm leading-[1.55]">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ─── CÓMO FUNCIONA ─── */}
        <section className="mb-6 mt-20">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
                Cómo funciona
              </div>
              <h2 className="m-0 mt-2 text-3xl font-extrabold tracking-tighter sm:text-[40px]">
                De la obra al reporte en 3 pasos
              </h2>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.n} radius={22} padding={28}>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-mono text-[13px] font-bold tracking-wider text-primary-500">
                      {s.n}
                    </span>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-hairline bg-bg-2 text-primary-500 dark:border-hairline-dark dark:bg-white/[0.04]">
                      <Icon size={18} />
                    </div>
                  </div>
                  <h3 className="m-0 text-xl font-extrabold tracking-tight">
                    {s.title}
                  </h3>
                  <p className="m-0 mt-2 text-sm leading-[1.55] text-ink-2 dark:text-dark-ink-2">
                    {s.desc}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ─── CASOS DE USO + TESTIMONIAL ─── */}
        <Card radius={28} padding={0} className="mt-6 overflow-hidden">
          <div className="grid lg:grid-cols-[1.2fr_1fr]">
            <div className="p-10">
              <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
                Confían en Safe 360
              </div>
              <h2 className="m-0 mb-4 mt-2 text-3xl font-extrabold tracking-tighter sm:text-[36px]">
                Operadores eléctricos, refinerías y obra civil
              </h2>
              <p className="m-0 text-[15px] leading-[1.6] text-ink-2 dark:text-dark-ink-2">
                Desde mantenimientos programados en subestaciones de alta
                tensión hasta auditorías en plantas químicas — Safe 360 se
                adapta al tipo de instalación con checklists, permisos y
                trazabilidad propios.
              </p>

              <div className="mt-7 flex gap-7">
                {[
                  { k: "8", l: "Sectores" },
                  { k: "23", l: "Clientes activos" },
                  { k: "184", l: "Inspectores" },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="text-[28px] font-extrabold tracking-tight">
                      {s.k}
                    </div>
                    <div className="text-xs text-ink-2 dark:text-dark-ink-2">
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-2">
                {CLIENT_LOGOS.map((c) => (
                  <span
                    key={c}
                    className="rounded-xl border border-hairline bg-bg-2 px-3.5 py-2.5 text-[13px] font-bold tracking-tight dark:border-hairline-dark dark:bg-white/[0.04]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="flex flex-col justify-between border-t border-hairline p-10 lg:border-l lg:border-t-0 dark:border-hairline-dark"
              style={{
                background: isDark
                  ? "radial-gradient(120% 80% at 100% 0%, rgba(var(--accent-rgb),0.15), transparent 60%), #1E1815"
                  : "radial-gradient(120% 80% at 100% 0%, rgba(var(--accent-rgb),0.10), transparent 60%), #FDE9E5",
              }}
            >
              <div className="bg-grad-brand inline-flex h-11 w-11 items-center justify-center rounded-xl font-serif text-2xl font-extrabold leading-none text-white">
                &ldquo;
              </div>
              <blockquote className="m-0 text-xl font-semibold leading-[1.35] tracking-tight sm:text-[22px]">
                Pasamos de 4 horas de papel por inspección a{" "}
                <span className="text-grad-brand">
                  26 minutos en el móvil
                </span>{" "}
                — con reporte y trazabilidad automáticos.
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <Avatar name="MV" size={44} />
                <div>
                  <div className="text-sm font-bold">Marc Vidal Soler</div>
                  <div className="text-xs text-ink-2 dark:text-dark-ink-2">
                    Jefe de obra · Iberdrola Distribución
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ─── CTA FINAL ─── */}
        <div className="mt-16">
          <GradientBorder radius={28}>
            <div
              className="grid items-center gap-8 p-12 lg:grid-cols-[1.5fr_1fr]"
              style={{
                background: isDark
                  ? "radial-gradient(80% 120% at 0% 0%, rgba(var(--accent-rgb),0.25), transparent 60%), radial-gradient(60% 100% at 100% 100%, rgba(247,140,124,0.10), transparent 60%), #1E1815"
                  : "radial-gradient(80% 120% at 0% 0%, rgba(var(--accent-rgb),0.12), transparent 60%), radial-gradient(70% 100% at 100% 100%, rgba(247,140,124,0.30), transparent 60%), #FFF",
                borderRadius: 27,
              }}
            >
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
                  Empieza hoy
                </div>
                <h2 className="m-0 mb-3.5 mt-2.5 text-3xl font-extrabold leading-[1.05] tracking-tightest sm:text-[44px]">
                  Tu próxima inspección,{" "}
                  <span className="text-grad-brand">en una pantalla.</span>
                </h2>
                <p className="m-0 max-w-[540px] text-base leading-[1.55] text-ink-2 dark:text-dark-ink-2">
                  Solicita acceso para tu obra o conéctate con tu cuenta
                  corporativa. Safe 360 funciona en navegador y como app nativa
                  en iOS y Android.
                </p>
              </div>
              <div className="flex flex-col items-start gap-3">
                <Link href="/login">
                  <Button size="lg" icon={<ArrowRight size={16} />}>
                    Solicitar acceso
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="lg"
                    icon={<ShieldCheck size={14} />}
                  >
                    Iniciar sesión
                  </Button>
                </Link>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Pill>iOS</Pill>
                  <Pill>Android</Pill>
                  <Pill>Web</Pill>
                  <Pill tone="ok">
                    <Check size={10} /> Offline-first
                  </Pill>
                </div>
              </div>
            </div>
          </GradientBorder>
        </div>
      </main>

      {/* ─── FOOTER (siempre dark) ─── */}
      <footer className="relative mt-20 bg-[#1B1614] px-6 pb-7 pt-14 text-[#E8DFD9] sm:px-8">
        <div className="mx-auto max-w-[1280px]">
          <div className="flex flex-col items-center gap-4 text-center">
            <Logo size={36} />
            <p className="max-w-[420px] text-[13px] leading-[1.6] text-[#A89F99]">
              La plataforma digital de 360 Ingeco para la auto-inspección y la
              gestión de seguridad en infraestructuras industriales y
              energéticas.
            </p>
          </div>
          <div className="mx-auto my-8 h-px w-full max-w-[420px] bg-white/10" />
          <div className="text-center text-xs text-[#8C837E]">
            © 2026 Safe 360 · 360 Ingeco · Todos los derechos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}
