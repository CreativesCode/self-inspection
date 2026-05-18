import type { Metadata } from "next";
import CreateQuestionPage from "./CreateQuestionPageClient";

export const metadata: Metadata = {
  title: "Crear Pregunta",
  description: "Crea una nueva pregunta para el sistema",
};

export default function QuestionsManagementPage() {
  return <CreateQuestionPage />;
}
