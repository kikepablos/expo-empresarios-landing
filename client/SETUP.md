# Setup - Página de Registro con Firebase

## Instalación de dependencias

Primero, instala Firebase SDK:

```bash
npm install firebase
```

## Configuración de variables de entorno

1. Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Completa las variables de entorno con tus credenciales de Firebase:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
VITE_EMPRESA_ID=advance-medical-68626
```

## Cómo funciona

### 1. Flujo con ID de invitado (desde correo)

Cuando un invitado hace click en el botón del correo de invitación:

```
https://convencion-cabos.web.app/registro?invitado=abc123xyz
```

La página:
1. Obtiene el ID del invitado desde la URL (`?invitado=abc123xyz`)
2. Carga los datos del invitado desde Firestore:
   - Ruta: `empresas/{empresaId}/contactos/{invitadoId}`
3. Prellena el formulario con los datos existentes:
   - Nombre
   - Apellidos
   - Teléfono
   - Email
   - Empresa
   - Puesto
4. El usuario completa los datos adicionales:
   - Tipo de invitado (sin invitado, invitado personal, colaborador)
   - Datos del acompañante (si aplica)
   - Notas
5. Al enviar, actualiza el documento en Firestore con:
   - Todos los datos del formulario
   - `status: 'Confirmado'`
   - `registroCompleto: true`
   - `fechaActualizacion: timestamp`

### 2. Flujo sin ID (registro directo)

Cuando alguien accede directamente a `/registro`:

1. No hay ID en la URL
2. El formulario está vacío
3. Al enviar, llama a la función de Firebase (`submitRegistration`)
4. La función crea un nuevo registro

## Estructura de datos en Firestore

### Documento del invitado

```typescript
{
  // Datos originales (del CRM)
  nombre: string,
  apellidos: string,
  email: string,
  telefono: string,
  empresa: string,
  puesto: string,
  tipoContacto: 'invitado',
  status: 'Pendiente' | 'Confirmado',
  fechaRegistro: string,
  
  // Datos agregados al completar el registro
  tipoInvitado: 'sin invitado' | 'invitado personal' | 'colaborador',
  invitadoAcompanante: {
    nombre: string,
    apellidos: string,
    telefono: string,
    email: string,
    puesto?: string,        // Si es colaborador
    parentesco?: string,    // Si es invitado personal
  } | null,
  notas: string,
  registroCompleto: boolean,
  fechaActualizacion: string,
}
```

## Reglas de seguridad de Firestore

Agrega estas reglas para permitir que la landing page lea y actualice invitados:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura y actualización de invitados
    match /empresas/{empresaId}/contactos/{contactoId} {
      allow read: if true;
      allow update: if request.resource.data.tipoContacto == 'invitado';
    }
  }
}
```

## Testing

### 1. Probar con ID de invitado

```
http://localhost:5173/registro?invitado=ID_DEL_INVITADO
```

Deberías ver:
- El formulario prellenado con los datos del invitado
- El título "Completa tu registro"
- Al enviar, se actualiza el documento en Firestore

### 2. Probar sin ID

```
http://localhost:5173/registro
```

Deberías ver:
- El formulario vacío
- El título "Regístrate para la 12ª Expo Empresarios"
- Al enviar, se llama a la función de Firebase

## Troubleshooting

### Error: "Cannot find module 'firebase/app'"

Instala Firebase:
```bash
npm install firebase
```

### Error: "Permission denied"

Verifica las reglas de seguridad de Firestore.

### Los datos no se prellenan

1. Verifica que el ID del invitado sea correcto
2. Abre la consola del navegador para ver errores
3. Verifica que el invitado exista en Firestore:
   - Ruta: `empresas/advance-medical-68626/contactos/{invitadoId}`

### El formulario no se envía

1. Verifica que todos los campos requeridos estén llenos
2. Abre la consola del navegador para ver errores
3. Verifica la configuración de Firebase en `.env`
