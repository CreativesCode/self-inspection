"use client";

import { useAuthStore } from "@/store";
import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/contexts/ThemeContext";
import { fromGenericError, notifyError } from "@/lib/error-service";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "../common/Button";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Zustand con selectores - Solo se re-renderiza cuando cambian estos valores
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { addNotification } = useApp();
  const { isDark } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      addNotification({
        message: "¡Inicio de sesión exitoso!",
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      // Los errores ya son manejados por ErrorContext y Apollo Link
      // Solo notificamos si es un error local no capturado
      if (
        error instanceof Error &&
        !error.message.includes("Error de autenticación")
      ) {
        notifyError(fromGenericError(error, "Error al iniciar sesión"));
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 w-full max-w-md form-container mobile-scroll-container"
    >
      <div className="form-field-mobile">
        <label
          htmlFor="email"
          className={`block text-sm font-medium ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          Correo electrónico
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`input-primary ${
            isDark ? "input-primary-dark" : "input-primary-light"
          }`}
          required
        />
      </div>
      <div className="form-field-mobile">
        <label
          htmlFor="password"
          className={`block text-sm font-medium ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          Contraseña
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`input-primary ${
              isDark
                ? "input-primary-dark"
                : "border-gray-300 bg-white text-gray-900"
            }`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 mt-1"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>
      <Button className="w-full" type="submit" isLoading={isLoading}>
        Iniciar sesión
      </Button>
    </form>
  );
}
