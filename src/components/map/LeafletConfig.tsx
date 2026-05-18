import L from "leaflet";
import { useEffect } from "react";

// Soluciona el problema de los iconos en Leaflet
function LeafletIconConfig() {
  useEffect(() => {
    // Corregir el problema del ícono por defecto en Leaflet
    // Esto configura la ruta correcta para el ícono y su sombra

    // Solucionamos el problema de tipos y accedemos al prototype con casting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iconDefault = L.Icon.Default as any;
    delete iconDefault.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/marker-icon.png",
      iconUrl: "/marker-icon.png",
      shadowUrl: "/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  }, []);

  return null; // Este componente no renderiza nada, solo configura Leaflet
}

export default LeafletIconConfig;
