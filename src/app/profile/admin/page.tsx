import type { Metadata } from "next";
import AdminProfilePageClient from "./AdminProfilePageClient";

export const metadata: Metadata = {
  title: "Perfil",
  description: "Panel de administrador - Gestiona el sistema y los usuarios",
};

export default function AdminProfilePage() {
  return <AdminProfilePageClient />;
}
