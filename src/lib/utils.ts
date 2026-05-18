import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AVATAR_COLORS = [
  "#F44336", // red
  "#E91E63", // pink
  "#9C27B0", // purple
  "#673AB7", // deep purple
  "#3F51B5", // indigo
  "#2196F3", // blue
  "#03A9F4", // light blue
  "#00BCD4", // cyan
  "#009688", // teal
  "#4CAF50", // green
  "#8BC34A", // light green
  "#CDDC39", // lime
  "#FFEB3B", // yellow
  "#FFC107", // amber
  "#FF9800", // orange
  "#FF5722", // deep orange
  "#795548", // brown
  "#9E9E9E", // gray
  "#607D8B", // blue gray
];

export function getAvatarColor(username: string): string {
  if (!username) return AVATAR_COLORS[0];

  // Limit the username length to 15 characters for consistency
  const limitedUsername = username.slice(0, 15);

  // Calculate a consistent index based on the username
  const hash = limitedUsername
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export const getFullImageUrl = (relativeUrl: string) => {
  if (!relativeUrl) return null;
  // si comienza con data:image, devuélvelo tal cual
  if (relativeUrl.startsWith("data:image")) return relativeUrl;
  // Si la URL ya es absoluta, devuélvela tal cual
  if (relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")) {
    return relativeUrl;
  }
  // Si no, añade el dominio del bucket de imágenes (S3)
  const imagesBase =
    process.env.NEXT_PUBLIC_IMAGES_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8000/";
  const base = imagesBase.endsWith("/") ? imagesBase : `${imagesBase}/`;
  const path = relativeUrl.startsWith("/") ? relativeUrl.slice(1) : relativeUrl;
  return `${base}${path}`;
};

export const showUserType = (userType: string) => {
  if (userType === "ADMINISTRADOR") return "Administrador";
  if (userType === "JEFE_DE_OBRA") return "Jefe de Obra";
  if (userType === "TECNICO") return "Técnico";
  if (userType === "JEFE_DE_TRABAJO") return "Jefe de Trabajo";
};

// Función para extraer iniciales mayúsculas
export const getInitials = (name: string): string => {
  return name
    .split(/\s+/) // Dividir por espacios
    .map((word) => word.charAt(0)) // Tomar la primera letra de cada palabra
    .filter((char) => char === char.toUpperCase()) // Filtrar solo mayúsculas
    .join(""); // Unir las iniciales
};
