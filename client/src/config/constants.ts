/**
 * Configuración global de la aplicación
 * Centraliza todas las variables de entorno y constantes
 */

// Obtener empresa ID del environment o usar default
const getEmpresaId = (): string => {
  // Verificar si estamos en el navegador
  if (typeof window !== 'undefined') {
    // En producción, intentar leer del window
    const empresaId = import.meta.env.VITE_EMPRESA_ID;
    
    if (empresaId) {
      console.log('✅ Empresa ID cargado:', empresaId);
      return empresaId;
    }
    
    console.warn('⚠️ VITE_EMPRESA_ID no encontrado, usando default');
  }
  
  // Fallback al ID por defecto de la Expo Empresarios de la Baja
  return 'sTQMprSt6gM7htOXKCKwWnr5n3A2';
};

// Firebase Configuration (proyecto Scaleflow Suite)
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "scaleflow-aee7f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "scaleflow-aee7f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "scaleflow-aee7f.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "55600950615",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:55600950615:web:44d91a0c3515443c80e212",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-E4CR4M73P8",
};

// Base de datos Firestore con nombre (no la "(default)") del proyecto Suite
export const FIRESTORE_DATABASE_ID = import.meta.env.VITE_FIREBASE_DATABASE_ID || "suite";

// Email API (Cloud Function del proyecto Suite)
export const EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL ||
  'https://us-central1-scaleflow-aee7f.cloudfunctions.net/emailAPI/sendEmail';

// Logo usado en los correos (servido desde client/public de esta landing)
export const EMAIL_LOGO_URL = 'https://convencion-baja.scaleflow.tech/logo-expo.png';

// App Configuration
export const APP_CONFIG = {
  // ID de la empresa en Firestore
  empresaId: getEmpresaId(),
  
  // Nombre de la app
  appName: 'Expo Empresarios de la Baja',
  
  // Función de Firebase para registro
  firebaseFunctionUrl: import.meta.env.VITE_FIREBASE_FUNCTION_URL || 
    'https://us-central1-scaleflow-aee7f.cloudfunctions.net/register',
  
  // URLs
  urls: {
    dashboard: 'https://emdb-dashboard.web.app',
    landing: 'convencion-baja.scaleflow.tech',
  }
};

// Exportar empresa ID directamente para fácil acceso
export const EMPRESA_ID = APP_CONFIG.empresaId;

// Log de configuración en desarrollo
if (import.meta.env.DEV) {
  console.group('🔧 Configuración de la App');
  console.log('Empresa ID:', APP_CONFIG.empresaId);
  console.log('Firebase Project:', FIREBASE_CONFIG.projectId);
  console.log('Environment:', import.meta.env.MODE);
  console.groupEnd();
}
