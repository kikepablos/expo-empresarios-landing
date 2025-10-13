# 📋 Configuración de la Landing Page

## 🏢 ID de Empresa

La landing page está configurada para trabajar con la empresa **Expo Empresarios de la Baja**.

### ID de Empresa por Defecto
```
sTQMprSt6gM7htOXKCKwWnr5n3A2
```

---

## ⚙️ Configuración

### 1. Variable Global

El ID de la empresa está centralizado en:
```typescript
/src/config/constants.ts
```

**Uso en el código:**
```typescript
import { EMPRESA_ID } from '@/config/constants';

// Usar en cualquier parte de la app
const empresaId = EMPRESA_ID;
```

---

### 2. Variables de Entorno

Puedes sobrescribir el ID de empresa usando variables de entorno.

**Crear archivo `.env`:**
```bash
cp .env.example .env
```

**Configurar en `.env`:**
```env
# ID de la empresa en Firestore
VITE_EMPRESA_ID=sTQMprSt6gM7htOXKCKwWnr5n3A2
```

---

## 📁 Estructura de Firestore

La landing page accede a estas colecciones:

```
empresas/{EMPRESA_ID}/
  ├── contactos/          ← Invitados y solicitudes
  ├── expositores/        ← Expositores (colección separada)
  ├── galeria/           ← Imágenes de la galería
  └── carrousel/         ← Imágenes del carrousel
```

---

## 🔧 Archivos de Configuración

### `/src/config/constants.ts`
Contiene todas las configuraciones globales:

```typescript
export const EMPRESA_ID = 'sTQMprSt6gM7htOXKCKwWnr5n3A2';

export const APP_CONFIG = {
  empresaId: EMPRESA_ID,
  appName: 'Expo Empresarios de la Baja',
  urls: {
    dashboard: 'https://emdb-dashboard.web.app',
    landing: 'https://expo-empresarios-de-la-baja.web.app',
  }
};
```

---

## 🚀 Uso en Componentes

### Ejemplo: Obtener datos de expositor
```typescript
import { EMPRESA_ID } from '@/config/constants';
import { getExpositorData } from '@/lib/firebase';

const expositor = await getExpositorData(EMPRESA_ID, expositorId);
```

### Ejemplo: Listar invitados
```typescript
import { EMPRESA_ID } from '@/config/constants';
import { getInvitadoData } from '@/lib/firebase';

const invitado = await getInvitadoData(EMPRESA_ID, invitadoId);
```

---

## 📝 Páginas que Usan EMPRESA_ID

- ✅ `/pages/Home.tsx` - Carrousel y galería
- ✅ `/pages/RegisterPage.tsx` - Registro de invitados
- ✅ `/pages/RegisterExpositorPage.tsx` - Registro de expositores
- ✅ `/pages/GalleryPage.tsx` - Galería de imágenes

---

## 🔄 Cambiar de Empresa

Si necesitas cambiar la empresa, hay **2 opciones**:

### Opción 1: Variable de Entorno (Recomendada)
```env
# .env
VITE_EMPRESA_ID=nuevo_id_de_empresa
```

### Opción 2: Código Directo
```typescript
// src/config/constants.ts
return 'nuevo_id_de_empresa';
```

---

## ⚠️ Importante

- **NO hardcodees** el ID de empresa en funciones individuales
- **SIEMPRE** usa `EMPRESA_ID` de `@/config/constants`
- El ID se carga automáticamente al iniciar la app
- En desarrollo, verás logs en consola con el ID cargado

---

## 🧪 Verificar Configuración

En modo desarrollo, abre la consola del navegador:

```
🔧 Configuración de la App
Empresa ID: sTQMprSt6gM7htOXKCKwWnr5n3A2
Firebase Project: advance-medical-68626
Environment: development
```

---

## 📞 Soporte

Si tienes problemas con la configuración:
1. Verifica que el ID de empresa existe en Firestore
2. Confirma que tienes acceso a la base de datos
3. Revisa los logs en la consola del navegador
