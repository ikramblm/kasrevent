import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kasrevent.app",
  appName: "KasrEvent",
  webDir: "dist",
  server: {
    androidScheme: "https"
  }
};

export default config;
