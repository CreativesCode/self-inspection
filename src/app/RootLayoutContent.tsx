"use client";

import { BackButtonHandler } from "@/components/BackButtonHandler";
import { KeyboardFocusWrapper } from "@/components/KeyboardFocusWrapper";
import { PasswordChangeGuard } from "@/components/PasswordChangeGuard";
import { ScrollToTopWrapper } from "@/components/ScrollToTopWrapper";
import { FriendlyErrorToast } from "@/components/common/FriendlyErrorToast";
import { AppChrome } from "@/components/layout/AppChrome";
import { useAccent } from "@/contexts/AccentContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthStore } from "@/store";
import dynamic from "next/dynamic";
import NextTopLoader from "nextjs-toploader";

// Importar AuthInitializer dinámicamente sin SSR para evitar problemas con localStorage
const AuthInitializer = dynamic(
  () =>
    import("@/components/auth/AuthInitializer").then((mod) => ({
      default: mod.AuthInitializer,
    })),
  { ssr: false }
);

interface RootLayoutContentProps {
  children: React.ReactNode;
  geistSans: string;
  geistMono: string;
}

export function RootLayoutContent({
  children,
  geistSans,
  geistMono,
}: RootLayoutContentProps) {
  const { isDark, mounted } = useTheme();
  const { palette } = useAccent();
  // Solo reservamos espacio para la MobileTabBar cuando ésta va a renderizar
  // (sólo lo hace si hay usuario logueado). Sin esta condición, en el landing
  // sin sesión queda un hueco de 80px debajo del footer.
  const hasUser = useAuthStore((s) => !!s.user);

  // Usar tokens del design system (bg-bg / dark-bg) en el body para que el
  // color de fondo coincida con el de las páginas interiores y no se vean
  // "filos" con tonos distintos cuando hay padding en wrappers intermedios.
  const themeClass = mounted
    ? isDark
      ? "bg-dark-bg text-dark-ink"
      : "bg-bg text-ink"
    : "bg-bg text-ink";

  // Color del loader según el tema (toma el accent activo)
  const loaderColor = isDark ? palette.shades[500] : palette.gradEnd;

  return (
    <body className={`${geistSans} ${geistMono} antialiased ${themeClass}`}>
      <NextTopLoader
        color={loaderColor}
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow={`0 0 10px ${loaderColor},0 0 5px ${loaderColor}`}
        zIndex={9999}
      />
      <AuthInitializer>
        <PasswordChangeGuard />
        <BackButtonHandler>
          <KeyboardFocusWrapper
            enabled={true}
            offset={20}
            delay={300}
            behavior="smooth"
            headerSelector="header"
          >
            <ScrollToTopWrapper
              scrollOnRouteChange={true}
              scrollOnMount={true}
              delay={300} // Delay más largo para Capacitor
              behavior="smooth"
              excludePaths={[
                // Excluir rutas que no necesitan scroll automático
                "/inspections/questions", // Páginas con formularios largos
                "/admin/questions", // Páginas de administración de preguntas
              ]}
            >
              <AppChrome />
              <FriendlyErrorToast />
              {/* pb-20 sm:pb-0 = espacio para que la MobileTabBar no tape
                  contenido. Solo se aplica si hay usuario (la tabbar solo se
                  monta logueado) para no dejar un hueco bajo el footer del
                  landing en móvil. */}
              <main className={hasUser ? "pb-20 sm:pb-0" : ""}>{children}</main>
            </ScrollToTopWrapper>
          </KeyboardFocusWrapper>
        </BackButtonHandler>
      </AuthInitializer>
    </body>
  );
}
