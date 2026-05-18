import type { Metadata } from "next";
import ChangePasswordPageClient from "./ChangePasswordPageClient";

export const metadata: Metadata = {
    title: "Cambiar contraseña",
    description: "Establece tu nueva contraseña",
};

export default function ChangePasswordPage() {
    return <ChangePasswordPageClient />;
}
