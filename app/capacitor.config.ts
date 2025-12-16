import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.calmtinnitus.app",
  appName: "CalmTinnitus",
  webDir: "out",
  server: {
    url: "https://www.calmtinnitus.com",
    cleartext: false
  }
};

export default config;
