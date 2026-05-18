import { Metadata } from "next";
import { Suspense } from "react";
import EvaluationsDashboard from "./EvaluationsDashboard";

export const metadata: Metadata = {
  title: "Evaluaciones",
  description: "Dashboard de evaluaciones por usuario",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <EvaluationsDashboard />
    </Suspense>
  );
}
