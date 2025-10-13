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

// Firebase Configuration
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB_ndugEn0SThWr9f4QJgPJ-UZ8_eCqU2Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "advance-medical-68626.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "advance-medical-68626",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "advance-medical-68626.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "6672437019",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:6672437019:web:2d65162482d78dbb914dbe",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-D208YMX1VQ",
};

// App Configuration
export const APP_CONFIG = {
  // ID de la empresa en Firestore
  empresaId: getEmpresaId(),
  
  // Nombre de la app
  appName: 'Expo Empresarios de la Baja',
  
  // Función de Firebase para registro
  firebaseFunctionUrl: import.meta.env.VITE_FIREBASE_FUNCTION_URL || 
    'https://us-central1-advance-medical-68626.cloudfunctions.net/register',
  
  // URLs
  urls: {
    dashboard: 'https://emdb-dashboard.web.app',
    landing: 'https://expo-empresarios-de-la-baja.web.app',
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
