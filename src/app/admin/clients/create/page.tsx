import { Metadata } from "next";
import CreateClientPageClient from "./CreateClientPageClient";

export const metadata: Metadata = {
  title: "Crear Cliente",
};

export default function CreateClientPage() {
  return <CreateClientPageClient />;
}
