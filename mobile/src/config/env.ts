import { Platform } from 'react-native';

// Permanent Live Vercel Production Backend API (100% Free, Global CDN, 24/7)
export const DEFAULT_LIVE_API_URL = 'https://backend-nine-zeta-zy9fgdrzlm.vercel.app/api';

// Permanent Render Cloud URL (when deployed)
export const RENDER_LIVE_API_URL = 'https://rb-payment-backend.onrender.com/api';

// Fallback for local Wi-Fi network testing (your machine IP: 192.168.0.104)
export const LOCAL_WIFI_API_URL = 'http://192.168.0.104:5000/api';

// Emulator fallback
export const EMULATOR_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
