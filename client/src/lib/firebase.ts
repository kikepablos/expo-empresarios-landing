import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };

/**
 * Obtiene los datos de un invitado desde Firestore
 */
export async function getInvitadoData(empresaId: string, invitadoId: string): Promise<any> {
  try {
    const invitadoRef = doc(db, `empresas/${empresaId}/contactos/${invitadoId}`);
    const invitadoSnap = await getDoc(invitadoRef);

    if (invitadoSnap.exists()) {
      return {
        id: invitadoSnap.id,
        ...invitadoSnap.data(),
      };
    }

    return null;
  } catch (error) {
    console.error('Error al obtener datos del invitado:', error);
    throw error;
  }
}

/**
 * Actualiza los datos de un invitado en Firestore
 */
export async function updateInvitadoData(
  empresaId: string,
  invitadoId: string,
  data: any
) {
  try {
    const fechaActual = new Date().toISOString();
    const invitadoRef = doc(db, `empresas/${empresaId}/contactos/${invitadoId}`);
    
    // Obtener el invitado actual para mantener su historial
    const invitadoSnap = await getDoc(invitadoRef);
    const invitadoActual = invitadoSnap.exists() ? invitadoSnap.data() : null;
    const historialActual = invitadoActual?.historial || [];
    
    await updateDoc(invitadoRef, {
      ...data,
      fechaActualizacion: fechaActual,
      registroCompleto: true,
      historial: [
        ...historialActual,
        {
          tipo: 'registro_con_invitacion',
          fecha: fechaActual,
          descripcion: `Registro completado desde el formulario web con invitación previa. ${data.tipoInvitado === 'sin invitado' ? 'Sin acompañante' : 'Con acompañante'}`,
        }
      ],
    });

    return { success: true };
  } catch (error) {
    console.error('Error al actualizar datos del invitado:', error);
    throw error;
  }
}

/**
 * Crea una nueva solicitud en Firestore
 */
