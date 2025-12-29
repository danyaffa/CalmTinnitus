import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.calmtinnitus.app',
  appName: 'CalmTinnitus',
  webDir: 'out', // Next.js static export directory
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"]
    }
  }
};

export default config;
