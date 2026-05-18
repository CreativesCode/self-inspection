import type { Metadata } from "next";
import ProfilePageClient from "./ProfilePageClient";

export const metadata: Metadata = {
  title: "Perfil",
  description: "Gestiona tu perfil y configuraciones",
};

export default function ProfilePage() {
  return <ProfilePageClient />;
}
