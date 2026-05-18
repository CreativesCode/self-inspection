import { Metadata } from "next";
import InspectionTypesManagementPageClient from "./InspectionTypesManagementPageClient";

export const metadata: Metadata = {
  title: "Gestión de Tipos de Inspección",
};

export default function InspectionTypesManagementPage() {
  return <InspectionTypesManagementPageClient />;
}
