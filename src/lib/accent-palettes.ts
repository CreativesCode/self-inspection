/**
 * Paletas de "accent color" del rediseno Safe 360.
 *
 * Cada paleta define los 11 shades 50-900 + un triplete RGB (sin alpha) que se
 * usa en CSS variables para sustituir las miles de rgba(...) hardcoded del
 * codigo original. El contexto AccentContext inyecta estas paletas como CSS
 * variables en :root (--accent-50 ... --accent-900, --accent-rgb,
 * --grad-brand, etc.).
 */

export type AccentName = "brick" | "blue" | "green" | "purple" | "orange";

export interface AccentPalette {
  name: AccentName;
  label: string;
  /** Triplete RGB separado por comas para usar en rgba(var(--accent-rgb), X). */
  rgb: string;
  shades: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  soft: string;
  gradMid: string;
  gradEnd: string;
}

export const ACCENT_PALETTES: Record<AccentName, AccentPalette> = {
  brick: {
    name: "brick",
    label: "Rojo Safe",
    rgb: "218, 41, 28",
    shades: {
      50: "#FEF2F1",
      100: "#FBDAD6",
      200: "#F5B5AD",
      300: "#ED7767",
      400: "#E14939",
      500: "#DA291C",
      600: "#BD2217",
      700: "#A21C12",
      800: "#87150D",
      900: "#6C0F08",
    },
    soft: "#FBDAD6",
    gradMid: "#E76150",
    gradEnd: "#F28C7C",
  },
  blue: {
    name: "blue",
    label: "Azul corporativo",
    rgb: "45, 79, 179",
    shades: {
      50: "#EFF3FB",
      100: "#D8E0F4",
      200: "#B0C0E8",
      300: "#7993D7",
      400: "#4F75E1",
      500: "#2D4FB3",
      600: "#274598",
      700: "#1F397E",
      800: "#172D64",
      900: "#10214B",
    },
    soft: "#D8E0F4",
    gradMid: "#5C7DD9",
    gradEnd: "#8FA9F0",
  },
  green: {
    name: "green",
    label: "Verde",
    rgb: "31, 122, 80",
    shades: {
      50: "#EEF8F2",
      100: "#D2EBDD",
      200: "#A4D6BB",
      300: "#6BC79A",
      400: "#3FAF7C",
      500: "#2F9E6A",
      600: "#1F7A50",
      700: "#196641",
      800: "#125233",
      900: "#0B3D24",
    },
    soft: "#D2EBDD",
    gradMid: "#3FAF7C",
    gradEnd: "#6BC79A",
  },
  purple: {
    name: "purple",
    label: "Morado",
    rgb: "126, 86, 196",
    shades: {
      50: "#F4EFFB",
      100: "#E1D3F4",
      200: "#C2A8E8",
      300: "#A37DDB",
      400: "#8E64D2",
      500: "#7E56C4",
      600: "#6940AE",
      700: "#553391",
      800: "#412874",
      900: "#2E1C57",
    },
    soft: "#E1D3F4",
    gradMid: "#9C77D7",
    gradEnd: "#B89AE3",
  },
  orange: {
    name: "orange",
    label: "Naranja",
    rgb: "232, 124, 41",
    shades: {
      50: "#FEF4EB",
      100: "#FCDFC4",
      200: "#F7BE89",
      300: "#F09E5A",
      400: "#EC8B3F",
      500: "#E87C29",
      600: "#C46420",
      700: "#9F4F18",
      800: "#7A3C11",
      900: "#562909",
    },
    soft: "#FCDFC4",
    gradMid: "#EE9651",
    gradEnd: "#F4B57E",
  },
};

export const ACCENT_LIST: AccentPalette[] = [
  ACCENT_PALETTES.brick,
  ACCENT_PALETTES.blue,
  ACCENT_PALETTES.green,
  ACCENT_PALETTES.purple,
  ACCENT_PALETTES.orange,
];

export const DEFAULT_ACCENT: AccentName = "brick";

/**
 * Inyecta las CSS variables de un accent en el elemento dado (tipicamente
 * document.documentElement). Llamar al cambiar de accent o al montar.
 */
export function applyAccent(
  el: HTMLElement,
  palette: AccentPalette,
): void {
  const s = el.style;
  s.setProperty("--accent-50", palette.shades[50]);
  s.setProperty("--accent-100", palette.shades[100]);
  s.setProperty("--accent-200", palette.shades[200]);
  s.setProperty("--accent-300", palette.shades[300]);
  s.setProperty("--accent-400", palette.shades[400]);
  s.setProperty("--accent-500", palette.shades[500]);
  s.setProperty("--accent-600", palette.shades[600]);
  s.setProperty("--accent-700", palette.shades[700]);
  s.setProperty("--accent-800", palette.shades[800]);
  s.setProperty("--accent-900", palette.shades[900]);
  s.setProperty("--accent-rgb", palette.rgb);
  s.setProperty(
    "--grad-brand",
    `linear-gradient(135deg, ${palette.shades[500]} 0%, ${palette.gradMid} 55%, ${palette.gradEnd} 100%)`,
  );
  s.setProperty(
    "--grad-brand-soft",
    `linear-gradient(135deg, ${palette.shades[50]} 0%, ${palette.shades[100]} 100%)`,
  );
  s.setProperty(
    "--grad-bad",
    `linear-gradient(135deg, ${palette.shades[500]}, ${palette.gradEnd})`,
  );
  s.setProperty(
    "--grad-border-glow",
    `linear-gradient(135deg, rgba(${palette.rgb},0.55), rgba(${palette.rgb},0.18) 45%, rgba(120,107,102,0.18) 100%)`,
  );
  s.setProperty(
    "--grad-border-glow-dark",
    `linear-gradient(135deg, rgba(${palette.rgb},0.55), rgba(${palette.rgb},0.25) 45%, rgba(255,255,255,0.05) 100%)`,
  );
}
