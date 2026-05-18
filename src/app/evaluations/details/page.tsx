import { Metadata } from "next";
import { Suspense } from "react";
import EvaluationsDetailPageClient from "./EvaluationsDetailPageClient";

export const metadata: Metadata = {
  title: "Detalles de Evaluación",
  description: "Ver detalles de evaluaciones de un usuario",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <EvaluationsDetailPageClient />
    </Suspense>
  );
}
