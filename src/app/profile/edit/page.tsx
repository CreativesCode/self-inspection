import type { Metadata } from "next";
import { Suspense } from "react";
import EditProfilePageClient from "./EditProfilePageClient";

export const metadata: Metadata = {
  title: "Editar Perfil",
  description: "Edita tu información personal y configuraciones de perfil",
};

export default function EditProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
        </div>
      }
    >
      <EditProfilePageClient />
    </Suspense>
  );
}
