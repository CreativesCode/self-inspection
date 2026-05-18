# Guía de Scroll Automático al Tope

## Descripción

Este sistema implementa scroll automático al tope de la página cuando se navega entre rutas o cuando se entra a una página por primera vez. Esto asegura que el usuario siempre vea el encabezado y el contenido principal desde el inicio.

## Componentes

### 1. `useScrollToTop` Hook

**Ubicación:** `src/hooks/useScrollToTop.ts`

Hook personalizado que maneja el scroll automático al tope con las siguientes características:

- **Scroll en cambio de ruta:** Se ejecuta automáticamente cuando cambia la URL
- **Scroll en montaje:** Se ejecuta cuando el componente se monta por primera vez
- **Detección automática de contenedor:** Busca automáticamente el contenedor de scroll correcto
- **Configuración flexible:** Permite personalizar delay, comportamiento y selector

#### Uso básico:

```typescript
import { useScrollToTop } from "@/hooks/useScrollToTop";

function MyComponent() {
  useScrollToTop({
    scrollOnRouteChange: true,
    scrollOnMount: true,
    delay: 100,
    behavior: 'smooth'
  });
  
  return <div>Mi contenido</div>;
}
```

#### Opciones disponibles:

- `scrollOnRouteChange`: Hacer scroll cuando cambie la ruta (default: true)
- `scrollOnMount`: Hacer scroll cuando se monte el componente (default: true)
- `scrollContainerSelector`: Selector CSS del contenedor de scroll
- `delay`: Delay en ms antes de hacer scroll (default: 0)
- `behavior`: Comportamiento del scroll - 'smooth' | 'instant' (default: 'smooth')

### 2. `ScrollToTopWrapper` Component

**Ubicación:** `src/components/ScrollToTopWrapper.tsx`

Componente wrapper que maneja el scroll automático a nivel global o por página específica.

#### Características:

- **Configuración global:** Se puede usar en el layout principal
- **Exclusión de rutas:** Permite excluir rutas específicas del scroll automático
- **Configuración flexible:** Todas las opciones del hook están disponibles

#### Uso en layout:

```typescript
<ScrollToTopWrapper
  scrollOnRouteChange={true}
  scrollOnMount={true}
  delay={100}
  behavior="smooth"
  excludePaths={[
    '/inspections/questions', // Formularios largos
    '/admin/questions', // Páginas de administración
  ]}
>
  <Header />
  <main>{children}</main>
</ScrollToTopWrapper>
```

## Implementación Actual

### Configuración Global

El sistema está configurado globalmente en `RootLayoutContent.tsx`:

```typescript
<ScrollToTopWrapper
  scrollOnRouteChange={true}
  scrollOnMount={true}
  delay={100}
  behavior="smooth"
  excludePaths={[
    '/inspections/questions', // Páginas con formularios largos
    '/admin/questions', // Páginas de administración de preguntas
  ]}
>
  <Header />
  <main>{children}</main>
</ScrollToTopWrapper>
```

### Rutas Excluidas

Las siguientes rutas están excluidas del scroll automático:

- `/inspections/questions` - Formularios de preguntas largos
- `/admin/questions` - Páginas de administración de preguntas

Estas rutas se excluyen porque contienen formularios largos donde el usuario puede necesitar mantener su posición de scroll.

## Detección de Contenedor de Scroll

El sistema busca automáticamente el contenedor de scroll correcto en este orden:

1. `[data-scroll-container]` - Contenedor específico marcado
2. `[data-scrollable]` - Contenedor scrolleable marcado
3. `.overflow-auto` - Elementos con overflow automático
4. `.overflow-y-auto` - Elementos con overflow vertical automático
5. `.overflow-scroll` - Elementos con overflow scroll
6. `.overflow-y-scroll` - Elementos con overflow vertical scroll
7. `main` - Elemento main
8. `body` - Elemento body
9. `html` - Elemento html
10. `window` - Ventana del navegador (fallback)

## Comportamiento

### Navegación Normal

Cuando el usuario navega entre páginas usando enlaces o botones:

1. Se detecta el cambio de ruta
2. Se verifica si la ruta está excluida
3. Si no está excluida, se hace scroll al tope con el delay configurado
4. El scroll es suave por defecto

### Redirects

Cuando se hace un redirect programático:

1. Se detecta el cambio de ruta
2. Se aplica el mismo comportamiento que la navegación normal
3. El delay permite que el contenido se renderice antes del scroll

### Montaje de Componente

Cuando un componente se monta por primera vez:

1. Se ejecuta el scroll automático
2. Solo se ejecuta una vez por montaje
3. Se respeta la configuración de exclusión de rutas

## Personalización

### Para una Página Específica

Si necesitas comportamiento diferente en una página específica, puedes usar el hook directamente:

```typescript
import { useScrollToTop } from "@/hooks/useScrollToTop";

function MyPage() {
  useScrollToTop({
    scrollOnRouteChange: false, // Deshabilitar para esta página
    scrollOnMount: true,
    delay: 200, // Delay personalizado
    behavior: 'instant' // Scroll instantáneo
  });
  
  return <div>Mi página</div>;
}
```

### Para Excluir Más Rutas

Modifica el array `excludePaths` en `RootLayoutContent.tsx`:

```typescript
excludePaths={[
  '/inspections/questions',
  '/admin/questions',
  '/mi-nueva-ruta', // Nueva ruta excluida
]}
```

## Ventajas

1. **Experiencia de usuario consistente:** Siempre se ve el encabezado al entrar a una página
2. **Configuración global:** No necesitas agregar código en cada página
3. **Flexibilidad:** Permite personalización por página cuando sea necesario
4. **Detección automática:** Encuentra automáticamente el contenedor de scroll correcto
5. **Exclusión inteligente:** Permite excluir rutas que no necesitan scroll automático
6. **Rendimiento:** Usa delays para evitar conflictos con el renderizado

## Consideraciones

- El delay de 100ms es recomendado para la mayoría de casos
- Las rutas con formularios largos deben estar excluidas
- El comportamiento 'smooth' proporciona mejor experiencia de usuario
- El sistema funciona tanto en navegación normal como en redirects
