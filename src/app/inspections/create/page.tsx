import type { Metadata } from "next";
import CreateInspectionPageClient from "./CreateInspectionPageClient";

export const metadata: Metadata = {
  title: "Crear Inspección",
  description: "Crear una nueva inspección de seguridad",
};

export default function CreateInspectionPage() {
  return <CreateInspectionPageClient />;
}
