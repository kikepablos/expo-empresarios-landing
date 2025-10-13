# 🔐 Sistema de Autenticación para Expositores

Sistema completo de autenticación con Firebase Auth para el portal de expositores.

---

## 📋 Índice

1. [Características](#características)
2. [Flujo de Registro](#flujo-de-registro)
3. [Funciones Implementadas](#funciones-implementadas)
4. [Páginas Creadas](#páginas-creadas)
5. [Rutas](#rutas)
6. [Uso](#uso)

---

## ✨ Características

### **1. Registro con Creación de Cuenta**
- ✅ Registro de expositor desde CRM
- ✅ Expositor completa formulario web
- ✅ Creación automática de cuenta Firebase Auth
- ✅ Correo de bienvenida con credenciales
- ✅ Estado cambia automáticamente a "Completado"

### **2. Inicio de Sesión**
- ✅ Login con email y contraseña
- ✅ Validación de credenciales
- ✅ Mensajes de error personalizados
- ✅ Toggle para mostrar/ocultar contraseña

### **3. Recuperación de Contraseña**
- ✅ Envío de correo de recuperación
- ✅ Restablecimiento seguro vía Firebase
- ✅ Confirmación visual del envío

### **4. Cambio de Contraseña**
- ✅ Cambiar contraseña desde panel de usuario
- ✅ Validación de contraseñas
- ✅ Cierre de sesión automático después del cambio

### **5. Seguridad**
- ✅ Contraseñas encriptadas por Firebase
- ✅ Validación de contraseñas (mínimo 6 caracteres)
- ✅ UID guardado en Firestore
- ✅ Contraseñas NUNCA se guardan en Firestore

---

## 🔄 Flujo de Registro

```
1. Admin crea expositor en CRM
   ↓
   Estado: "Pendiente"
   registroCompleto: false

2. Sistema envía correo con enlace personalizado
   ↓
   https://expo.com/registro-expositor?expositor=ABC123

3. Expositor abre enlace y completa formulario
   ↓
   - Datos de empresa
   - Datos de contacto
   - Logo e imágenes
   - NUEVA: Contraseña (mínimo 6 caracteres)

4. Al enviar formulario:
   ↓
   a) Crear cuenta Firebase Auth
      - email + password
      - Retorna UID
   
   b) Subir logo e imágenes
   
   c) Guardar datos en Firestore
      - Datos del expositor
      - userUid (UID de Firebase Auth)
      - status: "Completado"
      - registroCompleto: true
   
   d) Enviar correo de bienvenida
      - Credenciales de acceso
      - Botón "Ingresar a Mi Cuenta"
      - Listado de funcionalidades

5. Expositor puede iniciar sesión
   ↓
   Login → Dashboard del expositor
```

---

## 🔧 Funciones Implementadas

### **`/lib/firebase.ts`**

#### **1. createExpositorAccount()**
```typescript
// Crea cuenta de Firebase Auth
createExpositorAccount(email: string, password: string)

Returns: {
  success: true,
  uid: string,
  email: string
}

Errores:
- auth/email-already-in-use
- auth/invalid-email
- auth/weak-password
```

#### **2. loginExpositor()**
```typescript
// Inicia sesión
loginExpositor(email: string, password: string)

Returns: {
  success: true,
  uid: string,
  email: string
}

Errores:
- auth/user-not-found
- auth/wrong-password
- auth/invalid-credential
- auth/user-disabled
- auth/too-many-requests
```

#### **3. logoutExpositor()**
```typescript
// Cierra sesión
logoutExpositor()

Returns: { success: true }
```

#### **4. sendPasswordReset()**
```typescript
// Envía correo de recuperación
sendPasswordReset(email: string)

Returns: { success: true }

Errores:
- auth/user-not-found
- auth/invalid-email
```

#### **5. changePassword()**
```typescript
// Cambia contraseña del usuario actual
changePassword(newPassword: string)

Returns: { success: true }

Errores:
- auth/weak-password
- auth/requires-recent-login
```

#### **6. onAuthChange()**
```typescript
// Observador de estado de autenticación
onAuthChange(callback: (user: User | null) => void)

Returns: Unsubscribe function
```

#### **7. getCurrentUser()**
```typescript
// Obtiene usuario actual
getCurrentUser()

Returns: User | null
```

#### **8. sendWelcomeEmail()**
```typescript
// Envía correo de bienvenida
sendWelcomeEmail(
  email: string,
  nombre: string,
  empresa: string,
  dashboardUrl: string
)
```

---

## 📄 Páginas Creadas

### **1. LoginPage** (`/login`)

**Características:**
- Formulario de inicio de sesión
- Toggle para mostrar/ocultar contraseña
- Link a recuperar contraseña
- Redirección al dashboard después de login

**Componentes:**
- Input de email
- Input de contraseña (con toggle)
- Botón de iniciar sesión
- Link a recuperar contraseña
- Mensajes de error

---

### **2. RecoverPasswordPage** (`/recuperar-contrasena`)

**Características:**
- Formulario para solicitar recuperación
- Envío de correo de Firebase
- Pantalla de confirmación
- Link para volver al login

**Flujo:**
1. Usuario ingresa email
2. Click en "Enviar Enlace"
3. Firebase envía correo
4. Pantalla de confirmación
5. Usuario sigue enlace del correo
6. Firebase muestra página de reset
7. Usuario ingresa nueva contraseña

---

### **3. ChangePasswordPage** (`/cambiar-contrasena`)

**Características:**
- Solo accesible para usuarios autenticados
- Cambio de contraseña
- Validación de contraseñas
- Cierre de sesión automático después del cambio

**Validaciones:**
- Mínimo 6 caracteres
- Contraseñas deben coincidir
- Usuario debe estar autenticado

---

### **4. RegisterExpositorPage** (actualizada)

**Nuevos campos:**
- Password (contraseña)
- Confirm Password (confirmar contraseña)

**Nuevo flujo:**
1. Completa formulario
2. Crea cuenta Firebase Auth
3. Guarda datos en Firestore
4. Envía correo de bienvenida
5. Muestra pantalla de éxito con botón "Ingresar a Mi Cuenta"

---

## 🛣️ Rutas

```typescript
// App.tsx
<Route path="/login" component={LoginPage} />
<Route path="/recuperar-contrasena" component={RecoverPasswordPage} />
<Route path="/cambiar-contrasena" component={ChangePasswordPage} />
```

---

## 📧 Correo de Bienvenida

### **Contenido:**

```html
✅ Asunto: 🎉 ¡Bienvenido a Expo Empresarios de la Baja! - Acceso a tu cuenta

📋 Secciones:
1. Header con gradiente azul
2. Saludo personalizado
3. Confirmación de registro
4. ¿Qué puedes hacer con tu cuenta?
   - Editar información
   - Ver contactos interesados
   - Gestionar citas
   - Actualizar catálogo
   - Revisar estadísticas
5. Credenciales de acceso (email)
6. Botón CTA: "🚀 Ingresar a Mi Cuenta"
7. Información del evento
8. Footer
```

### **Personalización:**
- Nombre del expositor
- Nombre de la empresa
- Email de acceso
- Link al dashboard

---

## 💾 Datos Guardados en Firestore

### **Colección: `expositores`**

```typescript
{
  // Datos del expositor
  empresa: string,
  categoria: string,
  nombre: string,
  apellidos: string,
  email: string,
  telefono: string,
  logoUrl: string,
  imagenesGaleria: string[],
  
  // Autenticación
  userUid: string,  // ← UID de Firebase Auth
  
  // Estado
  status: "Pendiente" | "Completado" | "Activo" | "Inactivo",
  registroCompleto: boolean,
  
  // Fechas
  fechaRegistro: string,
  fechaActualizacion: string,
  
  // Historial
  historial: [
    {
      tipo: "registro_expositor_completado",
      fecha: string,
      descripcion: string
    }
  ]
}
```

**IMPORTANTE:** Las contraseñas **NUNCA** se guardan en Firestore. Solo se almacena el `userUid` para relacionar el expositor con su cuenta de Firebase Auth.

---

## 🔒 Seguridad

### **Contraseñas:**
- ✅ Encriptadas por Firebase Auth
- ✅ Nunca se almacenan en texto plano
- ✅ Nunca se guardan en Firestore
- ✅ Validación de fortaleza (mínimo 6 caracteres)

### **Autenticación:**
- ✅ Token de sesión manejado por Firebase
- ✅ Expiración automática de sesiones
- ✅ Protección contra ataques de fuerza bruta
- ✅ Rate limiting de Firebase

### **Recuperación:**
- ✅ Enlaces de recuperación con expiración
- ✅ Envío solo si el email existe
- ✅ No revela si el email está registrado (por seguridad)

---

## 🧪 Pruebas

### **1. Probar Registro Completo**

```bash
1. Crear expositor en CRM
   → Estado: "Pendiente"

2. Abrir enlace de registro
   → /registro-expositor?expositor=ABC123

3. Completar formulario
   - Llenar todos los campos
   - Crear contraseña (min 6 caracteres)
   - Confirmar contraseña

4. Enviar
   → Verificar:
   - Cuenta creada en Firebase Auth
   - Datos en Firestore con userUid
   - Estado cambiado a "Completado"
   - Correo de bienvenida recibido

5. Click en "Ingresar a Mi Cuenta"
   → Ir a /login
```

### **2. Probar Login**

```bash
1. Ir a /login

2. Ingresar credenciales
   - Email del expositor
   - Contraseña creada

3. Click "Iniciar Sesión"
   → Redirige a dashboard
```

### **3. Probar Recuperar Contraseña**

```bash
1. En /login, click "¿Olvidaste tu contraseña?"

2. Ingresar email

3. Click "Enviar Enlace"
   → Correo de Firebase enviado

4. Abrir correo
   → Click en enlace

5. Firebase muestra formulario
   → Ingresar nueva contraseña
```

### **4. Probar Cambiar Contraseña**

```bash
1. Iniciar sesión

2. Ir a /cambiar-contrasena

3. Ingresar nueva contraseña
   → Confirmar contraseña

4. Click "Cambiar Contraseña"
   → Sesión cerrada automáticamente
   → Redirige a /login

5. Intentar login con nueva contraseña
   → Debe funcionar
```

---

## 📊 Estados del Expositor

```
Pendiente   → Creado en CRM, esperando registro
   ↓
Completado  → Registro web completado, cuenta creada
   ↓
Activo      → (Manual) Activado por admin
   ↓
Inactivo    → (Manual) Desactivado por admin
```

---

## 🎨 UI/UX

### **Colores:**
- 🟠 Pendiente: Orange
- 🟢 Completado: Green
- 🔵 Activo: Blue
- 🔴 Inactivo: Red

### **Iconos:**
- 🔐 Login / Seguridad
- 📧 Email / Correos
- 🔑 Contraseña
- 👁️ Ver/Ocultar contraseña
- ✅ Éxito
- ❌ Error
- 🚀 Ingresar a cuenta

---

## 🚀 Próximos Pasos

1. **Dashboard de Expositor:**
   - Crear interfaz de dashboard
   - Ver/editar información
   - Exportar contactos interesados
   - Ver citas programadas

2. **Permisos:**
   - Reglas de Firestore para expositores
   - Solo pueden ver/editar su propia información

3. **Funcionalidades:**
   - QR Code del expositor
   - Escaneo de contactos
   - Chat con organizadores
   - Notificaciones

---

¡Sistema de autenticación completo e implementado! 🎉
