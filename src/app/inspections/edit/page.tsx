import type { Metadata } from "next";
import { Suspense } from "react";
import EditInspectionPageClient from "./EditInspectionPageClient";

export const metadata: Metadata = {
  title: "Editar Inspección",
  description: "Editar los datos de la inspección",
};

export default function EditInspectionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <EditInspectionPageClient />
    </Suspense>
  );
}
