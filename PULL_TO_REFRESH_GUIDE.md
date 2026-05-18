# Pull-to-Refresh en la App Móvil

## Descripción

Se ha implementado una funcionalidad de pull-to-refresh (deslizar hacia abajo para actualizar) en la aplicación móvil, similar a la funcionalidad nativa de Chrome en dispositivos móviles.

## Características

- **Detección automática**: Solo se activa en aplicaciones móviles (Capacitor) y dispositivos móviles
- **Indicador visual**: Muestra un indicador de progreso con animación
- **Resistencia**: El scroll tiene resistencia para una mejor experiencia de usuario
- **Fallback**: Si falla la actualización de datos, recarga la página completa

## Componentes Implementados

### 1. `usePullToRefresh` Hook
- Hook personalizado que maneja la lógica del pull-to-refresh
- Detecta gestos de deslizar hacia abajo cuando el scroll está en la parte superior
- Aplica resistencia al scroll para mejor UX

### 2. `PullToRefreshIndicator` Component
- Componente visual que muestra el indicador de refresh
- Incluye animación de rotación y barra de progreso
- Se posiciona en la parte superior de la pantalla

### 3. `PullToRefreshWrapper` Component
- Wrapper que combina todos los componentes
- Detecta automáticamente si está en una app móvil
- Fácil de usar en cualquier página

### 4. `useMobileDetection` Hook
- Detecta si la aplicación está corriendo en Capacitor
- Detecta si es un dispositivo móvil
- Combina ambas condiciones para activar el pull-to-refresh

## Sistema de Pull-to-Refresh

### 🌍 **Sistema Global**
- **Cobertura total**: Funciona en **TODAS las páginas** automáticamente
- **Implementación automática**: No necesitas agregar código a cada página
- **Detección inteligente**: Se desactiva automáticamente si una página ya tiene su propio pull-to-refresh

### 📱 **Páginas con Pull-to-Refresh Específico**
Las siguientes páginas tienen pull-to-refresh personalizado (más inteligente):

1. **Página de Preguntas** (`/inspections/questions`)
   - Refresca todas las consultas GraphQL
   - Fallback a recargar la página completa

2. **Página de Inspecciones** (`/inspections`)
   - Refresca la consulta de inspecciones
   - Fallback a recargar la página completa

3. **Dashboard de Evaluaciones** (`/evaluations`)
   - Refresca la consulta de evaluaciones
   - Fallback a recargar la página completa

### 🔄 **Funcionamiento Inteligente**
- Si una página tiene su propio `PullToRefreshWrapper`, el sistema global se desactiva automáticamente
- Si una página NO tiene pull-to-refresh específico, el sistema global se activa
- Esto evita conflictos y duplicación de funcionalidad

## Cómo Usar

### Implementación Básica

```tsx
import { PullToRefreshWrapper } from "@/components/PullToRefreshWrapper";

export default function MiPagina() {
  const handleRefresh = async () => {
    try {
      // Tu lógica de refresh aquí
      await refetch();
    } catch (error) {
      console.error('Error al refrescar:', error);
      window.location.reload();
    }
  };

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      <div>
        {/* Tu contenido aquí */}
      </div>
    </PullToRefreshWrapper>
  );
}
```

### Opciones Avanzadas

```tsx
<PullToRefreshWrapper 
  onRefresh={handleRefresh}
  threshold={100}        // Distancia mínima para activar (default: 80px)
  resistance={0.3}       // Resistencia del scroll (default: 0.5)
  enabled={true}         // Habilitar/deshabilitar (default: true)
  className="mi-clase"   // Clase CSS adicional
>
  {/* Contenido */}
</PullToRefreshWrapper>
```

## Configuración

### Umbral (Threshold)
- **Default**: 80px
- **Descripción**: Distancia mínima que debe deslizarse para activar el refresh
- **Recomendación**: 60-100px para mejor UX

### Resistencia (Resistance)
- **Default**: 0.5
- **Descripción**: Factor de resistencia del scroll (0-1)
- **Recomendación**: 0.3-0.7 para sensación natural

## Detección de Dispositivos

El sistema detecta automáticamente:
- **Capacitor**: Verifica si `window.Capacitor` existe
- **Dispositivo móvil**: Verifica user agent y tamaño de pantalla
- **Dispositivo táctil**: Verifica capacidades táctiles del dispositivo
- **Activación**: Se activa en cualquier dispositivo móvil O táctil (incluyendo navegador web en vista móvil)

### Cobertura Completa
- ✅ **APK/APK de Capacitor**: Funciona perfectamente
- ✅ **Navegador web en móvil**: Funciona en Chrome, Safari, Firefox móvil
- ✅ **Tablets**: Funciona en iPads y tablets Android
- ✅ **Dispositivos táctiles**: Funciona en laptops con pantalla táctil
- ❌ **Navegador web en desktop**: No se activa (no es necesario)

## Estilos

El indicador usa las siguientes clases CSS:
- `fixed top-0 left-1/2 transform -translate-x-1/2 -translate-y-full`
- `bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg`
- `w-6 h-6 text-blue-500 transition-transform duration-200`

## Troubleshooting

### El pull-to-refresh no funciona
1. Verifica que estés en una app móvil (no en el navegador web)
2. Asegúrate de que el componente esté envuelto correctamente
3. Verifica que la función `onRefresh` esté definida

### El indicador no se muestra
1. Verifica que el scroll esté en la parte superior
2. Asegúrate de que el dispositivo sea móvil
3. Verifica que `enabled` esté en `true`

### La animación no funciona
1. Verifica que las clases CSS de Tailwind estén disponibles
2. Asegúrate de que el tema oscuro/claro esté configurado correctamente

## Próximas Mejoras

- [ ] Personalización de colores del indicador
- [ ] Diferentes tipos de animación
- [ ] Configuración por página
- [ ] Métricas de uso del pull-to-refresh
- [ ] Soporte para gestos personalizados
