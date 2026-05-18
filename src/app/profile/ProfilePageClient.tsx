"use client";

import { useAuthStore } from "@/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePageClient() {
  // Zustand con selectores
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user) {
      switch (user.userType) {
        case "ADMIN":
          router.push("/profile/admin");
          break;
        case "SITE_MANAGER":
          router.push("/profile/site-manager");
          break;
        case "WORKER":
          router.push("/profile/worker");
          break;
        default:
          router.push("/login");
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg text-ink dark:bg-dark-bg dark:text-dark-ink">
      <div className="text-center">
        <div className="text-xs font-bold uppercase tracking-widest text-primary-500">
          Redirigiendo
        </div>
        <h2 className="m-0 mt-1.5 text-2xl font-extrabold tracking-tighter">
          Cargando tu perfil…
        </h2>
      </div>
    </div>
  );
}
