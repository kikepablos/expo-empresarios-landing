# Configuración de Variables de Entorno

## 🔧 Variable EMPRESA_ID

La variable `EMPRESA_ID` es crítica para el funcionamiento de la aplicación, ya que determina qué empresa/evento se está gestionando en Firebase.

### ⚠️ Problema Anterior

Antes, cada componente leía directamente de `import.meta.env.VITE_EMPRESA_ID`, lo cual causaba:
- Inconsistencias si el `.env` no se cargaba correctamente
- Dificultad para debuggear qué ID se estaba usando
- Código repetitivo en múltiples archivos

### ✅ Solución Implementada

Ahora existe un archivo centralizado: **`src/config/constants.ts`**

```typescript
import { EMPRESA_ID } from '@/config/constants';

// Usar en cualquier componente:
const empresaId = EMPRESA_ID;
```

### 📁 Estructura

```
client/
├── .env                          # Variables de entorno (NO en git)
│   └── VITE_EMPRESA_ID=LssrkZFF7CbwxbPnNYRD
├── .env.example                  # Template de ejemplo
└── src/
    └── config/
        └── constants.ts          # ⭐ Configuración centralizada
```

### 🔍 Cómo Funciona

1. **En desarrollo** (`npm run dev`):
   - Vite lee automáticamente `.env`
   - Las variables `VITE_*` se inyectan en `import.meta.env`
   - `constants.ts` lee y valida estas variables
   - Muestra logs en consola para debugging

2. **En producción** (build):
   - Las variables deben estar en el ambiente de build
   - O configuradas en Firebase Hosting
   - El fallback siempre es `LssrkZFF7CbwxbPnNYRD`

### 🛠️ Debugging

Al iniciar la app en modo desarrollo, verás en la consola:

```
🔧 Configuración de la App
  Empresa ID: LssrkZFF7CbwxbPnNYRD
  Firebase Project: scaleflow-aee7f (Firestore DB: suite)
  Environment: development
```

Si ves:
```
⚠️ VITE_EMPRESA_ID no encontrado, usando default
```

Significa que el `.env` no se está cargando correctamente.

### 🔄 Solución de Problemas

#### El .env no se carga:

1. **Verificar ubicación**: El `.env` debe estar en `/client/.env`
2. **Reiniciar servidor**: `Ctrl+C` y `npm run dev` de nuevo
3. **Verificar sintaxis**: No usar espacios alrededor del `=`
   ```bash
   # ✅ Correcto
   VITE_EMPRESA_ID=LssrkZFF7CbwxbPnNYRD
   
   # ❌ Incorrecto
   VITE_EMPRESA_ID = LssrkZFF7CbwxbPnNYRD
   ```

#### Cambiar el ID de empresa:

1. Editar `/client/.env`:
   ```bash
   VITE_EMPRESA_ID=NUEVO_ID_AQUI
   ```

2. Reiniciar el servidor de desarrollo
3. Verificar en consola que el nuevo ID se cargó

### 📦 Variables Disponibles

En `constants.ts` también están:

- `FIREBASE_CONFIG`: Configuración completa de Firebase
- `APP_CONFIG`: Configuración general de la app
  - `empresaId`: ID de la empresa actual
  - `appName`: Nombre de la aplicación
  - `firebaseFunctionUrl`: URL de Cloud Functions
  - `urls`: URLs del dashboard y landing

### 🚀 Build para Producción

Al hacer build, asegúrate de tener las variables:

```bash
# En el entorno de CI/CD o local
export VITE_EMPRESA_ID=LssrkZFF7CbwxbPnNYRD
npm run build
```

O crear `.env.production`:
```bash
VITE_EMPRESA_ID=LssrkZFF7CbwxbPnNYRD
```

### 📋 Archivos Actualizados

Los siguientes archivos ahora usan `EMPRESA_ID` de `constants.ts`:

- ✅ `pages/Home.tsx`
- ✅ `pages/GalleryPage.tsx`
- ✅ `pages/RegisterPage.tsx`
- ✅ `pages/RegisterExpositorPage.tsx`
- ✅ `components/ContactSection.tsx`

### 🎯 Beneficios

1. **Centralizado**: Un solo lugar para configurar
2. **Validación**: Logs automáticos de qué ID se está usando
3. **Fallback**: Siempre tiene un valor por defecto
4. **Debugging**: Fácil identificar problemas de configuración
5. **Mantenible**: Cambios futuros en un solo archivo

---

**Última actualización**: 2025-10-02
