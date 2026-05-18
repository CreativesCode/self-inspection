import { Metadata } from "next";
import CreateUserPageClient from "./CreateUserPageClient";

export const metadata: Metadata = {
  title: "Crear Usuario",
};

export default function CreateUserPage() {
  return <CreateUserPageClient />;
}
