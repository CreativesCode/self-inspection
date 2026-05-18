import type { Metadata } from "next";
import { Suspense } from "react";
import InspectionsPageClient from "./InspectionsPageClient";

export const metadata: Metadata = {
  title: "Inspecciones",
  description: "Gestiona y visualiza las inspecciones del sistema",
};

export default function InspectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <InspectionsPageClient />
    </Suspense>
  );
}
