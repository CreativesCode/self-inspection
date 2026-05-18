# Guía de Manejo del Foco del Teclado en Móviles

## Problema Resuelto

Cuando aparece el teclado en dispositivos móviles, el contenido se desplaza hacia arriba y el input enfocado queda oculto detrás del header, causando una mala experiencia de usuario.

## Solución Implementada

### 1. Hook `useKeyboardFocus`

**Ubicación:** `src/hooks/useKeyboardFocus.ts`

Hook personalizado que detecta cuando aparece el teclado y maneja el foco de los inputs automáticamente.

#### Características:

- **Detección automática del teclado:** Usa Visual Viewport API y resize events
- **Scroll automático al input enfocado:** Calcula la posición correcta considerando el header
- **Configuración flexible:** Permite personalizar offset, delay y comportamiento
- **Soporte para diferentes tipos de inputs:** INPUT, TEXTAREA y elementos editables

#### Uso básico:

```typescript
import { useKeyboardFocus } from "@/hooks/useKeyboardFocus";

function MyForm() {
  useKeyboardFocus({
    enabled: true,
    offset: 20,
    delay: 300,
    behavior: 'smooth',
    headerSelector: 'header'
  });
  
  return <form>...</form>;
}
```

#### Opciones disponibles:

- `enabled`: Habilitar el manejo automático del foco (default: true)
- `offset`: Offset adicional para el scroll en píxeles (default: 0)
- `delay`: Delay antes de hacer scroll al elemento enfocado (default: 300ms)
- `behavior`: Comportamiento del scroll - 'smooth' | 'instant' (default: 'smooth')
- `headerSelector`: Selector del header para calcular el offset (default: 'header')

### 2. Componente `KeyboardFocusWrapper`

**Ubicación:** `src/components/KeyboardFocusWrapper.tsx`

Componente wrapper que maneja el foco del teclado a nivel global o por formulario específico.

#### Características:

- **Configuración global:** Se puede usar en el layout principal
- **Ajuste automático del padding:** Compensa el espacio del teclado
- **Clases CSS dinámicas:** Aplica estilos cuando el teclado está abierto

#### Uso en layout:

```typescript
<KeyboardFocusWrapper
  enabled={true}
  offset={20}
  delay={300}
  behavior="smooth"
  headerSelector="header"
>
  <Header />
  <main>{children}</main>
</KeyboardFocusWrapper>
```

### 3. Estilos CSS Mejorados

**Ubicación:** `src/app/globals.css`

Estilos específicos para mejorar la experiencia cuando el teclado está abierto:

```css
/* Estilos cuando el teclado está abierto */
body.keyboard-open {
  overflow: hidden;
  position: fixed;
  width: 100%;
}

body.keyboard-open .form-container {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Asegurar que los inputs estén visibles */
body.keyboard-open input:focus,
body.keyboard-open textarea:focus {
  scroll-margin-top: 80px; /* Altura del header + margen */
}

/* Mejorar la experiencia en formularios móviles */
.form-field-mobile input,
.form-field-mobile textarea,
.form-field-mobile select {
  min-height: 44px; /* Tamaño mínimo recomendado para touch */
  font-size: 16px; /* Prevenir zoom en iOS */
}
```

## Implementación Actual

### Configuración Global

El sistema está configurado globalmente en `RootLayoutContent.tsx`:

```typescript
<KeyboardFocusWrapper
  enabled={true}
  offset={20}
  delay={300}
  behavior="smooth"
  headerSelector="header"
>
  <ScrollToTopWrapper>
    <Header />
    <main>{children}</main>
  </ScrollToTopWrapper>
</KeyboardFocusWrapper>
```

### Formularios Específicos

Los formularios de inspecciones tienen configuración adicional:

```typescript
// En CreateInspectionPageClient.tsx y EditInspectionPageClient.tsx
useKeyboardFocus({
  enabled: true,
  offset: 20,
  delay: 300,
  behavior: 'smooth',
  headerSelector: 'header'
});
```

## Cómo Funciona

### 1. Detección del Teclado

El sistema detecta cuando aparece el teclado usando:

1. **Visual Viewport API** (preferido): Más preciso para dispositivos móviles
2. **Resize events**: Fallback para navegadores que no soportan Visual Viewport
3. **Umbral de altura**: Considera que el teclado está abierto si la altura disminuye más de 150px

### 2. Manejo del Foco

Cuando un input recibe foco y el teclado está abierto:

1. Se calcula la posición del input enfocado
2. Se obtiene la altura del header
3. Se calcula la posición objetivo (input - header - offset - margen)
4. Se hace scroll suave a la posición calculada

### 3. Ajustes Visuales

Cuando el teclado está abierto:

1. Se agrega la clase `keyboard-open` al body
2. Se ajusta el padding del body para compensar el teclado
3. Se previene el scroll del body principal
4. Se permite scroll solo en contenedores de formularios

## Ventajas

1. **Experiencia de usuario mejorada:** Los inputs siempre están visibles
2. **Detección automática:** No requiere configuración manual por input
3. **Configuración flexible:** Permite personalización por formulario
4. **Soporte multiplataforma:** Funciona en iOS, Android y navegadores web
5. **Rendimiento optimizado:** Usa APIs nativas cuando están disponibles
6. **Fallbacks robustos:** Funciona incluso en navegadores antiguos

## Consideraciones

- El delay de 300ms es recomendado para la mayoría de casos
- El offset de 20px proporciona un margen cómodo
- Los inputs deben tener `min-height: 44px` para mejor usabilidad táctil
- El `font-size: 16px` previene el zoom automático en iOS
- El sistema funciona mejor con formularios que usan las clases `form-field-mobile`

## Personalización

### Para un Formulario Específico

Si necesitas comportamiento diferente en un formulario específico:

```typescript
import { useKeyboardFocus } from "@/hooks/useKeyboardFocus";

function MyCustomForm() {
  useKeyboardFocus({
    enabled: true,
    offset: 40, // Offset personalizado
    delay: 500, // Delay personalizado
    behavior: 'instant', // Scroll instantáneo
    headerSelector: '.my-custom-header'
  });
  
  return <form>...</form>;
}
```

### Para Deshabilitar en una Página

```typescript
<KeyboardFocusWrapper enabled={false}>
  <MyPageContent />
</KeyboardFocusWrapper>
```

## Compatibilidad

- ✅ **iOS Safari:** Soporte completo con Visual Viewport API
- ✅ **Android Chrome:** Soporte completo con Visual Viewport API
- ✅ **Navegadores web:** Fallback con resize events
- ✅ **Dispositivos táctiles:** Optimizado para pantallas táctiles
- ✅ **Navegadores antiguos:** Fallbacks robustos

La solución proporciona una experiencia de usuario consistente y profesional en todos los dispositivos móviles.
