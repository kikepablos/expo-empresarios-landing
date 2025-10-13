# 👤 Sistema de Detalle de Invitado

Sistema completo de visualización de perfil de invitados con funcionalidades de registro de contactos y agendamiento de reuniones con calendario inteligente.

---

## 📋 Índice

1. [Características](#características)
2. [Páginas y Componentes](#páginas-y-componentes)
3. [Funciones Backend](#funciones-backend)
4. [Estructura de Datos](#estructura-de-datos)
5. [Flujo de Usuario](#flujo-de-usuario)
6. [Sistema de Calendario](#sistema-de-calendario)

---

## ✨ Características

### **1. Visualización de Perfil Completo**
- ✅ Información de contacto del invitado
- ✅ Horario de disponibilidad para reuniones
- ✅ Información del acompañante (si aplica)
- ✅ Datos de empresa y puesto
- ✅ Acceso mediante link con ID único

### **2. Registro de Contactos**
- ✅ Modal para registrar interacción
- ✅ Campos de nivel de interés y notas
- ✅ Guardado en Firestore
- ✅ Historial en perfil del invitado
- ✅ Requiere autenticación

### **3. Agendamiento de Reuniones**
- ✅ Calendario inteligente
- ✅ Respeta disponibilidad configurada
- ✅ Muestra solo horarios disponibles
- ✅ Slots de 30 minutos
- ✅ Evita doble reservación
- ✅ Fecha del evento: 21 de Noviembre 2025

---

## 📄 Páginas y Componentes

### **1. InvitadoDetailPage** (`/invitado/:id`)

**Ruta:** `/invitado/{invitado_id}`

**Características:**
- Acceso público mediante link
- Carga datos del invitado desde Firestore
- Layout con información y sidebar de acciones
- Protección: requiere login para acciones
- Redirección si invitado no existe

**Secciones:**
```
┌─────────────────────────────────────────┐
│ Header                                  │
│ - Nombre completo del invitado          │
│ - Empresa                               │
├──────────────────┬──────────────────────┤
│ Información      │ Sidebar de Acciones  │
│                  │                       │
│ - Contacto       │ 🟢 Registrar Contacto│
│ - Disponibilidad │ 📅 Agendar Reunión   │
│ - Acompañante    │                      │
│                  │ ℹ️ Info login         │
└──────────────────┴──────────────────────┘
```

**Props:**
- Obtiene `id` de URL params
- Carga usuario actual con `getCurrentUser()`
- Carga datos con `getInvitadoData()`

---

### **2. RegistrarContactoModal**

**Ubicación:** `/components/invitado/RegistrarContactoModal.tsx`

**Funcionalidad:**
- Modal con formulario de registro de contacto
- Campos:
  - Nivel de interés
  - Notas de conversación
- Estados:
  - Loading durante guardado
  - Success con confirmación visual
  - Error con mensajes específicos

**UI:**
```
┌─────────────────────────────────────┐
│ Registrar Contacto                  │
├─────────────────────────────────────┤
│ Nivel de Interés                    │
│ [Input: Alto, Medio, Bajo]          │
│                                     │
│ Notas de la Conversación            │
│ [Textarea]                          │
├─────────────────────────────────────┤
│ [Cancelar]  [Registrar Contacto]    │
└─────────────────────────────────────┘
```

**Validaciones:**
- Usuario debe estar autenticado
- Conexión a Firestore activa

**Resultado:**
- Guarda en `/empresas/{id}/contactosRegistrados`
- Agrega al historial del invitado
- Toast de confirmación
- Auto-cierre después de 2 segundos

---

### **3. AgendarReunionModal**

**Ubicación:** `/components/invitado/AgendarReunionModal.tsx`

**Funcionalidad:**
- Modal con calendario y formulario
- Respeta horarios de disponibilidad
- Evita conflictos de horarios
- Slots de 30 minutos

**Campos:**
1. **Fecha del Evento**
   - Select con fecha del evento
   - Muestra día de la semana
   - Indica si está disponible

2. **Hora de la Reunión**
   - Select dinámico según disponibilidad
   - Solo muestra horarios libres
   - Slots de 30 minutos
   - Filtra horarios ocupados

3. **Tema de la Reunión** *
   - Input requerido
   - Descripción breve del objetivo

4. **Notas Adicionales**
   - Textarea opcional
   - Objetivos, documentos, etc.

**UI:**
```
┌─────────────────────────────────────┐
│ Agendar Reunión                     │
├─────────────────────────────────────┤
│ 📅 Fecha del Evento                 │
│ [Select: 21 Nov 2025 (Viernes)]    │
│                                     │
│ 🕐 Hora de la Reunión               │
│ [Select: 09:00, 09:30, 10:00...]   │
│                                     │
│ Tema de la Reunión *                │
│ [Input]                             │
│                                     │
│ Notas Adicionales                   │
│ [Textarea]                          │
├─────────────────────────────────────┤
│ [Cancelar]  [Agendar Reunión]       │
└─────────────────────────────────────┘
```

**Lógica de Calendario:**

1. **Carga de disponibilidad:**
```javascript
// Mapeo de días de la semana
DIAS_SEMANA_MAP = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
}
```

2. **Generación de horarios:**
```javascript
// Obtener día de la semana de la fecha seleccionada
const dayOfWeek = new Date(selectedDate).getDay();
const diaKey = DIAS_SEMANA_MAP[dayOfWeek];

// Obtener configuración de ese día
const horario = invitado.horarioDisponibilidad[diaKey];

// Generar slots si el día está habilitado
if (horario.enabled) {
  // Crear slots de 30 min entre inicio y fin
  // Filtrar slots ya ocupados
}
```

3. **Prevención de conflictos:**
```javascript
// Cargar citas existentes del invitado
const citasExistentes = await getCitasDelInvitado(empresaId, invitadoId);

// Filtrar horarios disponibles
const horariosDisponibles = todosLosSlots.filter(slot => {
  return !citasExistentes.some(cita => 
    cita.fecha === selectedDate && 
    cita.hora === slot
  );
});
```

---

## 🔧 Funciones Backend

### **`/lib/firebase.ts`**

#### **1. registrarContactoInvitado()**
```typescript
registrarContactoInvitado(
  empresaId: string,
  invitadoId: string,
  userUid: string,
  data: {
    notas?: string,
    interes?: string
  }
): Promise<void>

Guarda en:
- /empresas/{id}/contactosRegistrados (nuevo documento)
- /empresas/{id}/contactos/{invitado_id}.historial (append)

Estructura de contacto registrado:
{
  invitadoId: string,
  userUid: string,
  notas: string,
  interes: string,
  fecha: ISOString,
  tipo: 'registro_contacto'
}
```

#### **2. agendarReunionConInvitado()**
```typescript
agendarReunionConInvitado(
  empresaId: string,
  invitadoId: string,
  userUid: string,
  data: {
    fecha: string,
    hora: string,
    tema: string,
    notas?: string
  }
): Promise<void>

Guarda en:
- /empresas/{id}/reuniones (nuevo documento)
- /empresas/{id}/contactos/{invitado_id}.historial (append)

Estructura de reunión:
{
  invitadoId: string,
  userUid: string,
  fecha: 'YYYY-MM-DD',
  hora: 'HH:MM',
  tema: string,
  notas: string,
  status: 'pendiente',
  fechaCreacion: ISOString
}
```

#### **3. getCitasDelInvitado()**
```typescript
getCitasDelInvitado(
  empresaId: string,
  invitadoId: string
): Promise<Cita[]>

Query:
- Colección: /empresas/{id}/reuniones
- Filtro: where('invitadoId', '==', invitadoId)

Retorna: Array de citas con { id, ...data }
```

---

## 💾 Estructura de Datos

### **Invitado (Contacto)**

```typescript
{
  // Identificación
  id: string,
  userUid?: string, // UID de Firebase Auth (si tiene cuenta)
  
  // Información Personal
  nombre: string,
  apellidos: string,
  email: string,
  telefono: string,
  lada: string,
  
  // Empresa
  empresa: string,
  puesto: string,
  direccion?: string,
  
  // Estado
  status: 'Confirmado' | 'Pendiente' | 'Cancelado',
  tipoContacto: 'invitado' | 'prospecto',
  tipoInvitado: 'colaborador' | 'invitado_especial',
  
  // Disponibilidad para Reuniones
  horarioDisponibilidad: {
    lunes: {
      enabled: boolean,
      inicio: 'HH:MM',
      fin: 'HH:MM'
    },
    martes: { ... },
    // ... resto de días
  },
  
  // Acompañante
  invitadoAcompanante?: {
    nombre: string,
    apellidos: string,
    email: string,
    telefono: string,
    puesto?: string,
    parentesco?: string
  },
  
  // Metadata
  codigoConfirmacion: string,
  fechaConfirmacion: ISOString,
  fechaRegistro: ISOString,
  fechaActualizacion: ISOString,
  
  // Historial
  historial: Array<{
    tipo: string,
    fecha: ISOString,
    descripcion: string,
    [key: string]: any
  }>
}
```

### **Contacto Registrado**

```typescript
// /empresas/{id}/contactosRegistrados/{contacto_id}
{
  invitadoId: string,      // Referencia al invitado
  userUid: string,         // Usuario que registró
  notas: string,
  interes: string,
  fecha: ISOString,
  tipo: 'registro_contacto'
}
```

### **Reunión**

```typescript
// /empresas/{id}/reuniones/{reunion_id}
{
  invitadoId: string,      // Con quién es la reunión
  userUid: string,         // Quién la agendó
  fecha: 'YYYY-MM-DD',     // Fecha de la reunión
  hora: 'HH:MM',           // Hora de inicio
  tema: string,            // Tema a tratar
  notas: string,           // Notas adicionales
  status: 'pendiente' | 'confirmada' | 'cancelada' | 'completada',
  fechaCreacion: ISOString
}
```

---

## 🔄 Flujo de Usuario

### **1. Acceso al Perfil del Invitado**

```
1. Usuario recibe link: /invitado/{id}
   ↓
2. Sistema carga InvitadoDetailPage
   ↓
3. Obtiene invitado_id de URL params
   ↓
4. Llama a getInvitadoData(empresaId, invitadoId)
   ↓
5. Si no existe → Redirige a Home
   ↓
6. Si existe → Muestra página de perfil
   ↓
7. Carga usuario actual (si hay sesión)
   ↓
8. Muestra botones de acción
```

### **2. Registrar Contacto**

```
1. Usuario hace click en "Registrar Contacto"
   ↓
2. Sistema verifica autenticación
   - Si no está loggeado → Mostrar mensaje
   ↓
3. Abre RegistrarContactoModal
   ↓
4. Usuario completa formulario:
   - Nivel de interés
   - Notas de conversación
   ↓
5. Click en "Registrar Contacto"
   ↓
6. Loading state activado
   ↓
7. Llamada a registrarContactoInvitado():
   a. Crea documento en contactosRegistrados
   b. Agrega entrada al historial del invitado
   ↓
8. Success → Muestra confirmación visual
   ↓
9. Auto-cierre después de 2 segundos
   ↓
10. Toast de éxito
```

### **3. Agendar Reunión**

```
1. Usuario hace click en "Agendar Reunión"
   ↓
2. Sistema verifica:
   - Usuario autenticado
   - Invitado tiene disponibilidad configurada
   ↓
3. Abre AgendarReunionModal
   ↓
4. Carga citas existentes del invitado
   ↓
5. Usuario selecciona fecha:
   - Select muestra: "21 de Noviembre, 2025 (Viernes)"
   - Sistema determina día de la semana
   - Obtiene horario configurado para ese día
   ↓
6. Sistema genera horarios disponibles:
   a. Lee horario.inicio y horario.fin
   b. Genera slots de 30 minutos
   c. Filtra slots ya ocupados
   d. Muestra solo disponibles
   ↓
7. Usuario selecciona hora disponible
   ↓
8. Usuario ingresa tema y notas
   ↓
9. Click en "Agendar Reunión"
   ↓
10. Validaciones:
    - Fecha seleccionada
    - Hora seleccionada
    - Tema ingresado
    ↓
11. Loading state activado
    ↓
12. Llamada a agendarReunionConInvitado():
    a. Crea documento en reuniones
    b. Agrega entrada al historial del invitado
    ↓
13. Success → Muestra confirmación
    - Fecha y hora de la reunión
    ↓
14. Auto-cierre después de 2 segundos
    ↓
15. Toast de éxito
```

---

## 📅 Sistema de Calendario

### **Características:**

1. **Fecha del Evento Fija**
   - 21 de Noviembre de 2025
   - Configurado en constante `EVENT_DATE`

2. **Slots de Tiempo**
   - Duración: 30 minutos
   - Formato: HH:MM (24 horas)
   - Ejemplo: 09:00, 09:30, 10:00, 10:30...

3. **Disponibilidad por Día**
   - Mapeo automático fecha → día de semana
   - Obtiene configuración del `horarioDisponibilidad`
   - Solo muestra si día está `enabled`

4. **Prevención de Conflictos**
   - Carga todas las citas existentes
   - Filtra horarios ya ocupados
   - Muestra solo slots libres

### **Ejemplo de Generación de Horarios:**

```javascript
// Configuración del invitado
horarioDisponibilidad: {
  viernes: {
    enabled: true,
    inicio: "09:00",
    fin: "18:00"
  }
}

// Citas existentes
[
  { fecha: "2025-11-21", hora: "10:00" },
  { fecha: "2025-11-21", hora: "14:30" }
]

// Horarios generados (disponibles)
[
  "09:00", "09:30", 
  // "10:00" ← OCUPADO
  "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00",
  // "14:30" ← OCUPADO
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
]
```

### **Lógica de Generación:**

```typescript
function generateAvailableHours(
  selectedDate: string,
  horarioDisponibilidad: any,
  citasExistentes: any[]
): string[] {
  // 1. Determinar día de la semana
  const date = new Date(selectedDate + 'T00:00:00');
  const dayOfWeek = date.getDay();
  const diaKey = DIAS_SEMANA_MAP[dayOfWeek];
  
  // 2. Obtener configuración del día
  const horario = horarioDisponibilidad[diaKey];
  
  if (!horario || !horario.enabled) {
    return [];
  }
  
  // 3. Parsear horas de inicio y fin
  const [startHour, startMin] = horario.inicio.split(':').map(Number);
  const [endHour, endMin] = horario.fin.split(':').map(Number);
  
  const hours: string[] = [];
  
  // 4. Generar slots de 30 minutos
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += 30) {
      const currentMinutes = h * 60 + m;
      const endMinutes = endHour * 60 + endMin;
      const startMinutes = startHour * 60 + startMin;
      
      // Verificar que está dentro del rango
      if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        
        // 5. Verificar si ya hay una cita en ese horario
        const citaExistente = citasExistentes.find(
          cita => cita.fecha === selectedDate && cita.hora === timeStr
        );
        
        // Solo agregar si no está ocupado
        if (!citaExistente) {
          hours.push(timeStr);
        }
      }
    }
  }
  
  return hours;
}
```

---

## 🎨 UI/UX

### **Página de Detalle:**
- Layout responsive
- Sidebar sticky en desktop
- Cards con información clara
- Iconos representativos
- Links clickeables (email, teléfono)

### **Disponibilidad:**
- Lista de días con horarios
- Color primario para destacar
- Formato legible (09:00 - 18:00)

### **Botones de Acción:**
- Verde para "Registrar Contacto"
- Azul para "Agendar Reunión"
- Disabled si no hay disponibilidad
- Mensaje si no está loggeado

### **Modales:**
- Dialog con overlay
- Animaciones suaves
- Estados de loading claros
- Confirmación visual después de éxito
- Auto-cierre con timeout

---

## 🔒 Seguridad

### **Autenticación:**
- Requiere login para acciones
- Verifica usuario actual
- Mensaje claro si no está autenticado

### **Validaciones:**
- Invitado debe existir
- Horarios deben estar configurados
- No permite doble reservación
- Campos requeridos en formularios

### **Datos:**
- IDs únicos para invitados
- Referencias cruzadas (userUid, invitadoId)
- Historial completo de acciones
- Timestamps automáticos

---

## 🛣️ Rutas

```typescript
/invitado/:id → InvitadoDetailPage

Params: { id: invitado_id }
Tipo: Público (acciones requieren login)
```

---

## 📦 Colecciones de Firestore

```
/empresas/{empresa_id}/
  ├── contactos/{contacto_id}          # Invitados
  ├── contactosRegistrados/{id}        # Contactos registrados
  └── reuniones/{id}                   # Reuniones agendadas
```

---

## 🧪 Para Probar

### **1. Acceder a Perfil de Invitado:**
```
1. Obtener ID de un invitado existente
2. Navegar a: /invitado/{id}
3. Ver información completa
4. Ver disponibilidad (si está configurada)
```

### **2. Registrar Contacto:**
```
1. Estar loggeado
2. Click en "Registrar Contacto"
3. Llenar nivel de interés y notas
4. Click "Registrar Contacto"
5. Ver confirmación visual
6. Verificar en Firestore:
   - /empresas/{id}/contactosRegistrados
   - /empresas/{id}/contactos/{invitado_id}.historial
```

### **3. Agendar Reunión:**
```
1. Estar loggeado
2. Click en "Agendar Reunión"
3. Seleccionar fecha: 21 Nov 2025
4. Ver horarios disponibles
5. Seleccionar hora libre
6. Ingresar tema y notas
7. Click "Agendar Reunión"
8. Ver confirmación con fecha/hora
9. Verificar en Firestore:
   - /empresas/{id}/reuniones
   - /empresas/{id}/contactos/{invitado_id}.historial
```

### **4. Calendario Inteligente:**
```
1. Configurar disponibilidad de invitado:
   viernes: 09:00 - 18:00
2. Agendar reunión para 10:00
3. Intentar agendar otra a las 10:00
4. Verificar que 10:00 no aparezca en select
5. Ver que 10:30 sí está disponible
```

---

¡Sistema de detalle de invitado completo y funcional! 🎉

Los usuarios ahora pueden:
- ✅ Ver perfil completo de invitados mediante link
- ✅ Registrar contactos con notas
- ✅ Agendar reuniones con calendario inteligente
- ✅ Respetar disponibilidad configurada
- ✅ Evitar conflictos de horarios
