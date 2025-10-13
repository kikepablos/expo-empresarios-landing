# 🔧 Solución al Problema de Pantalla Negra en Chrome

## 📋 Problema
La página `InvitadoDetailPage` se muestra en negro en Google Chrome y requiere múltiples recargas.

## ✅ Soluciones Implementadas

### 1. **Meta Tags de Control de Caché** (index.html)
Se agregaron meta tags para evitar que Chrome cachee versiones antiguas:
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

### 2. **Sistema de Versionado Automático** (main.tsx)
- Se implementó un sistema que limpia el caché automáticamente cuando detecta una nueva versión
- Variable `APP_VERSION = "1.0.1"` - Incrementar cuando haya cambios importantes
- Limpia localStorage y sessionStorage excepto datos de autenticación

### 3. **Limpieza de Código** (InvitadoDetailPage.tsx)
- ✅ Eliminados console.log innecesarios que afectan el rendimiento
- ✅ Eliminado mensaje de debug temporal en producción
- ✅ Código optimizado para mejor performance

---

## 🌐 Instrucciones para Usuarios (Limpiar Caché en Chrome)

### Opción 1: Hard Reload (Recomendado)
1. Presiona `Cmd + Shift + R` (Mac) o `Ctrl + Shift + R` (Windows)
2. Esto forzará una recarga sin usar caché

### Opción 2: Limpiar Caché Completo
1. Abre Chrome DevTools: `Cmd + Option + I` (Mac) o `F12` (Windows)
2. **Click derecho en el botón de recargar** (junto a la barra de URL)
3. Selecciona: **"Empty Cache and Hard Reload"**

### Opción 3: Limpiar Datos del Sitio
1. Ve a `chrome://settings/content/all`
2. Busca tu sitio web
3. Click en **"Clear data"**

### Opción 4: Limpiar Todo el Caché de Chrome
1. Ve a: `chrome://settings/clearBrowserData`
2. Selecciona:
   - ✅ Cached images and files
   - ✅ (Opcional) Cookies and other site data
3. Rango de tiempo: **All time**
4. Click en **"Clear data"**

---

## 🚀 Para Deployar los Cambios

### 1. Build de la Aplicación
```bash
cd /Users/enriquepablos/Documents/Scaleflow/Cabos/convencion_cabos_landing/client
npm run build
```

### 2. Deploy a Firebase
```bash
firebase deploy --only hosting
```

---

## 🔄 Incrementar Versión en el Futuro

Cuando hagas cambios importantes, **incrementa la versión** en `src/main.tsx`:

```typescript
const APP_VERSION = "1.0.2"; // Cambiar este número
```

Esto automáticamente limpiará el caché de los usuarios en su próxima visita.

---

## 🐛 Si el Problema Persiste

### 1. Verificar Console del Navegador
- Abre DevTools (`F12`)
- Ve a la pestaña **Console**
- Busca errores en rojo
- Comparte los errores con el equipo de desarrollo

### 2. Verificar Network Tab
- Abre DevTools → Pestaña **Network**
- Recarga la página
- Verifica si algún archivo falla al cargar (status 404, 500, etc.)

### 3. Modo Incógnito
- Abre una ventana de incógnito: `Cmd + Shift + N` (Mac) o `Ctrl + Shift + N` (Windows)
- Si funciona en incógnito, el problema es el caché

---

## 📝 Notas Técnicas

### Archivos Modificados:
1. ✅ `index.html` - Meta tags de caché
2. ✅ `src/main.tsx` - Sistema de versionado
3. ✅ `src/pages/InvitadoDetailPage.tsx` - Limpieza de código

### Prevención a Futuro:
- El sistema de versionado automático previene problemas de caché
- Incrementa `APP_VERSION` después de cada deploy importante
- Los usuarios verán automáticamente la nueva versión sin problemas
