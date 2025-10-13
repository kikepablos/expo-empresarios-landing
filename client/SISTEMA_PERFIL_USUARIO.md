# 👤 Sistema de Perfil de Usuario

Sistema completo de gestión de perfil para expositores y contactos con edición de datos, cambio de contraseña y configuración de disponibilidad.

---

## 📋 Índice

1. [Características](#características)
2. [Tipos de Usuario](#tipos-de-usuario)
3. [Funciones Implementadas](#funciones-implementadas)
4. [Páginas y Componentes](#páginas-y-componentes)
5. [Estructura de Datos](#estructura-de-datos)
6. [Flujo de Usuario](#flujo-de-usuario)

---

## ✨ Características

### **1. Visualización de Perfil**
- ✅ Información personal completa
- ✅ Datos de contacto
- ✅ Logo (expositores)
- ✅ Información de empresa
- ✅ Estado de cuenta
- ✅ Historial y fechas

### **2. Edición de Datos**
- ✅ Actualizar información personal
- ✅ Cambiar datos de contacto
- ✅ Actualizar logo (expositores)
- ✅ Modificar descripción de empresa
- ✅ Editar categoría y sitio web

### **3. Cambio de Contraseña**
- ✅ Cambiar contraseña segura
- ✅ Validación de contraseñas
- ✅ Confirmación de contraseña
- ✅ Mensajes de seguridad

### **4. Horario de Disponibilidad**
- ✅ Configurar días disponibles
- ✅ Definir horarios por día
- ✅ Copiar horario a múltiples días
- ✅ Vista previa y resumen
- ✅ Validación de horarios

---

## 👥 Tipos de Usuario

### **Expositor**
**Ubicación:** `/empresas/{empresa_id}/expositores/{expositor_id}`

**Campos Disponibles:**
- Nombre y apellidos
- Email y teléfono
- Empresa y categoría
- Logo de empresa
- Descripción
- Dirección
- Sitio web
- ID de Stand
- Galería de imágenes
- Horario de disponibilidad

### **Contacto**
**Ubicación:** `/empresas/{empresa_id}/contactos/{contacto_id}`

**Campos Disponibles:**
- Nombre y apellidos
- Email y teléfono
- Empresa y puesto
- Dirección (opcional)
- Información de acompañante
- Horario de disponibilidad

---

## 🔧 Funciones Implementadas

### **`/lib/firebase.ts`**

#### **1. getUserProfile()**
```typescript
// Obtiene el perfil del usuario actual (expositor o contacto)
getUserProfile(empresaId: string)

Returns: {
  id: string,
  tipo: 'expositor' | 'contacto',
  ...userData
} | null

Funcionamiento:
1. Obtiene el UID del usuario autenticado
2. Busca en colección de expositores
3. Si no encuentra, busca en contactos
4. Retorna los datos con el tipo de usuario
```

#### **2. updateUserProfile()**
```typescript
// Actualiza el perfil del usuario
updateUserProfile(
  empresaId: string, 
  userId: string, 
  userType: string, 
  data: any
)

Returns: { success: true }

Actualiza:
- Datos del perfil
- Agrega fechaActualizacion automáticamente
- Guarda en la colección correspondiente
```

---

## 📄 Páginas y Componentes

### **1. ProfilePage** (`/mi-perfil`)

**Ruta:** `/mi-perfil`

**Estructura:**
- Navegación con tabs
- 4 secciones principales
- Detección automática de tipo de usuario
- Protección de ruta (requiere login)

**Tabs:**
1. **Información** - Vista de solo lectura
2. **Editar Datos** - Formulario de edición
3. **Contraseña** - Cambiar contraseña
4. **Disponibilidad** - Horarios de reuniones

---

### **2. ProfileInfo Component**

**Ubicación:** `/components/profile/ProfileInfo.tsx`

**Funcionalidad:**
- Muestra toda la información del usuario
- Adaptado según tipo (expositor/contacto)
- Logo para expositores
- Información de acompañante (contactos)
- Campos con iconos
- Links clickeables (email, teléfono, web)
- Estado con badge colorido
- Fechas de registro y actualización

**Vista:**
```
┌─────────────────────────────────────┐
│    Logo (si es expositor)           │
├─────────────────────────────────────┤
│ Grid de información:                │
│ 📧 Email    📞 Teléfono             │
│ 🏢 Empresa   💼 Puesto/Categoría    │
│ 📍 Dirección 🌐 Sitio Web           │
│ 📅 Estado                           │
├─────────────────────────────────────┤
│ Descripción (expositores)           │
│ Acompañante (contactos)             │
├─────────────────────────────────────┤
│ Fechas: Registro | Actualización    │
└─────────────────────────────────────┘
```

---

### **3. ProfileEdit Component**

**Ubicación:** `/components/profile/ProfileEdit.tsx`

**Funcionalidad:**
- Formulario completo de edición
- Subida de logo (expositores)
- Campos adaptados por tipo de usuario
- Validación de datos
- Confirmación antes de guardar
- Mensajes de éxito/error

**Campos Expositor:**
- Logo (imagen)
- Nombre y apellidos
- Email y teléfono
- Empresa
- Categoría (select)
- ID de Stand
- Dirección
- Sitio Web
- Descripción (textarea)

**Campos Contacto:**
- Nombre y apellidos
- Email y teléfono
- Empresa/Organización
- Puesto
- Dirección (opcional)

**Botones:**
- ❌ Cancelar (volver a vista)
- 💾 Guardar Cambios

---

### **4. ProfilePassword Component**

**Ubicación:** `/components/profile/ProfilePassword.tsx`

**Funcionalidad:**
- Cambiar contraseña
- Validación de longitud (min 6 caracteres)
- Confirmación de contraseña
- Toggle para mostrar/ocultar
- Mensaje de éxito
- Manejo de errores específicos

**Validaciones:**
- Mínimo 6 caracteres
- Contraseñas deben coincidir
- Mensaje si requiere re-autenticación

**Vista:**
```
┌─────────────────────────────────────┐
│ Cambiar Contraseña                  │
├─────────────────────────────────────┤
│ Nueva Contraseña*       [👁️]        │
│ Confirmar Contraseña*               │
├─────────────────────────────────────┤
│ ⚠️ Importante: Si acabas de...     │
├─────────────────────────────────────┤
│              [Cambiar Contraseña]   │
└─────────────────────────────────────┘
```

---

### **5. ProfileSchedule Component**

**Ubicación:** `/components/profile/ProfileSchedule.tsx`

**Funcionalidad:**
- Configurar disponibilidad por día
- Horarios de inicio y fin
- Toggle para habilitar/deshabilitar días
- Aplicar horario a todos los días
- Validación de horarios
- Vista previa de días disponibles

**Estructura de Horario:**
```typescript
{
  lunes: {
    enabled: boolean,
    inicio: "09:00",
    fin: "18:00"
  },
  martes: { ... },
  miercoles: { ... },
  ...
}
```

**Características:**
- 7 días de la semana
- Selección de horas (00:00 - 23:00)
- Validación: fin > inicio
- Botón "Aplicar a todos"
- Contador de días disponibles

**Vista:**
```
┌─────────────────────────────────────┐
│ Horario de Disponibilidad           │
├─────────────────────────────────────┤
│ 📅 Fecha del evento: 21 Nov 2025    │
├─────────────────────────────────────┤
│ Lunes    [✓] 09:00 — 18:00         │
│ Martes   [✓] 09:00 — 18:00         │
│ Miércoles[ ] No disponible          │
│ Jueves   [✓] 09:00 — 18:00         │
│ Viernes  [✓] 09:00 — 18:00         │
│ Sábado   [ ] No disponible          │
│ Domingo  [ ] No disponible          │
├─────────────────────────────────────┤
│ Resumen: 4 de 7 días disponibles    │
├─────────────────────────────────────┤
│              [Guardar Disponibilidad]│
└─────────────────────────────────────┘
```

---

## 💾 Estructura de Datos

### **Expositor**

```typescript
{
  // Identificación
  id: string,
  tipo: 'expositor',
  userUid: string,  // UID de Firebase Auth
  
  // Información Personal
  nombre: string,
  apellidos: string,
  email: string,
  telefono: string,
  lada: string,
  
  // Empresa
  empresa: string,
  categoria: string,
  descripcion: string,
  direccion: string,
  sitioWeb: string,
  idStand: string,
  
  // Multimedia
  logoUrl: string,
  imagenesGaleria: string[],
  
  // Estado
  status: 'Pendiente' | 'Completado' | 'Activo' | 'Inactivo',
  registroCompleto: boolean,
  
  // Disponibilidad
  horarioDisponibilidad: {
    lunes: { enabled: boolean, inicio: string, fin: string },
    martes: { enabled: boolean, inicio: string, fin: string },
    // ... resto de días
  },
  
  // Metadata
  fechaRegistro: string,
  fechaCreacion: Timestamp,
  fechaActualizacion: string,
  eliminado: boolean,
  notas: string,
  tags: string[],
  historial: Array<{
    tipo: string,
    fecha: string,
    descripcion: string
  }>
}
```

### **Contacto**

```typescript
{
  // Identificación
  id: string,
  tipo: 'contacto',
  userUid: string,  // UID de Firebase Auth
  
  // Información Personal
  nombre: string,
  apellidos: string,
  email: string,
  telefono: string,
  lada: string,
  
  // Empresa
  empresa: string,
  puesto: string,
  direccion: string,
  
  // Acompañante (opcional)
  invitadoAcompanante: {
    nombre: string,
    apellidos: string,
    email: string,
    telefono: string,
    puesto: string
  },
  
  // Estado
  status: 'Confirmado' | 'Pendiente' | 'Cancelado',
  registroCompleto: boolean,
  tipoContacto: 'invitado' | 'prospecto',
  tipoInvitado: 'colaborador' | 'invitado_especial',
  
  // Confirmación
  codigoConfirmacion: string,
  fechaConfirmacion: string,
  
  // Disponibilidad
  horarioDisponibilidad: {
    lunes: { enabled: boolean, inicio: string, fin: string },
    // ... resto de días
  },
  
  // Metadata
  fechaRegistro: string,
  created_at: string,
  eliminado: boolean,
  canal: string,
  notas: string,
  tags: string[]
}
```

---

## 🔄 Flujo de Usuario

### **1. Acceso al Perfil**

```
1. Usuario loggeado
   ↓
2. Click en menú usuario → "Mi Perfil"
   ↓
3. Redirige a /mi-perfil
   ↓
4. Sistema detecta:
   - Obtiene getCurrentUser()
   - Busca en expositores (userUid)
   - Si no encuentra, busca en contactos
   - Determina tipo de usuario
   ↓
5. Carga ProfilePage con datos
   ↓
6. Muestra 4 tabs disponibles
```

### **2. Ver Información**

```
Tab "Información"
   ↓
   ✅ Logo (si es expositor)
   ✅ Datos personales
   ✅ Datos de contacto
   ✅ Información de empresa
   ✅ Estado actual
   ✅ Descripción (expositor)
   ✅ Acompañante (contacto)
   ✅ Fechas
```

### **3. Editar Datos**

```
Tab "Editar Datos"
   ↓
1. Formulario precargado
   ↓
2. Usuario modifica campos
   ↓
3. (Opcional) Sube nuevo logo
   ↓
4. Click "Guardar Cambios"
   ↓
5. Validaciones:
   - Campos requeridos
   - Formato de email
   - Formato de URL
   ↓
6. Si hay logo nuevo:
   - Subir a Storage
   - Obtener URL
   ↓
7. Actualizar Firestore:
   - Guardar datos
   - Actualizar fechaActualizacion
   ↓
8. Mensaje de éxito
   ↓
9. Recargar perfil
   ↓
10. Volver a tab "Información"
```

### **4. Cambiar Contraseña**

```
Tab "Contraseña"
   ↓
1. Ingresar nueva contraseña
   ↓
2. Confirmar contraseña
   ↓
3. Validaciones:
   - Mínimo 6 caracteres
   - Contraseñas coinciden
   ↓
4. Click "Cambiar Contraseña"
   ↓
5. Firebase Auth actualiza
   ↓
6. Mensaje de éxito
   ↓
7. Limpiar formulario
```

**Casos especiales:**
- Si requiere re-autenticación → Mensaje específico
- Si contraseña débil → Error con detalle
- Si falla conexión → Error de red

### **5. Configurar Disponibilidad**

```
Tab "Disponibilidad"
   ↓
1. Ver horarios actuales (o defaults)
   ↓
2. Para cada día:
   - Toggle on/off
   - Seleccionar hora inicio
   - Seleccionar hora fin
   ↓
3. (Opcional) "Aplicar a todos"
   - Copia primer día habilitado
   ↓
4. Validaciones:
   - Hora fin > hora inicio
   - Por cada día habilitado
   ↓
5. Click "Guardar Disponibilidad"
   ↓
6. Guardar en Firestore:
   - Campo horarioDisponibilidad
   - Actualizar fechaActualizacion
   ↓
7. Mensaje de éxito
   ↓
8. Recargar perfil
```

---

## 🎨 UI/UX

### **Tabs de Navegación:**
- ✅ 4 tabs claramente identificados
- ✅ Iconos representativos
- ✅ Responsive (oculta texto en mobile)
- ✅ Estado activo visible

### **Información:**
- ✅ Cards organizados
- ✅ Iconos con cada campo
- ✅ Links clickeables
- ✅ Badge de estado colorido
- ✅ Secciones separadas

### **Edición:**
- ✅ Formulario estructurado
- ✅ Placeholders útiles
- ✅ Campos adaptados por tipo
- ✅ Botones de acción claros
- ✅ Loading states

### **Contraseña:**
- ✅ Toggle mostrar/ocultar
- ✅ Indicadores de validación
- ✅ Mensajes de ayuda
- ✅ Alertas de seguridad

### **Disponibilidad:**
- ✅ Switch intuitivo por día
- ✅ Selects de hora
- ✅ Días deshabilitados en gris
- ✅ Resumen de disponibilidad
- ✅ Botón de aplicar a todos

---

## 🔒 Seguridad

### **Autenticación:**
- ✅ Requiere login para acceder
- ✅ Verifica usuario actual
- ✅ Redirecciona si no autenticado

### **Autorización:**
- ✅ Solo puede ver/editar su propio perfil
- ✅ Búsqueda por userUid
- ✅ No acceso a otros perfiles

### **Validaciones:**
- ✅ Campos requeridos marcados
- ✅ Validación de formatos
- ✅ Validación de contraseña
- ✅ Validación de horarios

### **Datos:**
- ✅ Contraseñas nunca en Firestore
- ✅ Solo UID de autenticación
- ✅ Timestamps automáticos
- ✅ Historial de cambios

---

## 🛣️ Rutas

```typescript
/mi-perfil → ProfilePage

Protegida: Sí
Requiere: Usuario autenticado
Tipos: Expositor | Contacto
```

---

## 🧪 Para Probar

### **1. Acceso al Perfil**
```
1. Iniciar sesión
2. Click en icono de usuario (navbar)
3. Click en "Mi Perfil"
4. Ver página de perfil cargada
```

### **2. Ver Información**
```
1. Tab "Información" activo
2. Ver todos los datos del usuario
3. Verificar logo (si es expositor)
4. Ver estado con color correcto
5. Ver fechas formateadas
```

### **3. Editar Datos**
```
1. Click en tab "Editar Datos"
2. Modificar campos
3. (Expositor) Subir nuevo logo
4. Click "Guardar Cambios"
5. Ver mensaje de éxito
6. Verificar cambios en tab "Información"
```

### **4. Cambiar Contraseña**
```
1. Click en tab "Contraseña"
2. Ingresar nueva contraseña (min 6 chars)
3. Confirmar contraseña
4. Click "Cambiar Contraseña"
5. Ver mensaje de éxito
6. (Opcional) Cerrar sesión y probar nueva contraseña
```

### **5. Configurar Disponibilidad**
```
1. Click en tab "Disponibilidad"
2. Habilitar/deshabilitar días
3. Configurar horarios
4. Click "Aplicar primer horario a todos"
5. Ajustar horarios específicos
6. Click "Guardar Disponibilidad"
7. Ver mensaje de éxito
8. Recargar y verificar horarios guardados
```

---

## 📊 Campos por Tipo

### **Comunes (Ambos Tipos):**
- ✅ Nombre
- ✅ Apellidos
- ✅ Email
- ✅ Teléfono (con lada)
- ✅ Empresa
- ✅ Dirección (opcional)
- ✅ Horario de disponibilidad
- ✅ Estado
- ✅ Fechas

### **Solo Expositores:**
- ✅ Logo
- ✅ Categoría
- ✅ Descripción
- ✅ Sitio Web
- ✅ ID de Stand
- ✅ Galería de imágenes

### **Solo Contactos:**
- ✅ Puesto
- ✅ Tipo de contacto
- ✅ Tipo de invitado
- ✅ Información de acompañante
- ✅ Código de confirmación

---

## 🚀 Próximas Mejoras

1. **Notificaciones:**
   - Email cuando se actualiza perfil
   - Notificación de cambio de contraseña
   - Recordatorio de completar disponibilidad

2. **Historial:**
   - Ver historial de cambios
   - Quién y cuándo se modificó

3. **Seguridad:**
   - Verificación en dos pasos
   - Historial de sesiones
   - Dispositivos conectados

4. **Disponibilidad:**
   - Vista de calendario
   - Sincronización con citas
   - Bloqueo automático de horarios ocupados

---

¡Sistema de perfil completo e implementado! 🎉

Los usuarios ahora pueden gestionar toda su información personal desde un solo lugar.
