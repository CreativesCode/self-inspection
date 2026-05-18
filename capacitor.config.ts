import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize, KeyboardStyle } from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: "com.self.inspection",
  appName: "Self Inspection",
  webDir: "out",
  server: {
    androidScheme: "https",
    iosScheme: "https",
  },
  plugins: {
    // Configuración específica para Appflow
    Geolocation: {
      permissions: {
        location: "always",
      },
    },
    Camera: {
      permissions: {
        camera: "always",
        photos: "always",
      },
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
  },
  ios: {
    scheme: "Self Inspection",
  },
};

export default config;
