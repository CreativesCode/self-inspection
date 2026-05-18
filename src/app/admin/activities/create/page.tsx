import type { Metadata } from "next";
import CreateActivityPageClient from "./CreateActivityPageClient";

export const metadata: Metadata = {
  title: "Crear Actividad",
  description: "Crear una nueva actividad en el sistema",
};

export default function CreateActivityPage() {
  return <CreateActivityPageClient />;
}
