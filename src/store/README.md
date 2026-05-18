# 🏪 Sistema de Stores con Zustand

Sistema de manejo de estado global implementado con Zustand para la aplicación Self-Inspection.

## 📦 Stores Disponibles

### 1. **authStore** - Autenticación

Maneja la autenticación de usuarios, tokens y sesiones.

```typescript
import { useAuthStore } from "@/store";

const user = useAuthStore((state) => state.user);
const login = useAuthStore((state) => state.login);
const logout = useAuthStore((state) => state.logout);
```

### 2. **themeStore** - Tema

Gestiona el tema de la aplicación (light/dark/system).

```typescript
import { useThemeStore } from "@/store";

const theme = useThemeStore((state) => state.theme);
const isDark = useThemeStore((state) => state.isDark);
const setTheme = useThemeStore((state) => state.setTheme);
```

### 3. **errorStore** - Errores

Sistema centralizado de manejo de errores.

```typescript
import { useErrorStore } from "@/store";

const errors = useErrorStore((state) => state.errors);
const pushError = useErrorStore((state) => state.pushError);
```

### 4. **appStore** - Estado General

Estado global de la aplicación y notificaciones.

```typescript
import { useAppStore } from "@/store";

const isLoading = useAppStore((state) => state.isLoading);
const addNotification = useAppStore((state) => state.addNotification);
```

## 🚀 Inicio Rápido

### Usar un store en un componente

```tsx
"use client";

import { useAuthStore, useThemeStore } from "@/store";

export function MyComponent() {
  // Selectores (solo re-render cuando cambia lo que usas)
  const user = useAuthStore((state) => state.user);
  const isDark = useThemeStore((state) => state.isDark);

  return (
    <div className={isDark ? "dark" : "light"}>
      <h1>Hola, {user?.firstName}!</h1>
    </div>
  );
}
```

### Usar acciones

```tsx
"use client";

import { useAuthStore, useAppStore } from "@/store";

export function LoginButton() {
  const login = useAuthStore((state) => state.login);
  const addNotification = useAppStore((state) => state.addNotification);

  const handleLogin = async () => {
    try {
      await login("email@example.com", "password");
      addNotification({
        message: "¡Login exitoso!",
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

## 📱 Compatibilidad

- ✅ Next.js 14 (SPA mode)
- ✅ Capacitor iOS
- ✅ Capacitor Android
- ✅ Web Browsers
- ✅ TypeScript

## 🔧 Características

- **Persistencia automática**: Token y tema se guardan en localStorage
- **Re-renders optimizados**: Solo se actualizan los componentes que usan los valores que cambiaron
- **TypeScript**: Tipado completo
- **DevTools**: Integración con Redux DevTools
- **Sin boilerplate**: No necesitas Providers ni Context

## 📚 Documentación

- [Guía de Migración](./ZUSTAND_MIGRATION_GUIDE.md) - Cómo migrar de Context API a Zustand
- [Ejemplos](./src/components/examples/ZustandExample.tsx) - Ejemplos de uso

## 🎯 Best Practices

### ✅ Hacer

```tsx
// Usar selectores específicos
const user = useAuthStore((state) => state.user);
const login = useAuthStore((state) => state.login);

// Crear selectores reutilizables
const selectUserName = (state) =>
  state.user ? `${state.user.firstName} ${state.user.lastName}` : "";
```

### ❌ No Hacer

```tsx
// Evitar desestructuración completa (causa re-renders innecesarios)
const { user, token, isLoading, isAuthenticated } = useAuthStore();

// Evitar acceder a todo el store
const authStore = useAuthStore();
```

## 🔄 Migración desde Context API

El proyecto mantiene ambos sistemas (Context API y Zustand) funcionando en paralelo para permitir una migración gradual.

```tsx
// Viejo (Context API)
import { useAuth } from "@/contexts/AuthContext";
const { user, login } = useAuth();

// Nuevo (Zustand)
import { useAuthStore } from "@/store";
const user = useAuthStore((state) => state.user);
const login = useAuthStore((state) => state.login);
```

Ver [Guía de Migración Completa](./ZUSTAND_MIGRATION_GUIDE.md) para más detalles.

## 🐛 Debugging

```typescript
// Ver estado actual
console.log(useAuthStore.getState());

// Suscribirse a cambios
useAuthStore.subscribe((state) => {
  console.log("Estado cambió:", state);
});
```

## 📊 Estructura de Archivos

```
frontend/src/store/
├── index.ts           # Exportaciones principales
├── authStore.ts       # Store de autenticación
├── themeStore.ts      # Store de tema
├── errorStore.ts      # Store de errores
└── appStore.ts        # Store de app
```

## 🔐 Seguridad

- El token se persiste en `localStorage` (igual que con Context API)
- No se persiste información sensible del usuario
- Compatible con HttpOnly cookies (requiere cambios en backend)

## 📈 Performance

Zustand es extremadamente ligero:

- Bundle size: ~1.3KB gzipped
- No virtual DOM overhead
- Re-renders selectivos automáticos
- Sin Context API nesting issues

## 🤝 Contribuir

Al agregar nuevo estado global:

1. Crear el store en `src/store/[nombre]Store.ts`
2. Exportarlo en `src/store/index.ts`
3. Agregar tipos TypeScript completos
4. Documentar en este README
5. Agregar ejemplos si es complejo

## 📝 Licencia

Este proyecto es privado y confidencial.
