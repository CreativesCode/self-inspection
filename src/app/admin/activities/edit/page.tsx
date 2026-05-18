import type { Metadata } from "next";
import { Suspense } from "react";
import EditActivityPageClient from "./EditActivityPageClient";

export const metadata: Metadata = {
  title: "Editar Actividad",
  description: "Editar los detalles de una actividad existente",
};

export default function EditActivityPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <EditActivityPageClient />
    </Suspense>
  );
}
