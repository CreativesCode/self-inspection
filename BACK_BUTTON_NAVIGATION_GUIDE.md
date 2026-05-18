# Navegación con Botón Atrás en App Móvil

## Descripción

Sistema inteligente que intercepta el botón atrás del móvil para navegar entre páginas en lugar de salir de la aplicación. Solo funciona en apps de Capacitor (APK/APK).

## Características

- **Intercepta botón atrás**: Detecta el botón atrás del hardware/gesto
- **Navegación inteligente**: Navega a la página anterior en lugar de salir
- **Confirmación de salida**: Pregunta antes de salir cuando está en el home
- **Historial de navegación**: Mantiene un historial de páginas visitadas
- **Solo Capacitor**: Funciona únicamente en apps móviles (APK/APK)

## Componentes Implementados

### 1. `useBackButtonNavigation` Hook
- Intercepta el botón atrás de Capacitor
- Maneja la lógica de navegación
- Muestra confirmación nativa para salir

### 2. `usePageNavigation` Hook
- Mantiene historial de navegación
- Permite navegar hacia atrás y adelante
- Gestiona el estado de navegación

### 3. `BackButtonHandler` Component
- Wrapper global que maneja el botón atrás
- Integra con el sistema de navegación
- Muestra diálogo de confirmación personalizado

### 4. `ExitConfirmationDialog` Component
- Diálogo personalizado para confirmar salida
- Diseño consistente con el tema de la app
- Maneja teclas de escape y clics fuera

## Funcionamiento

### 🔄 **Flujo de Navegación**

1. **Usuario presiona botón atrás**
2. **Sistema verifica ubicación actual**:
   - Si está en el home → Muestra confirmación de salida
   - Si está en otra página → Navega a la página anterior
3. **Si no hay páginas anteriores** → Va al home
4. **Si confirma salida** → Cierra la aplicación

### 📱 **Comportamiento por Página**

- **Página de inicio** (`/`): Pregunta si quiere salir
- **Cualquier otra página**: Navega a la página anterior
- **Sin historial**: Va al home

### 🎯 **Detección de Capacitor**

El sistema solo se activa cuando detecta:
- `window.Capacitor` existe
- App está corriendo en dispositivo móvil
- No se activa en navegador web

## Configuración

### Opciones del BackButtonHandler

```tsx
<BackButtonHandler
  homePath="/"              // Ruta del home (default: '/')
  onExitConfirm={() => {}}  // Función personalizada para salir
>
  {/* Contenido */}
</BackButtonHandler>
```

### Opciones del useBackButtonNavigation

```tsx
useBackButtonNavigation({
  enabled: true,            // Habilitar/deshabilitar
  homePath: '/',           // Ruta del home
  onExitConfirm: () => {}, // Función personalizada
});
```

## Historial de Navegación

### Funciones Disponibles

```tsx
const {
  goBack,           // Navegar hacia atrás
  goForward,        // Navegar hacia adelante
  canGoBack,        // Verificar si puede ir atrás
  canGoForward,     // Verificar si puede ir adelante
  getPreviousPage,  // Obtener página anterior
  getNextPage,      // Obtener página siguiente
  clearHistory,     // Limpiar historial
  history,          // Array del historial
  currentIndex,     // Índice actual
} = usePageNavigation();
```

### Gestión del Historial

- **Agregar páginas**: Automático al navegar
- **Navegación**: Mantiene índice actual
- **Límites**: No puede ir más allá del historial
- **Limpieza**: Se puede limpiar manualmente

## Diálogo de Confirmación

### Características del Diálogo

- **Diseño nativo**: Consistente con el tema de la app
- **Teclas de escape**: Cierra con Escape
- **Clic fuera**: Cierra al hacer clic fuera
- **Botones**: Cancelar y Salir
- **Icono de advertencia**: Visual claro

### Personalización

```tsx
<ExitConfirmationDialog
  isOpen={showDialog}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
```

## Debug (Solo Desarrollo)

### Panel de Debug

En modo desarrollo se muestra un panel que incluye:
- Estado de Capacitor
- Capacidad de navegación
- Historial completo
- Índice actual

### Información Mostrada

- ✅/❌ Capacitor detectado
- ✅/❌ Puede ir hacia atrás
- ✅/❌ Puede ir hacia adelante
- Lista del historial de navegación
- Página actual resaltada

## Integración

### Layout Principal

```tsx
<BackButtonHandler>
  <GlobalPullToRefresh>
    <Header />
    <main>{children}</main>
  </GlobalPullToRefresh>
</BackButtonHandler>
```

### Orden de Componentes

1. `BackButtonHandler` - Maneja botón atrás
2. `GlobalPullToRefresh` - Maneja pull-to-refresh
3. Contenido de la app

## Troubleshooting

### El botón atrás no funciona
1. Verificar que estés en una app de Capacitor
2. Asegúrate de que el dispositivo sea móvil
3. Verificar que `enabled` esté en `true`

### No navega correctamente
1. Verificar que el historial se esté llenando
2. Asegúrate de que las rutas sean válidas
3. Verificar que no haya conflictos de navegación

### El diálogo no se muestra
1. Verificar que estés en la página home
2. Asegúrate de que el estado esté correcto
3. Verificar que no haya errores en la consola

## Próximas Mejoras

- [ ] Configuración por página
- [ ] Diferentes comportamientos por tipo de página
- [ ] Métricas de navegación
- [ ] Soporte para gestos personalizados
- [ ] Integración con analytics

## Notas Importantes

- **Solo funciona en Capacitor**: No se activa en navegador web
- **Requiere permisos**: Necesita acceso al botón atrás del sistema
- **Historial limitado**: Se mantiene en memoria durante la sesión
- **Navegación programática**: No interfiere con navegación normal
