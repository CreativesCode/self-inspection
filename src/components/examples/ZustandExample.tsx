/**
 * Ejemplo de componente migrado de Context API a Zustand
 *
 * Este archivo muestra la diferencia entre usar Context API y Zustand
 * para el mismo componente de ejemplo.
 */

/* ============================================================================
   VERSIÓN CON CONTEXT API (Antigua)
   ============================================================================ */

/*
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useApp } from "@/contexts/AppContext";
import { useState } from "react";

export function LoginFormOld() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Context API - Todos los componentes se re-renderizan cuando cambia cualquier valor
  const { user, login, logout, isLoading } = useAuth();
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
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className={isDark ? "text-gray-300" : "text-gray-700"}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-primary"
        />
      </div>
      <div>
        <label htmlFor="password" className={isDark ? "text-gray-300" : "text-gray-700"}>
          Password
        </label>
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-primary"
        />
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Cargando..." : "Iniciar Sesión"}
      </button>
    </form>
  );
}
*/

/* ============================================================================
   VERSIÓN CON ZUSTAND (Nueva) ✅
   ============================================================================ */

"use client";

import { useAppStore, useAuthStore, useThemeStore } from "@/store";
import { useState } from "react";

export function LoginFormNew() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword] = useState(false);

  // Zustand con selectores - Solo se re-renderiza cuando cambian estos valores específicos
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const addNotification = useAppStore((state) => state.addNotification);
  const isDark = useThemeStore((state) => state.isDark);

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
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className={isDark ? "text-gray-300" : "text-gray-700"}
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-primary"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className={isDark ? "text-gray-300" : "text-gray-700"}
        >
          Password
        </label>
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-primary"
        />
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Cargando..." : "Iniciar Sesión"}
      </button>
    </form>
  );
}

/* ============================================================================
   VENTAJAS DE LA VERSIÓN CON ZUSTAND
   ============================================================================ 

   1. PERFORMANCE:
      - Context API: Se re-renderiza cuando cambia CUALQUIER valor del contexto
      - Zustand: Solo se re-renderiza cuando cambian los valores específicos que usa
   
   2. BOILERPLATE:
      - Context API: Necesitas Provider, Context, Hook
      - Zustand: Solo el store
   
   3. IMPORTS:
      - Context API: 3 imports de contextos
      - Zustand: 1 import del store
   
   4. CÓDIGO MÁS LIMPIO:
      - Selectores explícitos
      - No necesitas desestructuración
      - Menos nesting de Providers
   
   5. FUERA DE COMPONENTES:
      - Context API: Solo funciona dentro de componentes
      - Zustand: Puedes usar getState() en cualquier lugar
   
   6. DEVTOOLS:
      - Context API: No incluidas
      - Zustand: Integradas

   7. PERSISTENCIA:
      - Context API: Manual con useEffect
      - Zustand: Nativa con middleware

   ============================================================================ */

/* ============================================================================
   EJEMPLO DE USO AVANZADO
   ============================================================================ */

// 1. Selectores con transformación
export function UserGreeting() {
  // Crea un selector que transforma el estado
  const userName = useAuthStore((state) =>
    state.user ? `${state.user.firstName} ${state.user.lastName}` : "Invitado"
  );

  return <h1>Hola, {userName}!</h1>;
}

// 2. Múltiples selectores optimizados
export function UserDashboard() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore(
    (state) => state.user?.isSuperuser || state.user?.isStaff
  );
  const logout = useAuthStore((state) => state.logout);

  if (!user) return <div>No autenticado</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      {isAdmin && <AdminPanel />}
      <button onClick={logout}>Cerrar Sesión</button>
    </div>
  );
}

// 3. Uso fuera de componentes React
export async function checkAuthInService() {
  // Acceder al estado sin hooks
  const { isAuthenticated, user } = useAuthStore.getState();

  if (!isAuthenticated) {
    throw new Error("No autenticado");
  }

  return user;
}

// 4. Suscripción a cambios
export function setupAuthListener() {
  // Ejecutar callback cuando cambia el estado
  const unsubscribe = useAuthStore.subscribe((state) => {
    console.log("Auth state changed:", state.user);
  });

  // Retornar función de cleanup
  return unsubscribe;
}

// 5. Selector con comparación personalizada
export function UserProfile() {
  // Solo re-renderiza si firstName o lastName cambian
  const firstName = useAuthStore((state) => state.user?.firstName);
  const lastName = useAuthStore((state) => state.user?.lastName);

  return (
    <div>
      {firstName} {lastName}
    </div>
  );
}

// Alternativa con shallow (requiere import adicional)
/*
import { shallow } from 'zustand/shallow';

export function UserProfileWithShallow() {
  const { firstName, lastName } = useAuthStore(
    state => ({
      firstName: state.user?.firstName || '',
      lastName: state.user?.lastName || '',
    }),
    shallow
  ) as { firstName: string; lastName: string };

  return <div>{firstName} {lastName}</div>;
}
*/

// Componente dummy para el ejemplo
function AdminPanel() {
  return <div>Panel de administración</div>;
}
