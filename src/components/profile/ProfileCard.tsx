"use client";

import { useAuthStore } from "@/store";
import { useTheme } from "@/contexts/ThemeContext";
import { UploadProfilePicture } from "@/graphql/auth";
import {
  GraphQLAppError,
  fromGenericError,
  notifyError,
  processGraphQLErrors,
} from "@/lib/error-service";
import { getAvatarColor, getFullImageUrl } from "@/lib/utils";
import { useMutation } from "@/lib/apollo-compat";
import { Pencil } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

interface UploadProfilePictureResponse {
  uploadProfilePicture: {
    success: boolean;
    profilePictureUrl: string | null;
    errors: GraphQLAppError[] | null;
  };
}

export function ProfileCard() {
  // Zustand con selectores
  const user = useAuthStore((state) => state.user);
  const refetchMe = useAuthStore((state) => state.refetchMe);
  const makeAuthenticatedRequest = useAuthStore((state) => state.makeAuthenticatedRequest);
  const { isDark } = useTheme();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [photoValidationError, setPhotoValidationError] = useState<
    string | null
  >(null);

  const [uploadProfilePicture] =
    useMutation<UploadProfilePictureResponse>(UploadProfilePicture);

  if (!user) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const profilePictureUrl = user.profile?.profilePicture
    ? getFullImageUrl(user.profile.profilePicture)
    : null;

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (file: File): Promise<void> => {
    try {
      setIsUploading(true);
      const base64Image = await convertImageToBase64(file);

      const { data } = await makeAuthenticatedRequest(() =>
        uploadProfilePicture({
          variables: {
            image: base64Image,
            fileName: file.name,
          },
        })
      );

      // Procesar errores de GraphQL si existen
      if (
        data?.uploadProfilePicture?.errors &&
        data.uploadProfilePicture.errors.length > 0
      ) {
        processGraphQLErrors(data.uploadProfilePicture.errors);
        return;
      }

      if (data?.uploadProfilePicture.success) {
        // Limpiar errores de validación
        setPhotoValidationError(null);
        // Actualizar la información del usuario
        await refetchMe();
      }
    } catch (error) {
      notifyError(
        fromGenericError(error, "Error al subir la imagen de perfil")
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Limpiar errores previos
      setPhotoValidationError(null);

      // Constante para el tamaño máximo (10MB en bytes)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

      // Validar tamaño del archivo
      if (file.size > MAX_FILE_SIZE) {
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        setPhotoValidationError(
          `La imagen es demasiado grande (${sizeInMB}MB). El tamaño máximo permitido es 10MB.`
        );
        // Limpiar el input
        if (event.target) {
          event.target.value = "";
        }
        return;
      }

      handleImageUpload(file);
    }
  };

  return (
    <div
      className={`rounded-lg shadow-lg p-6 ${
        isDark ? "bg-gray-800" : "bg-white"
      }`}
    >
      <div className="flex items-center space-x-4">
        <div className="relative group">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          {profilePictureUrl ? (
            <Image
              src={profilePictureUrl}
              alt={`${user.firstName} ${user.lastName}`}
              width={96}
              height={96}
              className="rounded-full object-cover"
              unoptimized
              priority
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{
                backgroundColor: getAvatarColor(
                  `${user.firstName}${user.lastName}`
                ),
              }}
            >
              {getInitials(user.firstName, user.lastName)}
            </div>
          )}
          {/* Overlay de carga */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                <span className="text-white text-xs font-medium">
                  Subiendo...
                </span>
              </div>
            </div>
          )}

          {/* Overlay de edición (solo cuando no está cargando) */}
          {!isUploading && (
            <div
              className="absolute inset-0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-full h-1/2 bg-black/50 rounded-b-full flex items-center justify-center">
                <Pencil className="w-6 h-6 text-white" />
              </div>
            </div>
          )}
        </div>
        <div>
          <h2
            className={`text-2xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {user.firstName} {user.lastName}
          </h2>
          <p
            className={`text-sm ${isDark ? "text-gray-300" : "text-gray-500"}`}
          >
            {user.email}
          </p>
          {isUploading && (
            <p className="text-sm text-blue-500 mt-1 flex items-center space-x-2">
              <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
              <span>Actualizando foto de perfil...</span>
            </p>
          )}
        </div>
      </div>

      {/* Mensaje de error de validación */}
      {photoValidationError && (
        <div
          className={`mt-4 p-3 rounded-md ${
            isDark ? "bg-red-900/50 text-red-200" : "bg-red-100 text-red-700"
          }`}
        >
          <div className="flex items-start space-x-2">
            <span>⚠️</span>
            <div>
              <p className="font-medium">Error de validación:</p>
              <p className="text-sm">{photoValidationError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6">
        <div>
          <h3
            className={`text-sm font-medium ${
              isDark ? "text-gray-300" : "text-gray-500"
            }`}
          >
            Teléfono
          </h3>
          <p className={`mt-1 ${isDark ? "text-white" : "text-gray-900"}`}>
            {user.profile?.phoneNumber || "No proporcionado"}
          </p>
        </div>
        <div>
          <h3
            className={`text-sm font-medium ${
              isDark ? "text-gray-300" : "text-gray-500"
            }`}
          >
            Dirección
          </h3>
          <p className={`mt-1 ${isDark ? "text-white" : "text-gray-900"}`}>
            {user.profile?.address || "No proporcionada"}
          </p>
        </div>
      </div>

      {user.profile?.bio && (
        <div className="mt-6">
          <h3
            className={`text-sm font-medium ${
              isDark ? "text-gray-300" : "text-gray-500"
            }`}
          >
            Biografía
          </h3>
          <p className={`mt-1 ${isDark ? "text-white" : "text-gray-900"}`}>
            {user.profile.bio}
          </p>
        </div>
      )}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => router.push("/profile/edit")}
          className={`button-primary ${
            isDark ? "button-primary-dark" : "button-primary-light"
          }`}
        >
          Editar Perfil
        </button>
      </div>
    </div>
  );
}
