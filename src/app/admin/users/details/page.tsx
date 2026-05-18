import type { Metadata } from "next";
import { Suspense } from "react";
import UserDetailsPageClient from "./UserDetailsPageClient";

export const metadata: Metadata = {
  title: "Detalles de Usuario",
  description: "Ver detalles completos del usuario",
};

export default function UserDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <UserDetailsPageClient />
    </Suspense>
  );
}
