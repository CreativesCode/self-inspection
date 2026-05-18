import { Metadata } from "next";
import { Suspense } from "react";
import QuestionsPageClient from "./QuestionsPageClient";

export const metadata: Metadata = {
  title: "Preguntas de Inspección",
  description: "Ver las preguntas de una inspección",
};

export default function QuestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <QuestionsPageClient />
    </Suspense>
  );
}
