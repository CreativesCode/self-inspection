declare module "react-leaflet" {
  import { LatLngExpression, MapOptions } from "leaflet";
  import { ComponentType, ReactNode } from "react";

  export interface MapContainerProps extends MapOptions {
    children?: ReactNode;
    style?: React.CSSProperties;
    scrollWheelZoom?: boolean;
  }

  export interface TileLayerProps {
    url: string;
    attribution?: string;
  }

  export interface MarkerProps {
    position: LatLngExpression;
    children?: ReactNode;
  }

  export interface PopupProps {
    children?: ReactNode;
  }

  export const MapContainer: ComponentType<MapContainerProps>;
  export const TileLayer: ComponentType<TileLayerProps>;
  export const Marker: ComponentType<MarkerProps>;
  export const Popup: ComponentType<PopupProps>;
}
