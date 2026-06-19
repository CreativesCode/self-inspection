import type { Metadata } from "next";
import ForgotPasswordPageClient from "./ForgotPasswordPageClient";

export const metadata: Metadata = {
    title: "Recuperar contraseña",
    description: "Te enviaremos un enlace para restablecer tu contraseña",
};

export default function ForgotPasswordPage() {
    return <ForgotPasswordPageClient />;
}
