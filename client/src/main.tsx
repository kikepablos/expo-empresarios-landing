import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// const TARGET_HOST = "convencion-baja.scaleflow.tech";

// if (typeof window !== "undefined" && import.meta.env.PROD) {
//   const { hostname } = window.location;

//   if (hostname !== TARGET_HOST) {
//     window.location.replace(`https://${TARGET_HOST}`);
//   }
// }

// Version de la aplicación - incrementar cuando haya cambios importantes
const APP_VERSION = "1.0.";

// Limpiar caché si la versión cambió
function clearCacheIfNeeded() {
  const storedVersion = localStorage.getItem("app_version");
  
  if (storedVersion !== APP_VERSION) {
    console.log(`🔄 Nueva versión detectada: ${APP_VERSION}. Limpiando caché...`);
    
    // Limpiar localStorage excepto algunas claves importantes
    const keysToPreserve = ["authToken", "user"];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToPreserve.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Guardar nueva versión
    localStorage.setItem("app_version", APP_VERSION);
    
    // Limpiar sessionStorage
    sessionStorage.clear();
    
    console.log("✅ Caché limpiado exitosamente");
  }
}

// Ejecutar limpieza de caché
clearCacheIfNeeded();

if (!document.documentElement.classList.contains("dark")) {
  document.documentElement.classList.add("dark");
  document.documentElement.style.colorScheme = "dark";
}

createRoot(document.getElementById("root")!).render(<App />);
