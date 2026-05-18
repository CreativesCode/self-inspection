import type { Metadata } from "next";
import { Suspense } from "react";
import EditInspectionTypePageClient from "./EditInspectionTypePageClient";

export const metadata: Metadata = {
  title: "Editar Tipo de Inspección",
  description: "Editar los detalles de un tipo de inspección existente",
};

export default function EditInspectionTypePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <EditInspectionTypePageClient />
    </Suspense>
  );
}
