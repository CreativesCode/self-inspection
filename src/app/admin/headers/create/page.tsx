import type { Metadata } from "next";
import CreateHeaderPage from "./CreateHeaderPageClient";

export const metadata: Metadata = {
  title: "Crear Header",
  description: "Crea un nuevo header para las preguntas",
};

export default function HeadersManagementPage() {
  return <CreateHeaderPage />;
}
