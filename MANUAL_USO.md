# Manual de Uso - Expo Empresarios de la Baja

## 📋 Flujo Completo del Sistema

### 1. Registro de Invitados (CRM)

#### Paso 1: Crear Invitado
1. Acceder al CRM en `/expo/invitados`
2. Click en "Nuevo Invitado"
3. Completar formulario con datos básicos:
   - Nombre y apellidos
   - Email
   - Teléfono
   - Empresa
   - Puesto
4. Guardar invitado

#### Paso 2: Enviar Invitación
1. El sistema genera automáticamente un código de confirmación
2. Se envía correo con link personalizado:
   - Link: `https://expo-empresarios-de-la-baja.web.app/registro?invitado={ID}`
3. El invitado recibe el correo y puede completar su registro

#### Paso 3: Invitado Completa Registro
1. Invitado hace click en el link del correo
2. Landing page carga datos prellenados
3. Invitado completa información adicional:
   - Tipo de invitado (sin invitado, invitado personal, colaborador)
   - Datos del acompañante (si aplica)
   - Notas adicionales
4. Sistema actualiza Firestore con `registroCompleto: true`
5. Se genera código de confirmación

### 2. Registro de Expositores (CRM)

#### Paso 1: Crear Expositor
1. Acceder al CRM en `/expo/expositores`
2. Click en "Nuevo Expositor"
3. Completar formulario:
   - Logo cuadrado (con recorte)
   - Información de la empresa
   - Categoría
   - ID de Stand
   - Descripción (hasta 1000 caracteres)
   - Galería de imágenes
   - Datos de contacto
4. Guardar expositor

#### Paso 2: Enviar Invitación al Expositor
```typescript
// TODO: Implementar en FormExpositores.tsx
await enviarCorreoInvitacionExpositor(
  email,
  nombre,
  empresa,
  expositorId
);
```

#### Paso 3: Expositor Completa Registro
1. Expositor recibe correo con link:
   - Link: `https://expo-empresarios-de-la-baja.web.app/registro-expositor?expositor={ID}`
2. Completa formulario en landing page:
   - Logo cuadrado
   - Descripción de productos/servicios
   - Galería de imágenes
   - Información de contacto
3. Sistema sube archivos a Firebase Storage
4. Actualiza Firestore con `registroCompleto: true`

### 3. Módulo de Registro (Día del Evento)

#### Paso 1: Acceder al Módulo
1. En el CRM, ir a `/expo/registro`
2. Ver lista de invitados confirmados

#### Paso 2: Buscar Invitado
- Buscar por:
  - Código de confirmación
  - Nombre
  - Correo
  - Teléfono
- Filtrar por estatus:
  - Pendientes
  - Registrados

#### Paso 3: Registrar Entrada
1. Click en "Registrar" en la fila del invitado
2. Se abre modal con:
   - Vista previa del gafete
   - Información del invitado
   - Botón de descarga PDF
3. Click en "Confirmar Registro y Enviar Correo"
4. Sistema:
   - Envía correo con itinerario del evento
   - Actualiza `registroEstatus` a "registrado"
   - Guarda `fechaRegistro`

#### Paso 4: Imprimir Gafete
1. Click en "Descargar Gafete"
2. Se genera PDF con:
   - Logo del evento
   - Nombre del invitado
   - Empresa y puesto
   - QR code
   - Badge number
3. Imprimir en formato media carta

### 4. Sistema de Rifas

#### TODO: Implementar Sistema de Tómbola
```
Funcionalidad pendiente:
- Cuando un invitado complete visita a todos los stands
- Sistema debe permitir participar en la rifa
- Agregar boleto a la tómbola digital
- Mecánica de sorteo durante el evento
```

**Propuesta de implementación:**
1. Agregar campo `standsVisitados: string[]` en invitados
2. Crear módulo `/expo/tómbola` en CRM
3. Cuando invitado visite todos los stands → activar boleto
4. Sistema de sorteo aleatorio para rifas

---

## 🔧 TODOs Pendientes

### 1. Cambio de Imágenes
```
TODO: Cambiar las fotos de la web por fotos de Hoteleros y Restauranteros
- Ubicación: /client/src/assets/generated_images/
- Reemplazar imágenes actuales por fotos reales del evento
- Mantener nombres de archivo o actualizar imports en Home.tsx
```

### 2. Formulario de Contacto
```
TODO: Implementar envío de correo a 5 destinatarios
- Archivo: /client/src/components/ContactSection.tsx
- Líneas: 37-65 (código comentado)
- Agregar los 5 correos de destino
- Descomentar y probar funcionalidad
```

### 3. Sistema de Tómbola/Rifa
```
TODO: Crear sistema para participación en rifas
- Detectar cuando invitado complete todos los stands
- Activar boleto para participar
- Sistema de sorteo digital
- Integración con módulo de registro
```

### 4. Botón de Enviar Invitación a Expositores
```
TODO: Agregar botón en FormExpositores.tsx
- Ubicación: /advance_crm/src/components/expo/expositores/FormExpositores.tsx
- Agregar botón "Enviar Invitación"
- Llamar a enviarCorreoInvitacionExpositor() desde firebase.ts
```

### 5. Manual de Usuario Final
```
TODO: Crear manual en PDF para usuarios finales
- Paso a paso con capturas de pantalla
- Desde creación de invitados hasta registro en evento
- Incluir troubleshooting común
```

---

## 📧 Configuración de Correos

### Correos que se envían automáticamente:

1. **Invitación a Invitado**
   - Trigger: Al crear invitado en CRM
   - Contenido: Link de registro personalizado
   - Template: En `firebase.ts` → `enviarCorreoConfirmacion()`

2. **Invitación a Expositor**
   - Trigger: Al crear expositor en CRM (manual)
   - Contenido: Link de registro personalizado
   - Template: En `firebase.ts` → `enviarCorreoInvitacionExpositor()`

3. **Confirmación de Registro (Día del Evento)**
   - Trigger: Al registrar entrada en módulo de registro
   - Contenido: Itinerario completo del evento
   - Template: En `emailService.ts` del CRM

4. **Contacto desde Web**
   - Trigger: Al enviar formulario de contacto
   - Destinatarios: 5 correos (pendiente configurar)
   - Template: En `ContactSection.tsx`

---

## 🚀 Deploy y Actualización

### Landing Page
```bash
cd convencion_cabos_landing
npm run build
firebase deploy --only hosting:expo-empresarios
```

### CRM
```bash
cd advance_crm
npm run build
# Deploy según configuración del proyecto
```

---

## 📱 URLs del Sistema

- **Landing Page**: https://expo-empresarios-de-la-baja.web.app
- **Registro Invitados**: https://expo-empresarios-de-la-baja.web.app/registro?invitado={ID}
- **Registro Expositores**: https://expo-empresarios-de-la-baja.web.app/registro-expositor?expositor={ID}
- **Galería**: https://expo-empresarios-de-la-baja.web.app/galeria

---

## 🐛 Problemas Conocidos y Soluciones

### Problema: Navegación se pone en negro
**Solución**: Este problema fue reportado por el cliente. Verificar:
1. Que no haya errores de JavaScript en consola
2. Que las rutas estén correctamente configuradas
3. Que los componentes se carguen correctamente

### Problema: Botones de navegación no funcionan desde galería
**Solución**: Ya corregido. La navegación ahora:
1. Detecta la página actual
2. Navega a home si es necesario
3. Hace scroll a la sección correspondiente

---

## 📞 Soporte

Para dudas o problemas:
- Email: registro@expoempresarioslabaja.com
- Revisar este manual
- Consultar código comentado con TODOs
