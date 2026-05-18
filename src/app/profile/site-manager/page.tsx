import type { Metadata } from "next";
import SiteManagerProfilePageClient from "./SiteManagerProfilePageClient";

export const metadata: Metadata = {
  title: "Perfil",
  description:
    "Panel del jefe de obra - Gestiona tus trabajadores e inspecciones",
};

export default function SiteManagerProfilePage() {
  return <SiteManagerProfilePageClient />;
}
