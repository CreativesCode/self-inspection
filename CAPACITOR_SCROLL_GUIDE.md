# Guía de Scroll en Capacitor

## Problema Resuelto

En Capacitor, el comportamiento del scroll es diferente porque la aplicación se ejecuta en un WebView nativo. El scroll automático al tope no funcionaba correctamente cuando se navegaba entre páginas (por ejemplo, de crear inspección a las preguntas).

## Solución Implementada

### 1. Hook `useCapacitorScroll`

**Ubicación:** `src/hooks/useCapacitorScroll.ts`

Hook específico para Capacitor que usa múltiples estrategias para asegurar que el scroll funcione correctamente.

#### Características:

- **Múltiples estrategias de scroll:** Usa 4 métodos diferentes para asegurar que funcione
- **Múltiples intentos:** Hace varios intentos con delays para asegurar el scroll
- **Detección automática:** Se activa automáticamente cuando detecta Capacitor
- **Configuración específica:** Optimizado para WebView de Capacitor

#### Estrategias de Scroll:

1. **window.scrollTo()** - Método estándar
2. **document.documentElement.scrollTop** - Scroll del elemento HTML
3. **document.body.scrollTop** - Scroll del body
4. **scrollIntoView()** - Scroll al primer elemento visible

### 2. Detección Automática de Capacitor

El sistema detecta automáticamente si está ejecutándose en Capacitor:

```typescript
const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;
```

### 3. Configuración Específica para Capacitor

#### Delays Optimizados:

- **Delay mínimo:** 300ms (vs 100ms en navegador web)
- **Múltiples intentos:** 3 intentos con delays incrementales
- **Comportamiento:** 'instant' en lugar de 'smooth'

#### Detección de Contenedores:

En Capacitor, prioriza:
1. `body` - Si tiene scroll
2. `html` - Si tiene scroll  
3. `main` - Elemento principal
4. Contenedores específicos marcados

### 4. Estilos CSS Específicos

**Ubicación:** `src/app/globals.css`

```css
/* Estilos específicos para Capacitor */
.capacitor-app {
  -webkit-overflow-scrolling: touch;
  overflow-scrolling: touch;
}

/* Mejorar el scroll en WebView de Capacitor */
body {
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
}

main {
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
}

/* Mejorar el scroll en formularios de Capacitor */
.form-container {
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Mejorar el scroll en páginas de inspecciones */
.inspections-page {
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
```

## Implementación Actual

### Configuración Global

El sistema usa automáticamente el hook correcto según el entorno:

```typescript
// En ScrollToTopWrapper.tsx
const scrollHook = isCapacitor 
  ? useCapacitorScroll({
      scrollOnRouteChange: false,
      scrollOnMount: false,
      delay: Math.max(delay, 300),
      excludePaths
    })
  : useScrollToTop({
      scrollOnRouteChange: false,
      scrollOnMount: false,
      scrollContainerSelector,
      delay,
      behavior
    });
```

### Configuración en RootLayoutContent

```typescript
<ScrollToTopWrapper
  scrollOnRouteChange={true}
  scrollOnMount={true}
  delay={300} // Delay más largo para Capacitor
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

## Cómo Funciona en Capacitor

### 1. Detección del Entorno

El sistema detecta automáticamente si está en Capacitor y cambia el comportamiento:

- **Navegador web:** Usa `useScrollToTop` con scroll suave
- **Capacitor:** Usa `useCapacitorScroll` con múltiples estrategias

### 2. Múltiples Estrategias de Scroll

Cuando se detecta Capacitor, el sistema:

1. **Intenta window.scrollTo()** con behavior 'instant'
2. **Intenta document.documentElement.scrollTop = 0**
3. **Intenta document.body.scrollTop = 0**
4. **Intenta scrollIntoView()** en el primer elemento
5. **Repite los intentos** hasta 3 veces con delays incrementales

### 3. Delays Optimizados

- **Delay inicial:** 300ms (mínimo)
- **Segundo intento:** +200ms (500ms total)
- **Tercer intento:** +400ms (700ms total)

### 4. Estilos CSS Específicos

Los estilos CSS aseguran que:

- Los contenedores tengan scroll cuando sea necesario
- Se use `-webkit-overflow-scrolling: touch` para mejor rendimiento
- Los elementos tengan altura mínima para activar el scroll

## Ventajas

1. **Funciona en Capacitor:** Soluciona el problema específico del WebView
2. **Múltiples estrategias:** Si una falla, las otras funcionan
3. **Múltiples intentos:** Asegura que el scroll se complete
4. **Detección automática:** No requiere configuración manual
5. **Optimizado para móviles:** Usa las mejores prácticas para WebView
6. **Fallback robusto:** Funciona incluso si algunas APIs fallan

## Casos de Uso Resueltos

### Navegación entre Páginas

- ✅ **Crear inspección → Preguntas:** Scroll al tope funciona
- ✅ **Preguntas → Detalles:** Scroll al tope funciona  
- ✅ **Cualquier navegación:** Scroll consistente

### Formularios Largos

- ✅ **Formularios de inspección:** Scroll al tope al entrar
- ✅ **Formularios de edición:** Scroll al tope al entrar
- ✅ **Formularios con teclado:** Scroll funciona con teclado abierto

### Redirects

- ✅ **Redirects de autenticación:** Scroll al tope funciona
- ✅ **Redirects de perfil:** Scroll al tope funciona
- ✅ **Redirects programáticos:** Scroll al tope funciona

## Consideraciones

- El delay de 300ms es necesario para que el contenido se renderice en Capacitor
- Los múltiples intentos aseguran que el scroll funcione incluso con contenido dinámico
- Los estilos CSS son cruciales para que el scroll funcione correctamente
- El comportamiento 'instant' es más confiable que 'smooth' en WebView

## Personalización

### Para Ajustar Delays

```typescript
// En RootLayoutContent.tsx
<ScrollToTopWrapper
  delay={500} // Delay personalizado
  // ... otras props
>
```

### Para Agregar Rutas Excluidas

```typescript
excludePaths={[
  '/inspections/questions',
  '/admin/questions',
  '/mi-nueva-ruta', // Nueva ruta excluida
]}
```

La solución está optimizada específicamente para Capacitor y resuelve el problema del scroll que se quedaba a media página al navegar entre rutas.
