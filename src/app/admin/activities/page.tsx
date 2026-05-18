import { Metadata } from "next";
import ActivitiesManagementPageClient from "./ActivitiesManagementPageClient";

export const metadata: Metadata = {
  title: "Gestión de Actividades",
};

export default function ActivitiesManagementPage() {
  return <ActivitiesManagementPageClient />;
}
