import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nirshloman.lomdimbekef',
  appName: 'ידע׳לה',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'localhost'
  },
  android: {
    minWebViewVersion: 83
  },
  ios: {
    contentInset: 'automatic',
    minVersion: '16.0',
    preferredContentMode: 'mobile',
    backgroundColor: '#FFF9EE'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 700,
      backgroundColor: '#FFF9EE',
      showSpinner: false
    }
  }
};

export default config;
