import { Capacitor } from "@capacitor/core";
import { Geolocation, PositionOptions } from "@capacitor/geolocation";
import { useCallback, useEffect, useState } from "react";

interface LocationState {
  loading: boolean;
  error: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  permission: "granted" | "denied" | "prompt" | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const [state, setState] = useState<LocationState>({
    loading: false,
    error: null,
    latitude: null,
    longitude: null,
    accuracy: null,
    permission: null,
  });

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    watchPosition = false,
  } = options;

  const requestLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Verificar si estamos en una plataforma nativa o web
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        // Solicitar permisos explícitamente en plataformas nativas
        const permissionStatus = await Geolocation.requestPermissions();

        if (permissionStatus.location !== "granted") {
          setState({
            loading: false,
            error:
              "Los permisos de ubicación fueron denegados. Por favor, habilítalos en la configuración de la aplicación.",
            latitude: null,
            longitude: null,
            accuracy: null,
            permission: "denied",
          });
          return;
        }

        setState((prev) => ({ ...prev, permission: "granted" }));
      }

      // Configurar opciones de posición
      const positionOptions: PositionOptions = {
        enableHighAccuracy,
        timeout,
        maximumAge,
      };

      // Obtener la posición actual
      const position = await Geolocation.getCurrentPosition(positionOptions);

      setState({
        loading: false,
        error: null,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        permission: "granted",
      });
    } catch (error: unknown) {
      let errorMessage = "Error al obtener la ubicación";

      if (error instanceof Error && error.message) {
        switch (error.message) {
          case "Location services are not enabled":
            errorMessage =
              "Los servicios de ubicación están deshabilitados. Por favor, habilítalos en la configuración del dispositivo.";
            break;
          case "User denied Geolocation":
            errorMessage = "El usuario denegó el acceso a la ubicación.";
            break;
          case "Timeout expired":
            errorMessage =
              "Se agotó el tiempo de espera para obtener la ubicación. Intenta de nuevo.";
            break;
          default:
            errorMessage = error.message;
        }
      }

      setState({
        loading: false,
        error: errorMessage,
        latitude: null,
        longitude: null,
        accuracy: null,
        permission: "denied",
      });
    }
  }, [enableHighAccuracy, timeout, maximumAge]);

  const [watchLocationId, setWatchLocationId] = useState<string | null>(null);

  const startWatching = useCallback(async () => {
    if (watchLocationId) return; // Ya está observando

    try {
      const id = await Geolocation.watchPosition(
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        },
        (position, err) => {
          if (err) {
            setState((prev) => ({
              ...prev,
              error: err.message || "Error al observar la ubicación",
            }));
            return;
          }

          if (position) {
            setState((prev) => ({
              ...prev,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              error: null,
            }));
          }
        }
      );

      setWatchLocationId(id);
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Error al iniciar el seguimiento de ubicación",
      }));
    }
  }, [watchLocationId, enableHighAccuracy, timeout, maximumAge]);

  const stopWatching = useCallback(async () => {
    if (watchLocationId) {
      await Geolocation.clearWatch({ id: watchLocationId });
      setWatchLocationId(null);
    }
  }, [watchLocationId]);

  useEffect(() => {
    if (watchPosition) {
      startWatching();
    }

    return () => {
      if (watchLocationId) {
        stopWatching();
      }
    };
  }, [watchPosition, startWatching, stopWatching, watchLocationId]);

  return {
    ...state,
    requestLocation,
    startWatching,
    stopWatching,
    isWatching: !!watchLocationId,
  };
};
