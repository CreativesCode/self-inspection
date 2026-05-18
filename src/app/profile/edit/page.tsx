import type { Metadata } from "next";
import EditProfilePageClient from "./EditProfilePageClient";

export const metadata: Metadata = {
  title: "Editar Perfil",
  description: "Edita tu información personal y configuraciones de perfil",
};

export default function EditProfilePage() {
  return <EditProfilePageClient />;
}
