import type { Metadata } from "next";
import ResetPasswordPageClient from "./ResetPasswordPageClient";

export const metadata: Metadata = {
    title: "Restablecer contraseña",
    description: "Crea tu nueva contraseña",
};

export default function ResetPasswordPage() {
    return <ResetPasswordPageClient />;
}
