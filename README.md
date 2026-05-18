# Self Inspection — Safe 360

Aplicación de inspecciones de seguridad construida sobre **Next.js** (web + Capacitor para móvil) con **Supabase** como backend completo (Postgres + Auth + Storage + Edge Functions + Realtime).

Tras la migración de octubre 2025, el stack Django + Celery + Redis quedó obsoleto. El repositorio ahora es un único monorepo: cliente y configuración de backend (migraciones SQL, Edge Functions, RLS) viven juntos.

## Stack

- **Frontend**: Next.js 14 (App Router) en modo SSG (`output: 'export'`), Tailwind, Zustand.
- **Móvil**: Capacitor (iOS + Android) consumiendo el mismo build estático.
- **Backend**: Supabase
  - Postgres con RLS por rol (`administrador` / `jefe_de_obra` / `tecnico` / `jefe_de_trabajo`).
  - GoTrue Auth (login email/password, password reset).
  - Storage (`media` y `reports` públicos con paths UUID).
  - Edge Functions Deno (`admin-create-user`, `admin-delete-user`).
  - Realtime para notificaciones (sin polling).
  - PDF de informes generado 100% en cliente con `@react-pdf/renderer`.

## Estructura del repo

```
.
├── src/                 # Aplicación Next.js (App Router)
│   ├── app/             # Rutas
│   ├── components/      # UI compartida
│   ├── hooks/           # Custom hooks (useCamera, useNotifications…)
│   ├── lib/
│   │   ├── data/        # Capa de datos contra Supabase
│   │   ├── supabase.ts  # Cliente singleton
│   │   └── apollo-compat.ts  # Shim Apollo → Supabase (compat. UI legacy)
│   ├── store/           # Zustand stores
│   └── types/database.types.ts  # Tipos auto-generados de la BD
├── supabase/
│   ├── migrations/      # SQL versionado (schema + RLS + triggers + cron)
│   └── functions/       # Edge Functions Deno
├── public/              # Assets estáticos
├── android/  ios/       # Apps nativas Capacitor
├── package.json
└── next.config.js
```

## Setup local

1. **Variables de entorno**

   ```bash
   cp env.example .env.local
   ```

   Edita `.env.local` con las URLs y keys de tu proyecto Supabase (mínimo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

2. **Dependencias**

   ```bash
   npm install
   ```

3. **Dev server**

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

## Scripts útiles

- `npm run dev` — Next dev server.
- `npm run build` — build estático en `out/`.
- `npm run build:mobile` — build + `cap sync` para Android/iOS.
- `npx tsc --noEmit` — type-check sin emitir.

## Trabajar con Supabase

Las migraciones se versionan en `supabase/migrations/`. Para aplicarlas al proyecto remoto:

```bash
supabase link --project-ref <tu-ref>
supabase db push --linked
```

Las Edge Functions se despliegan con:

```bash
supabase functions deploy <nombre> --project-ref <tu-ref>
```

Los tipos TypeScript de la BD se regeneran tras cambios de schema:

```bash
supabase gen types typescript --project-id <tu-ref> > src/types/database.types.ts
```

## Despliegue

El build de Next produce un sitio estático en `out/` que puede servirse desde cualquier CDN. La app móvil se compila vía Capacitor (`npm run build:mobile`).

## Licencia

MIT — ver [LICENSE](LICENSE).
