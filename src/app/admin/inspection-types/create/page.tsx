import { Metadata } from "next";
import CreateInspectionTypePageClient from "./CreateInspectionTypePageClient";

export const metadata: Metadata = {
  title: "Crear Tipo de Inspección",
};

export default function CreateInspectionTypePage() {
  return <CreateInspectionTypePageClient />;
}
