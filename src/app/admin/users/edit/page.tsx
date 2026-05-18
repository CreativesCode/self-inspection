import type { Metadata } from "next";
import { Suspense } from "react";
import EditUserPageClient from "./EditUserPageClient";

export const metadata: Metadata = {
  title: "Editar Usuario",
  description: "Editar los detalles de un usuario existente",
};

export default function EditUserPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <EditUserPageClient />
    </Suspense>
  );
}
