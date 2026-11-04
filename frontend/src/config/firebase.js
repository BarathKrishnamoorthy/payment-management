import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export const getStoredFirebaseConfig = () => {
  try {
    const raw = localStorage.getItem('rb_firebase_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {}

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };
};

let app = null;
let auth = null;

export const isFirebaseConfigured = () => {
  const config = getStoredFirebaseConfig();
  return Boolean(
    config.apiKey &&
    config.projectId &&
    config.apiKey.length > 10
  );
};

export const saveFirebaseConfig = (config) => {
  try {
    localStorage.setItem('rb_firebase_config', JSON.stringify(config));
    // Reset app and auth instances so they reinitialize
    app = null;
    auth = null;
    return true;
  } catch (e) {
    return false;
  }
};

export const clearFirebaseConfig = () => {
  try {
    localStorage.removeItem('rb_firebase_config');
    app = null;
    auth = null;
  } catch (e) {}
};

export const getFirebaseAuth = () => {
  const config = getStoredFirebaseConfig();
  if (!config.apiKey || !config.projectId) {
    throw new Error('Firebase is not yet configured. Please provide Firebase credentials.');
  }

  if (!auth) {
    const existing = getApps();
    if (existing.length > 0) {
      app = existing[0];
    } else {
      app = initializeApp(config);
    }
    auth = getAuth(app);
    auth.useDeviceLanguage();
  }
  return auth;
};

export const setupRecaptcha = (containerId = 'recaptcha-container') => {
  const firebaseAuth = getFirebaseAuth();
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {}
  }
  window.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('[Firebase] Invisible reCAPTCHA verified.');
    },
    'expired-callback': () => {
      console.warn('[Firebase] reCAPTCHA expired.');
    },
  });
  return window.recaptchaVerifier;
};

export { signInWithPhoneNumber };
