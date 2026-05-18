import type { Metadata } from "next";
import { Suspense } from "react";
import EditClientPageClient from "./EditClientPageClient";

export const metadata: Metadata = {
  title: "Editar Cliente",
  description: "Editar los detalles de un cliente existente",
};

export default function EditClientPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <EditClientPageClient />
    </Suspense>
  );
}
