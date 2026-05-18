import type { Metadata } from "next";
import WorkerProfilePageClient from "./WorkerProfilePageClient";

export const metadata: Metadata = {
  title: "Perfil",
  description: "Panel del inspector - Gestiona tu historial de inspecciones",
};

export default function WorkerProfilePage() {
  return <WorkerProfilePageClient />;
}
