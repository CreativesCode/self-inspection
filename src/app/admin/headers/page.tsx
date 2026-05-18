import type { Metadata } from "next";
import HeadersManagementPageClient from "./HeadersManagementPageClient";

export const metadata: Metadata = {
  title: "Gestión de Headers",
  description: "Administra los headers y preguntas del sistema",
};

export default function HeadersManagementPage() {
  return <HeadersManagementPageClient />;
}