export async function crearSolicitud(
  empresaId: string,
  data: any
) {
  try {
    const fechaActual = new Date().toISOString();
    const solicitudesRef = collection(db, `empresas/${empresaId}/solicitudes`);
    const docRef = await addDoc(solicitudesRef, {
      ...data,
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp(),
      status: 'Pendiente',
      historial: [
        {
          tipo: 'solicitud_creada',
          fecha: fechaActual,
          descripcion: `Solicitud de acceso creada desde el formulario web sin invitación previa`,
        }
      ],
    });

    console.log('Solicitud creada con ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    throw error;
  }
}

/**
 * Genera un código de confirmación único
 */
export function generarCodigoConfirmacion(): string {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
}

/**
 * Envía un correo de recepción de solicitud
 */
export async function enviarCorreoSolicitud(
  email: string,
  nombre: string,
  apellidos: string
) {
  try {
    console.log('Enviando correo de solicitud a:', email);
    const emailAPIUrl = 'https://us-central1-advance-medical-68626.cloudfunctions.net/emailAPI/sendEmail';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          h1 { margin: 0; font-size: 28px; }
          h2 { color: #667eea; margin-top: 0; }
          ul { padding-left: 20px; }
          li { margin: 10px 0; }
          .highlight { color: #667eea; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Gracias por tu interés! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre} ${apellidos},</h2>
            <p>¡Muchas gracias por tu interés en participar en la <strong>12ª Expo Empresarios de la Baja</strong>!</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">📋 Hemos recibido tu solicitud</h3>
              <p>Tu solicitud de registro ha sido recibida exitosamente y está siendo revisada por nuestro equipo.</p>
            </div>

            <h3>¿Qué sigue?</h3>
            <ul>
              <li><strong>Revisión:</strong> Nuestro equipo revisará tu solicitud en las próximas <span class="highlight">24-48 horas hábiles</span></li>
              <li><strong>Confirmación:</strong> Te enviaremos un correo de confirmación con los detalles de tu registro</li>
              <li><strong>Información adicional:</strong> Recibirás toda la información necesaria sobre el evento, ubicación y logística</li>
            </ul>

            <div class="info-box">
              <h3 style="margin-top: 0;">📅 Detalles del evento</h3>
              <ul style="margin: 10px 0;">
                <li><strong>Evento:</strong> 12ª Expo Empresarios de la Baja</li>
                <li><strong>Lugar:</strong> Los Cabos, Baja California Sur</li>
                <li><strong>Fecha:</strong> Por confirmar</li>
              </ul>
            </div>

            <p>Si tienes alguna pregunta urgente, no dudes en contactarnos respondiendo a este correo o llamando a nuestras oficinas.</p>
            
            <p style="margin-top: 30px;">
              <strong>¡Esperamos verte pronto!</strong><br>
              Equipo Expo Empresarios de la Baja
            </p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>© 2025 Expo Empresarios de la Baja. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('URL del API:', emailAPIUrl);
    console.log('Datos a enviar:', { to: email, subject: 'Solicitud recibida - Expo Empresarios' });

    const response = await fetch(emailAPIUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: '¡Gracias por tu interés! - 12ª Expo Empresarios de la Baja',
        html: htmlContent,
      }),
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response result:', result);
    
    if (!result.success) {
      throw new Error(result.message || 'Error al enviar el correo');
    }

    console.log('Correo de solicitud enviado exitosamente a:', email);
    return result;
  } catch (error) {
    console.error('Error al enviar correo de solicitud:', error);
    throw error;
  }
}

/**
 * Envía un correo de confirmación de registro
 */
export async function enviarCorreoConfirmacion(
  email: string,
  nombre: string,
  apellidos: string,
  codigoConfirmacion: string,
  tieneInvitado: boolean,
  nombreInvitado?: string
) {
  try {
    console.log('Enviando correo de confirmación a:', email);
    const emailAPIUrl = 'https://us-central1-advance-medical-68626.cloudfunctions.net/emailAPI/sendEmail';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .codigo { background: #667eea; color: white; padding: 15px 30px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 8px; margin: 20px 0; letter-spacing: 3px; }
          .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          h1 { margin: 0; font-size: 28px; }
          h2 { color: #667eea; margin-top: 0; }
          ul { padding-left: 20px; }
          li { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Registro Confirmado! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre} ${apellidos},</h2>
            <p>¡Gracias por confirmar tu asistencia a la <strong>12ª Expo Empresarios de la Baja</strong>!</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">Tu código de confirmación:</h3>
              <div class="codigo">${codigoConfirmacion}</div>
              <p style="text-align: center; margin: 0; color: #666;">Guarda este código para tu registro en el evento</p>
            </div>

            ${tieneInvitado ? `
              <div class="info-box">
                <h3 style="margin-top: 0;">✅ Invitado registrado</h3>
                <p>Has registrado a <strong>${nombreInvitado}</strong> como tu acompañante.</p>
              </div>
            ` : ''}

            <h3>Detalles del evento:</h3>
            <ul>
              <li><strong>Evento:</strong> 12ª Expo Empresarios de la Baja</li>
              <li><strong>Fecha:</strong> Por confirmar</li>
              <li><strong>Lugar:</strong> Los Cabos, Baja California Sur</li>
            </ul>

            <h3>Próximos pasos:</h3>
            <ul>
              <li>Recibirás un correo con más detalles del evento próximamente</li>
              <li>Presenta tu código de confirmación el día del evento</li>
              <li>Revisa tu correo regularmente para actualizaciones importantes</li>
            </ul>

            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            
            <p style="margin-top: 30px;">
              <strong>¡Nos vemos en la Expo!</strong><br>
              Equipo Expo Empresarios de la Baja
            </p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>© 2025 Expo Empresarios de la Baja. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('URL del API:', emailAPIUrl);
    console.log('Datos a enviar:', { to: email, subject: '¡Registro confirmado!' });

    const response = await fetch(emailAPIUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: '¡Registro confirmado! - 12ª Expo Empresarios de la Baja',
        html: htmlContent,
        from: 'Expo Empresarios de la Baja <cloud.send.email@gmail.com>',

      }),
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response result:', result);
    
    if (!result.success) {
      throw new Error(result.message || 'Error al enviar el correo');
    }

    console.log('Correo enviado exitosamente a:', email);
    return result;
  } catch (error) {
    console.error('Error al enviar correo de confirmación:', error);
    throw error;
  }
}

/**
 * Obtiene los datos de un expositor desde Firestore
 */
export async function getExpositorData(empresaId: string, expositorId: string): Promise<any> {
  try {
    const expositorRef = doc(db, `empresas/${empresaId}/contactos/${expositorId}`);
    const expositorSnap = await getDoc(expositorRef);

    if (expositorSnap.exists()) {
      return {
        id: expositorSnap.id,
        ...expositorSnap.data(),
      };
    }

    return null;
  } catch (error) {
    console.error('Error al obtener datos del expositor:', error);
    throw error;
  }
}

/**
 * Actualiza los datos de un expositor en Firestore
 */
export async function updateExpositorData(
  empresaId: string,
  expositorId: string,
  data: any
) {
  try {
    const fechaActual = new Date().toISOString();
    const expositorRef = doc(db, `empresas/${empresaId}/contactos/${expositorId}`);
    
    // Obtener el expositor actual para mantener su historial
    const expositorSnap = await getDoc(expositorRef);
    const expositorActual = expositorSnap.exists() ? expositorSnap.data() : null;
    const historialActual = expositorActual?.historial || [];
    
    await updateDoc(expositorRef, {
      ...data,
      fechaActualizacion: fechaActual,
      registroCompleto: true,
      tipoContacto: 'expositor',
      historial: [
        ...historialActual,
        {
          tipo: 'registro_expositor_completado',
          fecha: fechaActual,
          descripcion: 'Registro de expositor completado desde el formulario web',
        }
      ],
    });

    return { success: true };
  } catch (error) {
    console.error('Error al actualizar datos del expositor:', error);
    throw error;
  }
}

/**
 * Sube el logo del expositor a Firebase Storage
 */
export async function uploadExpositorLogo(
  empresaId: string,
  expositorId: string,
  file: File
): Promise<string> {
  try {
    const storageRef = ref(storage, `expositores/${empresaId}/${expositorId}/logo_${Date.now()}.jpg`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error('Error al subir logo del expositor:', error);
    throw error;
  }
}

/**
 * Sube múltiples imágenes de galería del expositor a Firebase Storage
 */
export async function uploadExpositorGallery(
  empresaId: string,
  expositorId: string,
  files: File[]
): Promise<string[]> {
  try {
    const urls: string[] = [];
    
    for (const file of files) {
      const storageRef = ref(storage, `expositores/${empresaId}/${expositorId}/galeria/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }
    
    return urls;
  } catch (error) {
    console.error('Error al subir galería del expositor:', error);
    throw error;
  }
}

/**
 * Envía un correo de invitación al expositor para completar su registro
 */
export async function enviarCorreoInvitacionExpositor(
  email: string,
  nombre: string,
  empresa: string,
  expositorId: string
) {
  try {
    console.log('Enviando correo de invitación a expositor:', email);
    const emailAPIUrl = 'https://us-central1-advance-medical-68626.cloudfunctions.net/emailAPI/sendEmail';
    const registroUrl = `https://expo-empresarios-de-la-baja.web.app/registro-expositor?expositor=${expositorId}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          h1 { margin: 0; font-size: 28px; }
          h2 { color: #667eea; margin-top: 0; }
          ul { padding-left: 20px; }
          li { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido Expositor! 🎪</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre},</h2>
            <p>¡Gracias por tu interés en participar como expositor en la <strong>12ª Expo Empresarios de la Baja</strong>!</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">📋 Completa tu registro</h3>
              <p>Para finalizar tu registro como expositor, necesitamos que completes la siguiente información:</p>
              <ul style="margin: 10px 0;">
                <li>Logo de tu empresa (formato cuadrado)</li>
                <li>Descripción de productos/servicios</li>
                <li>Galería de imágenes</li>
                <li>Información de contacto</li>
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="${registroUrl}" class="button">Completar Registro</a>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">✨ Beneficios de ser expositor</h3>
              <ul style="margin: 10px 0;">
                <li>Stand personalizado en el evento</li>
                <li>Visibilidad ante empresarios de la región</li>
                <li>Networking con potenciales clientes</li>
                <li>Promoción en nuestros canales digitales</li>
              </ul>
            </div>

            <p>Si tienes alguna pregunta, no dudes en contactarnos respondiendo a este correo.</p>
            
            <p style="margin-top: 30px;">
              <strong>¡Esperamos verte en la Expo!</strong><br>
              Equipo Expo Empresarios de la Baja
            </p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>© 2025 Expo Empresarios de la Baja. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch(emailAPIUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: '¡Completa tu registro como expositor! - 12ª Expo Empresarios de la Baja',
        html: htmlContent,
        from: 'Expo Empresarios de la Baja <cloud.send.email@gmail.com>',
      }),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Error al enviar el correo');
    }

    console.log('Correo de invitación enviado exitosamente a:', email);
    return result;
  } catch (error) {
    console.error('Error al enviar correo de invitación:', error);
    throw error;
  }
}

/**
 * Obtiene las imágenes del carrousel desde Firestore
 */
export async function getCarrouselImages(empresaId: string): Promise<any[]> {
  try {
    const landingRef = doc(db, `empresas/${empresaId}/pagina_web/landing`);
    const landingSnap = await getDoc(landingRef);

    if (landingSnap.exists()) {
      const data = landingSnap.data();
      const carrousel = data?.carrousel || [];
      // Ordenar por orden
      return carrousel.sort((a: any, b: any) => a.orden - b.orden);
    }

    return [];
  } catch (error) {
    console.error('Error al obtener imágenes del carrousel:', error);
    return [];
  }
}

/**
 * Obtiene las imágenes de la galería desde Firestore
 */
export async function getGaleriaImages(empresaId: string): Promise<any[]> {
  try {
    const landingRef = doc(db, `empresas/${empresaId}/pagina_web/landing`);
    const landingSnap = await getDoc(landingRef);

    if (landingSnap.exists()) {
      const data = landingSnap.data();
      const galeria = data?.galeria || [];
      // Ordenar por orden
      return galeria.sort((a: any, b: any) => a.orden - b.orden);
    }

    return [];
  } catch (error) {
    console.error('Error al obtener imágenes de la galería:', error);
    return [];
  }
}
