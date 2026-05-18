import type { Metadata } from "next";
import { Suspense } from "react";
import EditQuestionPageClient from "./EditQuestionPageClient";

export const metadata: Metadata = {
  title: "Editar Pregunta",
  description: "Editar los detalles de una pregunta existente",
};

export default function EditQuestionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <EditQuestionPageClient />
    </Suspense>
  );
}
