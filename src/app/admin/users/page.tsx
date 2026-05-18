import { Metadata } from "next";
import UsersManagementPageClient from "./UsersManagementPageClient";

export const metadata: Metadata = {
  title: "Gestión de Usuarios",
};

export default function UsersManagementPage() {
  return <UsersManagementPageClient />;
}
