import { Metadata } from "next";
import ClientsManagementPageClient from "./ClientsManagementPageClient";

export const metadata: Metadata = {
  title: "Gestión de Clientes",
};

export default function ClientsManagementPage() {
  return <ClientsManagementPageClient />;
}
