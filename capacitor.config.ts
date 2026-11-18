import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shimuldigital.teacherassistant',
  appName: 'প্রাইমারি মাস্টার',
  webDir: 'dist',
  android: {
    backgroundColor: '#F6F7F4',
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
