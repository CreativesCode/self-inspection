import type { Metadata } from "next";
import { Suspense } from "react";
import InspectionDetailsPageClient from "./InspectionDetailsPageClient";

export const metadata: Metadata = {
  title: "Detalles de Inspección",
  description: "Ver detalles completos de la inspección",
};

export default function InspectionDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <InspectionDetailsPageClient />
    </Suspense>
  );
}
