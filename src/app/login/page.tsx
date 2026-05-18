import type { Metadata } from "next";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Iniciar Sesión",
  description: "Accede a tu cuenta de Safe 360",
};

export default function LoginPage() {
  return <LoginPageClient />;
}
