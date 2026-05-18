"use client";

import { usePathname } from "next/navigation";
import { HeaderBar } from "./HeaderBar";
import { MobileHeader } from "./MobileHeader";
import { MobileTabBar } from "./MobileTabBar";

/**
 * Rutas en las que TODO el chrome (HeaderBar + MobileTabBar) se oculta —
 * pantallas que ocupan viewport completo (login, onboarding).
 */
const FULLSCREEN_ROUTES = ["/login", "/onboarding"];

/**
 * Rutas en las que solo se oculta la MobileTabBar para que la página
 * pueda renderizar su propia bottom-bar pegada (encuesta, cámara,
 * bottom-sheets nativos). El HeaderBar de desktop sigue visible.
 */
const MOBILE_TABBAR_HIDDEN_ROUTES = [
  "/inspections/questions",
  "/inspections/create",
  "/inspections/edit",
];

function matchesAny(pathname: string, routes: string[]): boolean {
  return routes.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
}

/**
 * AppChrome — monta HeaderBar (desktop) + MobileTabBar (móvil) y los
 * oculta en rutas fullscreen. Renderlo una sola vez en RootLayoutContent.
 */
export function AppChrome() {
  const pathname = usePathname();
  if (!pathname) return null;

  const isFullscreen = matchesAny(pathname, FULLSCREEN_ROUTES);
  if (isFullscreen) return null;

  const hideMobileTabBar = matchesAny(pathname, MOBILE_TABBAR_HIDDEN_ROUTES);

  return (
    <>
      <HeaderBar />
      <MobileHeader />
      {!hideMobileTabBar && <MobileTabBar />}
    </>
  );
}
