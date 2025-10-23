import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, getDocs, updateDoc, collection, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged,
  User
} from 'firebase/auth';

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
const auth = getAuth(app);

export { db, storage, auth };

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

    console.log('🔍 updateInvitadoData - Guardando horarioDisponibilidad:', data.horarioDisponibilidad);

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
 * Envía un correo de recepción de solicitud o invitación para completar registro
 */
export async function enviarCorreoSolicitud(
  email: string,
  nombre: string,
  apellidos: string,
  invitadoId?: string
) {
  try {
    console.log('Enviando correo de solicitud a:', email);
    const emailAPIUrl = 'https://us-central1-advance-medical-68626.cloudfunctions.net/emailAPI/sendEmail';

    // Si hay invitadoId, es un correo para completar registro con contraseña
    const esInvitacionConRegistro = Boolean(invitadoId);
    const registroUrl = invitadoId
      ? `${window.location.origin}/registro?invitado=${invitadoId}`
      : '#';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
          .header { background-color: #2a2a30; color: white; padding: 40px 30px; text-align: center; border-bottom: 3px solid #D4AF37; }
          .content { background: #ffffff; padding: 40px 30px; }
          .info-box { background-color: #fef9f3; color: #333; padding: 25px; border: 2px solid #D4AF37; margin: 20px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(212, 175, 55, 0.15); }
          .info-box h3 { color: #B8941F; margin-top: 0; }
          .info-box ul { color: #333; }
          .info-box strong { color: #B8941F; }
          .cta-button { display: inline-block; background-color: #D4AF37; color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4); margin: 20px 0; }
          .footer { background-color: #2a2a30; text-align: center; padding: 30px; color: #cccccc; font-size: 12px; border-top: 3px solid #D4AF37; }
          h1 { margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; }
          h2 { color: #2a2a30; margin-top: 0; font-size: 24px; font-weight: 600; }
          h3 { color: #2a2a30; font-size: 18px; font-weight: 600; }
          ul { padding-left: 20px; }
          li { margin: 10px 0; color: #333; }
          .highlight { color: #D4AF37; font-weight: bold; }
          .account-box { background-color: #e3f2fd; border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #2196F3; box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="background-color: #2a2a30; padding: 40px 30px; text-align: center; border-bottom: 3px solid #D4AF37;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff !important;">${esInvitacionConRegistro ? '¡Completa tu registro! 🎉' : '¡Gracias por tu interés! 🎉'}</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre} ${apellidos},</h2>
            
            ${esInvitacionConRegistro ? `
              <p>Has sido registrado como acompañante para la <strong>12ª Expo Empresarios de la Baja</strong>.</p>
              
              <div class="account-box" style="background-color: #e3f2fd; border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #2196F3; box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);">
                <h3 style="margin: 0 0 15px 0; color: #1976D2 !important; font-size: 20px; font-weight: 600;">
                  🔐 Crea tu contraseña para acceder
                </h3>
                <p style="color: #333 !important; font-size: 16px; line-height: 1.8; margin: 0;">
                  Para completar tu registro y acceder a tu cuenta personal, necesitas crear una contraseña. Con tu cuenta podrás:
                </p>
                <ul style="color: #333; line-height: 1.8; margin: 10px 0; padding-left: 25px;">
                  <li style="color: #333 !important; margin: 8px 0;"><strong style="color: #1976D2 !important;">Editar tu información</strong> personal</li>
                  <li style="color: #333 !important; margin: 8px 0;"><strong style="color: #1976D2 !important;">Agendar reuniones</strong> con expositores durante el evento</li>
                  <li style="color: #333 !important; margin: 8px 0;"><strong style="color: #1976D2 !important;">Configurar tu disponibilidad</strong> para reuniones</li>
                  <li style="color: #333 !important; margin: 8px 0;"><strong style="color: #1976D2 !important;">Ver información completa</strong> de todos los expositores</li>
                  <li style="color: #333 !important; margin: 8px 0;"><strong style="color: #1976D2 !important;">Descargar tus pases</strong> para el evento</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${registroUrl}" class="cta-button" style="display: inline-block; background-color: #D4AF37; color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);">
                  🔐 Crear mi Contraseña
                </a>
              </div>

              <div class="info-box" style="background-color: #fef9f3; color: #333; padding: 25px; border: 2px solid #D4AF37; margin: 20px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(212, 175, 55, 0.15);">
                <h3 style="margin-top: 0; color: #B8941F !important;">📅 Detalles del evento</h3>
                <ul style="margin: 10px 0; color: #333; padding-left: 25px;">
                  <li style="color: #333 !important; margin: 8px 0;"><strong style="color: #B8941F !important;">Evento:</strong> 12ª Expo Empresarios de la Baja</li>
                  <li style="color: #333 !important; margin: 8px 0;"><strong style="color: #B8941F !important;">Lugar:</strong> Los Cabos, Baja California Sur</li>
                  <li style="color: #333 !important; margin: 8px 0;"><strong style="color: #B8941F !important;">Fecha:</strong> 21 de Noviembre, 2025</li>
                </ul>
              </div>

              <p><strong style="color: #B8941F;">⚠️ Importante:</strong> Completa tu registro lo antes posible para aprovechar todas las funcionalidades de la plataforma.</p>
            ` : `
              <p>¡Muchas gracias por tu interés en participar en la <strong>12ª Expo Empresarios de la Baja</strong>!</p>
              
              <div class="info-box" style="background-color: #fef9f3; color: #333; padding: 25px; border: 2px solid #D4AF37; margin: 20px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(212, 175, 55, 0.15);">
                <h3 style="margin-top: 0; color: #B8941F !important;">📋 Hemos recibido tu solicitud</h3>
                <p style="color: #333 !important;">Tu solicitud de registro ha sido recibida exitosamente y está siendo revisada por nuestro equipo.</p>
              </div>

              <h3>¿Qué sigue?</h3>
              <ul style="padding-left: 25px;">
                <li style="color: #333; margin: 8px 0;"><strong style="color: #2a2a30;">Revisión:</strong> Nuestro equipo revisará tu solicitud en las próximas <span class="highlight">24-48 horas hábiles</span></li>
                <li style="color: #333; margin: 8px 0;"><strong style="color: #2a2a30;">Confirmación:</strong> Te enviaremos un correo de confirmación con los detalles de tu registro</li>
                <li style="color: #333; margin: 8px 0;"><strong style="color: #2a2a30;">Información adicional:</strong> Recibirás toda la información necesaria sobre el evento, ubicación y logística</li>
              </ul>

              <div class="info-box" style="background-color: #fef9f3; color: #333; padding: 25px; border: 2px solid #D4AF37; margin: 20px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(212, 175, 55, 0.15);">
                <h3 style="margin-top: 0; color: #B8941F !important;">📅 Detalles del evento</h3>
                <ul style="margin: 10px 0; color: #333; padding-left: 25px;">
                  <li style="color: #333 !important; margin: 8px 0;"><strong style="color: #B8941F !important;">Evento:</strong> 12ª Expo Empresarios de la Baja</li>
                  <li style="color: #333 !important; margin: 8px 0;"><strong style="color: #B8941F !important;">Lugar:</strong> Los Cabos, Baja California Sur</li>
                  <li style="color: #333 !important; margin: 8px 0;"><strong style="color: #B8941F !important;">Fecha:</strong> Por confirmar</li>
                </ul>
              </div>

              <p>Si tienes alguna pregunta urgente, no dudes en contactarnos respondiendo a este correo o llamando a nuestras oficinas.</p>
            `}
            
            <p style="margin-top: 30px;">
              <strong>¡${esInvitacionConRegistro ? 'Te esperamos en la Expo!' : 'Esperamos verte pronto!'}</strong><br>
              Equipo Expo Empresarios de la Baja
            </p>
          </div>
          <div class="footer" style="background-color: #2a2a30; text-align: center; padding: 30px; border-top: 3px solid #D4AF37;">
            <p style="margin: 5px 0; font-size: 12px; color: #cccccc !important;">Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p style="margin: 5px 0; font-size: 12px; color: #cccccc !important;">© 2025 Expo Empresarios de la Baja. Todos los derechos reservados.</p>
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
        from: 'Expo Empresarios de la Baja <cloud.send.email@gmail.com>',
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
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
          .header { background-color: #2a2a30; color: white; padding: 40px 30px; text-align: center; border-bottom: 3px solid #D4AF37; }
          .header img { max-width: 180px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto; }
          .content { background: #ffffff; padding: 40px 30px; }
          .codigo { background-color: #D4AF37; color: #ffffff; padding: 15px 30px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 12px; margin: 20px 0; letter-spacing: 3px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4); }
          .info-box { background-color: #fef9f3; color: #333; padding: 25px; border: 2px solid #D4AF37; margin: 20px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(212, 175, 55, 0.15); }
          .info-box h3 { color: #B8941F; margin-top: 0; }
          .info-box strong { color: #B8941F; }
          .footer { background-color: #2a2a30; text-align: center; padding: 30px; color: #cccccc; font-size: 12px; border-top: 3px solid #D4AF37; }
          h1 { margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; }
          h2 { color: #2a2a30; margin-top: 0; font-size: 24px; font-weight: 600; }
          h3 { color: #2a2a30; font-size: 18px; font-weight: 600; }
          ul { padding-left: 20px; }
          li { margin: 10px 0; color: #333; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="background-color: #2a2a30; padding: 40px 30px; text-align: center; border-bottom: 3px solid #D4AF37;">
            <img src="https://firebasestorage.googleapis.com/v0/b/advance-medical-68626.firebasestorage.app/o/pre-configuraciones%2Fbranding-temp%2Ficono-1759185951906-kez3tj-logo.png?alt=media&token=259c0cad-5cac-4ae5-9f3d-cc6438eb8ec2" alt="Expo Empresarios de la Baja" style="max-width: 180px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;" />
            <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff !important;">¡Registro Confirmado! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre} ${apellidos},</h2>
            <p>¡Gracias por confirmar tu asistencia a la <strong>12ª Expo Empresarios de la Baja</strong>!</p>
            
            <div class="info-box" style="background-color: #fef9f3; color: #333; padding: 25px; border: 2px solid #D4AF37; margin: 20px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(212, 175, 55, 0.15);">
              <h3 style="margin-top: 0; color: #B8941F !important;">Tu código de confirmación:</h3>
              <div class="codigo" style="background-color: #D4AF37; color: #ffffff !important; padding: 15px 30px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 12px; margin: 20px 0; letter-spacing: 3px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);">${codigoConfirmacion}</div>
              <p style="text-align: center; margin: 0; color: #555 !important;">Guarda este código para tu registro en el evento</p>
            </div>

            ${tieneInvitado ? `
              <div class="info-box" style="background-color: #e8f5e9; color: #333; padding: 25px; border: 2px solid #4CAF50; margin: 20px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);">
                <h3 style="margin-top: 0; color: #2E7D32 !important;">✅ Invitado registrado</h3>
                <p style="color: #333 !important; margin: 0;">Has registrado a <strong style="color: #2E7D32 !important;">${nombreInvitado}</strong> como tu acompañante.</p>
              </div>
            ` : ''}

            <h3>Detalles del evento:</h3>
            <ul>
              <li><strong style="color: #2a2a30;">Evento:</strong> 12ª Expo Empresarios de la Baja</li>
              <li><strong style="color: #2a2a30;">Fecha:</strong> Por confirmar</li>
              <li><strong style="color: #2a2a30;">Lugar:</strong> Los Cabos, Baja California Sur</li>
            </ul>

            <div class="info-box" style="background-color: #e3f2fd; color: #333; padding: 25px; border: 2px solid #2196F3; margin: 20px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);">
              <h3 style="margin-top: 0; color: #1976D2 !important;">🎉 ¡Tu cuenta ha sido creada!</h3>
              <p style="color: #333 !important;">Ahora puedes acceder a tu perfil y disfrutar de las siguientes funcionalidades:</p>
              <ul style="color: #333; padding-left: 20px;">
                <li style="color: #333 !important; margin: 10px 0;"><strong style="color: #1976D2 !important;">Editar tu información:</strong> Actualiza tus datos personales en cualquier momento</li>
                <li style="color: #333 !important; margin: 10px 0;"><strong style="color: #1976D2 !important;">Agendar reuniones:</strong> Programa citas con expositores durante el evento</li>
                <li style="color: #333 !important; margin: 10px 0;"><strong style="color: #1976D2 !important;">Configurar disponibilidad:</strong> Define tus horarios para que otros puedan agendar reuniones contigo</li>
                <li style="color: #333 !important; margin: 10px 0;"><strong style="color: #1976D2 !important;">Ver expositores:</strong> Explora todos los expositores que participarán en el evento</li>
                <li style="color: #333 !important; margin: 10px 0;"><strong style="color: #1976D2 !important;">Descargar tus pases:</strong> Descarga tus pases para el evento</li>
              </ul>
              <p style="text-align: center; margin-top: 20px;">
                <a href="https://expocabos.com/login" style="display: inline-block; background-color: #D4AF37; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);">Iniciar Sesión</a>
              </p>
            </div>

            <h3>Próximos pasos:</h3>
            <ul>
              <li>Inicia sesión con tu correo y contraseña</li>
              <li>Completa tu perfil y configura tu disponibilidad</li>
              <li>Presenta tu código de confirmación el día del evento</li>
              <li>Revisa tu correo regularmente para actualizaciones importantes</li>
            </ul>

            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            
            <p style="margin-top: 30px;">
              <strong>¡Nos vemos en la Expo!</strong><br>
              Equipo Expo Empresarios de la Baja
            </p>
          </div>
          <div class="footer" style="background-color: #2a2a30; text-align: center; padding: 30px; border-top: 3px solid #D4AF37;">
            <p style="margin: 5px 0; font-size: 12px; color: #cccccc !important;">Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p style="margin: 5px 0; font-size: 12px; color: #cccccc !important;">© 2025 Expo Empresarios de la Baja. Todos los derechos reservados.</p>
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
    const expositorRef = doc(db, `empresas/${empresaId}/expositores/${expositorId}`);
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
    const expositorRef = doc(db, `empresas/${empresaId}/expositores/${expositorId}`);

    // Obtener el expositor actual para mantener su historial
    const expositorSnap = await getDoc(expositorRef);
    const expositorActual = expositorSnap.exists() ? expositorSnap.data() : null;
    const historialActual = expositorActual?.historial || [];

    await updateDoc(expositorRef, {
      ...data,
      fechaActualizacion: fechaActual,
      registroCompleto: true,
      status: 'Completado', // Cambiar estado a Completado cuando termina el registro
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
 * Elimina una imagen de Firebase Storage por su URL
 */
export async function deleteImageFromStorage(imageUrl: string): Promise<void> {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
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
    const registroUrl = `convencion-baja.scaleflow.tech/registro-expositor?expositor=${expositorId}`;

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

/**
 * Crea una cuenta de Firebase Auth para el expositor
 */
export async function createExpositorAccount(email: string, password: string) {
  try {
    console.log('🔐 Creando cuenta de Firebase Auth para:', email);

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ Cuenta creada exitosamente. UID:', user.uid);

    return {
      success: true,
      uid: user.uid,
      email: user.email,
    };
  } catch (error: any) {
    console.error('❌ Error al crear cuenta:', error);

    // Mensajes de error personalizados
    let errorMessage = 'Error al crear la cuenta';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Ya existe una cuenta con este correo electrónico';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'El correo electrónico no es válido';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'La contraseña debe tener al menos 6 caracteres';
    }

    throw new Error(errorMessage);
  }
}

/**
 * Envía correo de bienvenida con credenciales de acceso
 */
export async function sendWelcomeEmail(
  email: string,
  nombre: string,
  empresa: string,
  dashboardUrl: string
) {
  try {
    console.log('📧 Enviando correo de bienvenida a:', email);

    const emailAPIUrl = import.meta.env.VITE_EMAIL_API_URL ||
      'https://us-central1-advance-medical-68626.cloudfunctions.net/emailAPI/sendEmail';

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a Expo Empresarios de la Baja</title>
  <style>
    body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;margin:0;padding:40px 20px}
    .container{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
    .header{background-color:#2a2a30;padding:40px 30px;text-align:center;border-bottom:3px solid #D4AF37}
    .header img{max-width:180px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto}
    .header h1{color:#fff;font-size:28px;font-weight:700;margin:0;line-height:1.3}
    .header .subtitle{color:#D4AF37;font-size:16px;margin-top:10px;font-weight:500}
    .content{padding:40px 30px;background:#fff;color:#333}
    .content p{font-size:16px;line-height:1.6;color:#666;margin-bottom:16px}
    .content h3{color:#2a2a30;font-size:18px;margin:25px 0 12px;font-weight:600}
    .content ul{margin:15px 0;padding-left:25px}
    .content li{margin:10px 0;line-height:1.6;color:#333}
    .button{display:inline-block;background-color:#D4AF37;color:#fff!important;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:16px;font-weight:600;box-shadow:0 4px 15px rgba(212,175,55,0.3);margin:20px 0}
    .info-box{background-color:#fef9f3;color:#333;border:2px solid #D4AF37;padding:20px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(212,175,55,0.15)}
    .info-box h3{margin-top:0;color:#B8941F}
    .info-box strong{color:#B8941F}
    .footer{background-color:#2a2a30;color:#cccccc;padding:30px;text-align:center;border-top:3px solid #D4AF37}
    .footer p{margin:8px 0;font-size:14px;color:#cccccc;line-height:1.5}
    .footer strong{color:#D4AF37}
    .footer a{color:#D4AF37;text-decoration:none}
    @media only screen and (max-width:600px){
      body{padding:20px 10px}
      .header{padding:30px 20px}
      .header h1{font-size:22px}
      .content{padding:30px 20px}
      .button{padding:14px 30px;font-size:15px}
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header" style="background-color:#2a2a30;padding:40px 30px;text-align:center;border-bottom:3px solid #D4AF37">
      <img src="https://firebasestorage.googleapis.com/v0/b/advance-medical-68626.firebasestorage.app/o/pre-configuraciones%2Fbranding-temp%2Ficono-1759185951906-kez3tj-logo.png?alt=media&token=259c0cad-5cac-4ae5-9f3d-cc6438eb8ec2" alt="Expo Empresarios de la Baja" style="max-width:180px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto" />
      <h1 style="color:#fff !important;font-size:28px;font-weight:700;margin:0;line-height:1.3">¡Bienvenido a la Expo!</h1>
      <div class="subtitle" style="color:#D4AF37 !important;font-size:16px;margin-top:10px;font-weight:500">Tu cuenta ha sido creada exitosamente</div>
    </div>
    <div class="content">
      <p>Estimado/a <strong>${nombre}</strong>,</p>
      
      <p>¡Gracias por completar tu registro para la <strong>12ª Expo Empresarios de la Baja</strong>!</p>
      
      <p>Tu información ha sido guardada exitosamente y hemos creado una cuenta exclusiva para <strong>${empresa}</strong>.</p>
      
      <div class="info-box" style="background-color: #fef9f3; color: #333; border: 2px solid #D4AF37; padding: 20px; margin: 25px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(212, 175, 55, 0.15);">
        <h3 style="margin-top: 0; color: #B8941F !important;">✨ ¿Qué puedes hacer con tu cuenta?</h3>
          <ul style="margin:10px 0;padding-left:20px;color:#333;">
            <li style="color: #333 !important; margin: 10px 0;">Editar y actualizar tu información de expositor</li>
            <li style="color: #333 !important; margin: 10px 0;">Ver y exportar contactos interesados en tus productos/servicios</li>
            <li style="color: #333 !important; margin: 10px 0;">Gestionar tus citas programadas durante el evento</li>
            <li style="color: #333 !important; margin: 10px 0;">Actualizar tu catálogo de productos en tiempo real</li>
            <li style="color: #333 !important; margin: 10px 0;">Revisar estadísticas de visitas a tu stand</li>
          </ul>
        </div>
        
        <div class="info-box" style="background-color: #e3f2fd; color: #333; border: 2px solid #2196F3; padding: 20px; margin: 25px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);">
          <h3 style="margin-top: 0; color: #1976D2 !important;">📧 Tus Credenciales de Acceso</h3>
          <p style="margin:8px 0; color: #333 !important;"><strong style="color: #1976D2 !important;">Correo electrónico:</strong> ${email}</p>
          <p style="margin:8px 0;color:#555 !important;font-size:14px">Usa este correo y la contraseña que creaste para iniciar sesión</p>
        </div>
        
        <p style="text-align:center">
          <a href="${dashboardUrl}" class="button" style="display: inline-block; background-color: #D4AF37; color: #fff !important; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">🚀 Ingresar a Mi Cuenta</a>
        </p>
        
        <div class="info-box" style="background-color: #fef9f3; color: #333; border: 2px solid #D4AF37; padding: 20px; margin: 25px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(212, 175, 55, 0.15);">
          <h3 style="margin-top: 0; color: #B8941F !important;">📋 Detalles del Evento</h3>
          <p style="margin:8px 0; color: #333 !important;"><strong style="color: #B8941F !important;">📅 Fecha:</strong> Viernes 21 de noviembre 2025</p>
          <p style="margin:8px 0; color: #333 !important;"><strong style="color: #B8941F !important;">📍 Lugar:</strong> Hotel Krystal Grand Los Cabos</p>
          <p style="margin:8px 0; color: #333 !important;"><strong style="color: #B8941F !important;">🎯 Asistentes:</strong> Más de 600 ejecutivos</p>
        </div>
        
        <p><strong>¡Nos vemos en la expo!</strong></p>
      </div>
      <div class="footer" style="background-color:#2a2a30;padding:30px;text-align:center;border-top:3px solid #D4AF37">
        <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5"><strong style="color:#D4AF37 !important">12ª Expo Empresarios de la Baja</strong></p>
        <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5">Viernes 21 de noviembre 2025</p>
        <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5">Hotel Krystal Grand Los Cabos</p>
        <div style="margin:20px 0;height:1px;background:#555"></div>
        <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5">📧 <a href="mailto:info@expo-empresarios.com" style="color:#D4AF37 !important;text-decoration:none">info@expo-empresarios.com</a></p>
        <p style="margin-top:20px;font-size:12px;color:#999 !important">Este es un correo automático. No respondas directamente a este mensaje.</p>
        <p style="margin-top:15px;font-size:11px;color:#888 !important">© 2025 Expo Empresarios de la Baja. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const response = await fetch(emailAPIUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: '🎉 ¡Bienvenido a Expo Empresarios de la Baja! - Acceso a tu cuenta',
        html: htmlContent,
        from: 'Expo Empresarios de la Baja <cloud.send.email@gmail.com>',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error del servidor de correo:', errorData);
      throw new Error(errorData.message || 'Error al enviar correo');
    }

    const data = await response.json();
    console.log('✅ Correo de bienvenida enviado:', data);

    return { success: true };
  } catch (error) {
    console.error('❌ Error al enviar correo de bienvenida:', error);
    throw error;
  }
}

/**
 * Inicia sesión con email y contraseña
 * Verifica que el usuario exista en expositores o contactos
 */
export async function loginExpositor(email: string, password: string, empresaId: string) {
  try {
    console.log('🔐 Iniciando sesión para:', email);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ Autenticación exitosa. UID:', user.uid);
    console.log('🔍 Verificando existencia del usuario en Firestore...');

    // Verificar que el usuario exista en expositores o contactos
    const userUid = user.uid;
    
    // Buscar en expositores
    const expositoresRef = collection(db, `empresas/${empresaId}/expositores`);
    const expositoresQuery = query(expositoresRef, where('userUid', '==', userUid));
    const expositoresSnapshot = await getDocs(expositoresQuery);

    if (!expositoresSnapshot.empty) {
      const expositorData = expositoresSnapshot.docs[0].data();
      console.log('✅ Usuario encontrado en expositores');
      return {
        success: true,
        uid: user.uid,
        email: user.email,
        userType: 'expositor',
        userData: expositorData,
      };
    }

    // Buscar en contactos
    const contactosRef = collection(db, `empresas/${empresaId}/contactos`);
    const contactosQuery = query(contactosRef, where('userUid', '==', userUid));
    const contactosSnapshot = await getDocs(contactosQuery);

    if (!contactosSnapshot.empty) {
      const contactoData = contactosSnapshot.docs[0].data();
      console.log('✅ Usuario encontrado en contactos');
      return {
        success: true,
        uid: user.uid,
        email: user.email,
        userType: 'contacto',
        userData: contactoData,
      };
    }

    // Si no se encuentra en expositores ni contactos, verificar si es administrador
    console.log('🔍 No encontrado en expositores/contactos. Verificando si es administrador...');
    
    // Buscar en la colección raíz "usuarios" (administradores)
    const usuariosRef = collection(db, 'usuarios');
    const usuariosQuery = query(usuariosRef, where('email', '==', email));
    const usuariosSnapshot = await getDocs(usuariosQuery);

    if (!usuariosSnapshot.empty) {
      // El usuario existe en la tabla de administradores
      console.warn('⚠️ Intento de acceso con cuenta de administrador');
      await signOut(auth);
      throw new Error('Esta cuenta es de administrador. Por favor, ingresa en: https://emdb-dashboard.web.app/');
    }

    // Si no se encuentra en ninguna colección, cerrar sesión
    console.error('❌ Usuario autenticado pero no encontrado en Firestore');
    await signOut(auth);
    throw new Error('Tu cuenta no está registrada en el sistema. Por favor, completa tu registro o contacta al administrador.');

  } catch (error: any) {
    console.error('❌ Error al iniciar sesión:', error);
    console.error('❌ Código de error:', error.code);

    // Si el error ya tiene un mensaje personalizado (como el de usuario no encontrado), usarlo
    if (error.message && !error.code) {
      throw error;
    }

    let errorMessage = 'Error al iniciar sesión. Por favor, intenta nuevamente.';
    
    // Manejo de errores de Firebase Auth (versiones actualizadas)
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No existe una cuenta con este correo electrónico';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Contraseña incorrecta';
        break;
      case 'auth/invalid-email':
        errorMessage = 'El formato del correo electrónico no es válido';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Esta cuenta ha sido deshabilitada. Contacta al administrador.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Demasiados intentos fallidos. Por favor, intenta más tarde o restablece tu contraseña.';
        break;
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials':
        errorMessage = 'Correo o contraseña incorrectos. Por favor, verifica tus credenciales.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'El inicio de sesión con email/contraseña no está habilitado.';
        break;
      default:
        if (error.message) {
          errorMessage = error.message;
        }
        break;
    }

    throw new Error(errorMessage);
  }
}

/**
 * Cierra la sesión del usuario actual
 */
export async function logoutExpositor() {
  try {
    console.log('🚪 Cerrando sesión...');
    await signOut(auth);
    console.log('✅ Sesión cerrada exitosamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    throw error;
  }
}

/**
 * Envía correo para restablecer contraseña
 */
export async function sendPasswordReset(email: string) {
  try {
    console.log('📧 Enviando correo de recuperación a:', email);

    await sendPasswordResetEmail(auth, email);

    console.log('✅ Correo de recuperación enviado');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error al enviar correo de recuperación:', error);

    let errorMessage = 'Error al enviar correo de recuperación';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No existe una cuenta con este correo electrónico';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Correo electrónico inválido';
    }

    throw new Error(errorMessage);
  }
}

/**
 * Cambia la contraseña del usuario actual
 */
export async function changePassword(newPassword: string) {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    console.log('🔐 Cambiando contraseña...');
    await updatePassword(user, newPassword);
    console.log('✅ Contraseña cambiada exitosamente');

    return { success: true };
  } catch (error: any) {
    console.error('❌ Error al cambiar contraseña:', error);

    let errorMessage = 'Error al cambiar la contraseña';
    if (error.code === 'auth/weak-password') {
      errorMessage = 'La contraseña debe tener al menos 6 caracteres';
    } else if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'Por seguridad, debes volver a iniciar sesión para cambiar tu contraseña';
    }

    throw new Error(errorMessage);
  }
}

/**
 * Observador de cambios en el estado de autenticación
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Obtiene el usuario actual
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Obtiene todos los expositores activos con logos
 */
export async function getExpositores(empresaId: string) {
  try {
    const expositoresRef = collection(db, `empresas/${empresaId}/expositores`);
    const snapshot = await getDocs(expositoresRef);

    const expositores = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter((exp: any) => exp.logoUrl && (exp.status === 'Completado' || exp.status === 'Activo'));

    return expositores;
  } catch (error) {
    console.error('Error al obtener expositores:', error);
    return [];
  }
}

/**
 * Obtiene el perfil del usuario actual (expositor o contacto)
 */
export async function getUserProfile(empresaId: string) {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    const userUid = user.uid;

    // Buscar en expositores
    const expositoresRef = collection(db, `empresas/${empresaId}/expositores`);
    const expositoresQuery = query(expositoresRef, where('userUid', '==', userUid));
    const expositoresSnapshot = await getDocs(expositoresQuery);

    if (!expositoresSnapshot.empty) {
      const expositorDoc = expositoresSnapshot.docs[0];
      const data = expositorDoc.data();
      console.log('🔍 getUserProfile - Expositor encontrado, horarioDisponibilidad:', data.horarioDisponibilidad);
      return {
        id: expositorDoc.id,
        tipo: 'expositor',
        ...data
      };
    }

    // Buscar en contactos
    const contactosRef = collection(db, `empresas/${empresaId}/contactos`);
    const contactosQuery = query(contactosRef, where('userUid', '==', userUid));
    const contactosSnapshot = await getDocs(contactosQuery);

    if (!contactosSnapshot.empty) {
      const contactoDoc = contactosSnapshot.docs[0];
      const data = contactoDoc.data();
      console.log('🔍 getUserProfile - Contacto encontrado, horarioDisponibilidad:', data.horarioDisponibilidad);
      return {
        id: contactoDoc.id,
        tipo: 'contacto',
        ...data
      };
    }

    return null;
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    throw error;
  }
}

/**
 * Actualiza el perfil del usuario (expositor o contacto)
 */
export async function updateUserProfile(empresaId: string, userId: string, userType: string, data: any) {
  try {
    const collection = userType === 'expositor' ? 'expositores' : 'contactos';
    const userRef = doc(db, `empresas/${empresaId}/${collection}/${userId}`);

    await updateDoc(userRef, {
      ...data,
      fechaActualizacion: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    throw error;
  }
}

/**
 * Crea una cuenta de usuario en Firebase Auth y actualiza el documento con el UID
 */
export async function createUserAccount(
  email: string,
  password: string,
  empresaId: string,
  contactoId: string
): Promise<string> {
  try {
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userUid = userCredential.user.uid;

    // Actualizar el documento del contacto con el userUid
    const contactoRef = doc(db, `empresas/${empresaId}/contactos/${contactoId}`);
    await updateDoc(contactoRef, {
      userUid: userUid,
      fechaActualizacion: new Date().toISOString(),
    });

    return userUid;
  } catch (error: any) {
    console.error('Error al crear cuenta de usuario:', error);
    throw error;
  }
}

/**
 * Registra un contacto con un invitado/expositor
 */
export async function registrarContactoInvitado(
  empresaId: string,
  invitadoId: string,
  userUid: string,
  userProfile: any, // Perfil del usuario que está registrando (expositor o contacto)
  invitadoData: any, // Datos del invitado/expositor que se está registrando
  data: {
    notas?: string;
    interes?: string;
  }
): Promise<void> {
  try {
    const fechaRegistro = new Date().toISOString();

    // Determinar la colección del usuario actual
    const userCollection = userProfile.tipo === 'expositor' ? 'expositores' : 'contactos';

    // Crear el documento del contacto en la subcolección del usuario actual
    const contactoData = {
      contactoId: invitadoId, // ID del invitado/expositor registrado
      nombre: invitadoData.nombre,
      apellidos: invitadoData.apellidos,
      email: invitadoData.email,
      telefono: invitadoData.telefono,
      empresa: invitadoData.empresa,
      puesto: invitadoData.puesto,
      tipoContacto: invitadoData.tipoContacto || 'invitado', // invitado o expositor
      notas: data.notas || '',
      interes: data.interes || '',
      fechaRegistro,
      userUid,
    };

    // Guardar en subcolección del usuario actual
    const contactosRef = collection(
      db,
      `empresas/${empresaId}/${userCollection}/${userProfile.id}/contactos`
    );
    await addDoc(contactosRef, contactoData);

    // Enviar correo de notificación al contacto registrado
    await enviarCorreoNotificacionContacto(
      invitadoData.email,
      invitadoData.nombre,
      invitadoData.apellidos,
      userProfile.nombre,
      userProfile.apellidos,
      userProfile.tipo,
      userProfile.empresa
    );

    console.log('✅ Contacto registrado y correo enviado exitosamente');
  } catch (error) {
    console.error('Error al registrar contacto:', error);
    throw error;
  }
}

/**
 * Envía correo de notificación cuando alguien te registra como contacto
 */
async function enviarCorreoNotificacionContacto(
  destinatarioEmail: string,
  destinatarioNombre: string,
  destinatarioApellidos: string,
  registradorNombre: string,
  registradorApellidos: string,
  registradorTipo: string,
  registradorEmpresa: string
): Promise<void> {
  try {
    const emailAPIUrl = 'https://us-central1-advance-medical-68626.cloudfunctions.net/emailAPI/sendEmail';

    const tipoLabel = registradorTipo === 'expositor' ? 'Expositor' : 'Asistente';

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Conexión - Expo Empresarios</title>
  <style>
    body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;margin:0;padding:40px 20px}
    .container{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
    .header{background-color:#2a2a30;padding:40px 30px;text-align:center;border-bottom:3px solid #D4AF37}
    .header img{max-width:180px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto}
    .header h1{color:#fff;font-size:28px;font-weight:700;margin:0;line-height:1.3}
    .header .subtitle{color:#D4AF37;font-size:16px;margin-top:10px;font-weight:500}
    .content{padding:40px 30px;background:#fff;color:#333}
    .content p{font-size:16px;line-height:1.6;color:#666;margin-bottom:16px}
    .content h2{color:#2a2a30;font-size:22px;margin-top:0;margin-bottom:20px;font-weight:600}
    .info-box{background-color:#fef9f3;color:#333;border:2px solid #D4AF37;padding:20px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(212,175,55,0.15)}
    .info-box h3{margin-top:0;color:#B8941F;font-size:18px;font-weight:600}
    .feature-box{background-color:#e8f5e9;color:#333;border:2px solid #4CAF50;padding:20px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(76,175,80,0.15)}
    .feature-box h3{margin-top:0;color:#2E7D32;font-size:18px;font-weight:600}
    .button{display:inline-block;background-color:#D4AF37;color:#fff!important;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:16px;font-weight:600;box-shadow:0 4px 15px rgba(212,175,55,0.3);margin:20px 0}
    .footer{background-color:#2a2a30;color:#cccccc;padding:30px;text-align:center;border-top:3px solid #D4AF37}
    .footer p{margin:8px 0;font-size:14px;color:#cccccc;line-height:1.5}
    @media only screen and (max-width:600px){
      body{padding:20px 10px}
      .header{padding:30px 20px}
      .header h1{font-size:22px}
      .content{padding:30px 20px}
      .button{padding:14px 30px;font-size:15px}
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header" style="background-color:#2a2a30;padding:40px 30px;text-align:center;border-bottom:3px solid #D4AF37">
      <img src="https://firebasestorage.googleapis.com/v0/b/advance-medical-68626.firebasestorage.app/o/pre-configuraciones%2Fbranding-temp%2Ficono-1759185951906-kez3tj-logo.png?alt=media&token=259c0cad-5cac-4ae5-9f3d-cc6438eb8ec2" alt="Expo Empresarios de la Baja" style="max-width:180px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto" />
      <h1 style="color:#fff !important;font-size:28px;font-weight:700;margin:0;line-height:1.3">🤝 Nueva Conexión</h1>
      <div class="subtitle" style="color:#D4AF37 !important;font-size:16px;margin-top:10px;font-weight:500">¡Alguien te ha registrado como contacto!</div>
    </div>
    <div class="content" style="padding:40px 30px;background:#fff;color:#333">
      <h2 style="color:#2a2a30 !important;font-size:22px;margin-top:0;margin-bottom:20px;font-weight:600">Hola ${destinatarioNombre} ${destinatarioApellidos},</h2>
      
      <p style="font-size:16px;line-height:1.6;color:#666 !important;margin-bottom:16px">Te informamos que <strong style="color:#333 !important">${registradorNombre} ${registradorApellidos}</strong> (${tipoLabel} de <strong style="color:#333 !important">${registradorEmpresa}</strong>) te ha registrado como contacto en la <strong style="color:#333 !important">12ª Expo Empresarios de la Baja</strong>.</p>
      
      <div style="background-color:#fef9f3 !important;color:#333 !important;border:2px solid #D4AF37;padding:20px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(212,175,55,0.15)">
        <h3 style="margin-top:0;color:#B8941F !important;font-size:18px;font-weight:600">👤 ¿Quién te registró?</h3>
        <p style="margin:5px 0;color:#333 !important;font-size:16px"><strong style="color:#B8941F !important">Nombre:</strong> ${registradorNombre} ${registradorApellidos}</p>
        <p style="margin:5px 0;color:#333 !important;font-size:16px"><strong style="color:#B8941F !important">Tipo:</strong> ${tipoLabel}</p>
        <p style="margin:5px 0;color:#333 !important;font-size:16px"><strong style="color:#B8941F !important">Empresa:</strong> ${registradorEmpresa}</p>
      </div>

      <div style="background-color:#e8f5e9 !important;color:#333 !important;border:2px solid #4CAF50;padding:20px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(76,175,80,0.15)">
        <h3 style="margin:0 0 15px 0;color:#2E7D32 !important;font-size:18px;font-weight:600">💼 ¿Qué puedes hacer ahora?</h3>
        <p style="margin:0 0 15px 0;color:#333 !important;font-size:16px">Inicia sesión en tu cuenta para:</p>
        <ul style="margin:10px 0;padding-left:20px;line-height:1.8;color:#333 !important;list-style-type:disc">
          <li style="color:#333 !important;font-size:15px;margin:10px 0"><strong style="color:#2E7D32 !important">Ver su perfil completo</strong> - Accede a toda su información de contacto</li>
          <li style="color:#333 !important;font-size:15px;margin:10px 0"><strong style="color:#2E7D32 !important">Agendar reuniones</strong> - Coordina encuentros durante el evento</li>
          <li style="color:#333 !important;font-size:15px;margin:10px 0"><strong style="color:#2E7D32 !important">Ver su disponibilidad</strong> - Consulta sus horarios disponibles</li>
          <li style="color:#333 !important;font-size:15px;margin:10px 0"><strong style="color:#2E7D32 !important">Registrar seguimientos</strong> - Mantén un historial de interacciones</li>
          <li style="color:#333 !important;font-size:15px;margin:10px 0"><strong style="color:#2E7D32 !important">Gestionar tus contactos</strong> - Organiza todas tus conexiones</li>
        </ul>
      </div>

      <div style="text-align:center;margin:30px 0">
        <a href="${window.location.origin}/login" style="display:inline-block;background-color:#D4AF37 !important;color:#ffffff !important;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:16px;font-weight:600;box-shadow:0 4px 15px rgba(212,175,55,0.3)">
          Iniciar Sesión
        </a>
      </div>

      <div style="background-color:#fef9f3 !important;color:#333 !important;border:2px solid #D4AF37;padding:20px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(212,175,55,0.15)">
        <h3 style="margin-top:0;color:#B8941F !important;font-size:18px;font-weight:600">📅 Detalles del Evento</h3>
        <ul style="margin:10px 0;padding-left:20px;color:#333 !important;list-style-type:disc">
          <li style="color:#333 !important;font-size:15px;margin:10px 0"><strong style="color:#B8941F !important">Evento:</strong> 12ª Expo Empresarios de la Baja</li>
          <li style="color:#333 !important;font-size:15px;margin:10px 0"><strong style="color:#B8941F !important">Fecha:</strong> Viernes 21 de Noviembre, 2025</li>
          <li style="color:#333 !important;font-size:15px;margin:10px 0"><strong style="color:#B8941F !important">Lugar:</strong> Hotel Krystal Grand Los Cabos</li>
        </ul>
      </div>

      <p style="margin-top:30px;font-size:16px;line-height:1.6;color:#666 !important">
        <strong style="color:#333 !important">¡Aprovecha al máximo el networking!</strong><br>
        Equipo Expo Empresarios de la Baja
      </p>
    </div>
    <div class="footer" style="background-color:#2a2a30;padding:30px;text-align:center;border-top:3px solid #D4AF37">
      <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5">Este es un correo automático, por favor no respondas a este mensaje.</p>
      <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5">© 2025 Expo Empresarios de la Baja. Todos los derechos reservados.</p>
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
        to: destinatarioEmail,
        subject: '🤝 Nueva Conexión - Expo Empresarios de la Baja',
        html: htmlContent,
        from: 'Expo Empresarios de la Baja <expoempresariosdelabaja@gmail.com>',
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Error al enviar el correo');
    }

    console.log('✅ Correo de notificación enviado a:', destinatarioEmail);
  } catch (error) {
    console.error('❌ Error al enviar correo de notificación:', error);
    // No lanzar el error para que el registro se complete aunque falle el correo
  }
}

/**
 * Agenda una reunión con un invitado/expositor
 */
export async function agendarReunionConInvitado(
  empresaId: string,
  invitadoId: string,
  userUid: string,
  userProfile: any, // Perfil del usuario que agenda
  invitadoData: any, // Datos del invitado con quien se agenda
  data: {
    fecha: string;
    hora: string;
    tema: string;
    notas?: string;
  }
): Promise<void> {
  try {
    const fechaCreacion = new Date().toISOString();
    const citaId = `cita_${Date.now()}`;

    // Determinar las colecciones
    const userCollection = userProfile.tipo === 'expositor' ? 'expositores' : 'contactos';
    const invitadoCollection = invitadoData.tipoContacto === 'expositor' ? 'expositores' : 'contactos';

    // Datos de la cita
    const citaData = {
      citaId, // ID único compartido
      fecha: data.fecha,
      hora: data.hora,
      tema: data.tema,
      notas: data.notas || '',
      status: 'pendiente',
      fechaCreacion,
      confirmada: false,
    };

    // Guardar en la subcolección del usuario que agenda
    const citaUsuarioData = {
      ...citaData,
      conQuien: {
        id: invitadoId,
        nombre: invitadoData.nombre || '',
        apellidos: invitadoData.apellidos || '',
        email: invitadoData.email || '',
        telefono: invitadoData.telefono || '',
        empresa: invitadoData.empresa || '',
        puesto: invitadoData.puesto || '',
        tipo: invitadoData.tipoContacto || 'invitado',
      },
      rol: 'organizador', // Quien agenda
    };

    const citasUsuarioRef = collection(
      db,
      `empresas/${empresaId}/${userCollection}/${userProfile.id}/citas`
    );
    await addDoc(citasUsuarioRef, citaUsuarioData);

    // Guardar en la subcolección del invitado
    const citaInvitadoData = {
      ...citaData,
      conQuien: {
        id: userProfile.id,
        nombre: userProfile.nombre || '',
        apellidos: userProfile.apellidos || '',
        email: userProfile.email || '',
        telefono: userProfile.telefono || '',
        empresa: userProfile.empresa || '',
        puesto: userProfile.puesto || '',
        tipo: userProfile.tipo,
      },
      rol: 'invitado', // A quien le agendaron
    };

    const citasInvitadoRef = collection(
      db,
      `empresas/${empresaId}/${invitadoCollection}/${invitadoId}/citas`
    );
    await addDoc(citasInvitadoRef, citaInvitadoData);

    // Enviar correo de notificación
    await enviarCorreoNotificacionCita(
      invitadoData.email,
      invitadoData.nombre,
      invitadoData.apellidos,
      userProfile.nombre,
      userProfile.apellidos,
      userProfile.tipo,
      userProfile.empresa,
      data.fecha,
      data.hora,
      data.tema,
      data.notas || ''
    );

    console.log('✅ Cita agendada y correo enviado exitosamente');
  } catch (error) {
    console.error('Error al agendar reunión:', error);
    throw error;
  }
}

/**
 * Envía correo de notificación de nueva cita
 */
async function enviarCorreoNotificacionCita(
  destinatarioEmail: string,
  destinatarioNombre: string,
  destinatarioApellidos: string,
  organizadorNombre: string,
  organizadorApellidos: string,
  organizadorTipo: string,
  organizadorEmpresa: string,
  fecha: string,
  hora: string,
  tema: string,
  notas: string
): Promise<void> {
  try {
    const emailAPIUrl = 'https://us-central1-advance-medical-68626.cloudfunctions.net/emailAPI/sendEmail';

    const tipoLabel = organizadorTipo === 'expositor' ? 'Expositor' : 'Asistente';
    const fechaFormateada = new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Reunión Agendada - Expo Empresarios</title>
  <style>
    body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;margin:0;padding:40px 20px}
    .container{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
    .header{background-color:#2a2a30;padding:40px 30px;text-align:center;border-bottom:3px solid #D4AF37}
    .header img{max-width:180px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto}
    .header h1{color:#fff;font-size:28px;font-weight:700;margin:0;line-height:1.3}
    .header .subtitle{color:#D4AF37;font-size:16px;margin-top:10px;font-weight:500}
    .content{padding:40px 30px;background:#fff;color:#333}
    .content p{font-size:16px;line-height:1.6;color:#666;margin-bottom:16px}
    .content h2{color:#2a2a30;font-size:22px;margin-top:0;margin-bottom:20px;font-weight:600}
    .button{display:inline-block;background-color:#D4AF37;color:#fff!important;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:16px;font-weight:600;box-shadow:0 4px 15px rgba(212,175,55,0.3);margin:20px 0}
    .footer{background-color:#2a2a30;color:#cccccc;padding:30px;text-align:center;border-top:3px solid #D4AF37}
    .footer p{margin:8px 0;font-size:14px;color:#cccccc;line-height:1.5}
    @media only screen and (max-width:600px){
      body{padding:20px 10px}
      .header{padding:30px 20px}
      .header h1{font-size:22px}
      .content{padding:30px 20px}
      .button{padding:14px 30px;font-size:15px}
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header" style="background-color:#2a2a30;padding:40px 30px;text-align:center;border-bottom:3px solid #D4AF37">
      <img src="https://firebasestorage.googleapis.com/v0/b/advance-medical-68626.firebasestorage.app/o/pre-configuraciones%2Fbranding-temp%2Ficono-1759185951906-kez3tj-logo.png?alt=media&token=259c0cad-5cac-4ae5-9f3d-cc6438eb8ec2" alt="Expo Empresarios de la Baja" style="max-width:180px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto" />
      <h1 style="color:#fff !important;font-size:28px;font-weight:700;margin:0;line-height:1.3">📅 Nueva Reunión Agendada</h1>
      <div class="subtitle" style="color:#D4AF37 !important;font-size:16px;margin-top:10px;font-weight:500">Tienes una nueva cita pendiente</div>
    </div>
    <div class="content" style="padding:40px 30px;background:#fff;color:#333">
      <h2 style="color:#2a2a30 !important;font-size:22px;margin-top:0;margin-bottom:20px;font-weight:600">Hola ${destinatarioNombre} ${destinatarioApellidos},</h2>
      
      <p style="font-size:16px;line-height:1.6;color:#666 !important;margin-bottom:16px"><strong style="color:#333 !important">${organizadorNombre} ${organizadorApellidos}</strong> (${tipoLabel} de <strong style="color:#333 !important">${organizadorEmpresa}</strong>) ha agendado una reunión contigo durante la <strong style="color:#333 !important">12ª Expo Empresarios de la Baja</strong>.</p>
      
      <div style="display:inline-block;background-color:#FFA726 !important;color:#fff !important;padding:8px 20px;border-radius:25px;font-size:15px;font-weight:600;margin:15px 0">⏳ Pendiente de Confirmación</div>

      <div style="background-color:#e8f5e9 !important;color:#333 !important;border:2px solid #4CAF50;padding:25px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(76,175,80,0.15)">
        <h3 style="margin:0 0 20px 0;color:#2E7D32 !important;font-size:20px;font-weight:600">📋 Detalles de la Reunión</h3>
        <div style="margin:12px 0">
          <span style="font-weight:600;color:#2E7D32 !important;display:inline-block;width:100px">📅 Fecha:</span>
          <span style="color:#333 !important;font-size:16px">${fechaFormateada}</span>
        </div>
        <div style="margin:12px 0">
          <span style="font-weight:600;color:#2E7D32 !important;display:inline-block;width:100px">🕐 Hora:</span>
          <span style="color:#333 !important;font-size:16px">${hora}</span>
        </div>
        <div style="margin:12px 0">
          <span style="font-weight:600;color:#2E7D32 !important;display:inline-block;width:100px">📌 Tema:</span>
          <span style="color:#333 !important;font-size:16px">${tema}</span>
        </div>
        ${notas ? `
        <div style="margin-top:20px">
          <div style="font-weight:600;color:#2E7D32 !important;margin-bottom:8px">📝 Notas:</div>
          <div style="background:#fff !important;padding:15px;border-radius:8px;color:#333 !important;font-size:15px;line-height:1.6">
            ${notas}
          </div>
        </div>
        ` : ''}
      </div>

      <div style="background-color:#fef9f3 !important;color:#333 !important;border:2px solid #D4AF37;padding:20px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(212,175,55,0.15)">
        <h3 style="margin-top:0;color:#B8941F !important;font-size:18px;font-weight:600">👤 ¿Quién agendó?</h3>
        <p style="margin:5px 0;color:#333 !important;font-size:16px"><strong style="color:#B8941F !important">Nombre:</strong> ${organizadorNombre} ${organizadorApellidos}</p>
        <p style="margin:5px 0;color:#333 !important;font-size:16px"><strong style="color:#B8941F !important">Tipo:</strong> ${tipoLabel}</p>
        <p style="margin:5px 0;color:#333 !important;font-size:16px"><strong style="color:#B8941F !important">Empresa:</strong> ${organizadorEmpresa}</p>
      </div>

      <div style="background-color:#fff3cd !important;border:2px solid #ffc107;border-radius:12px;padding:20px;margin:25px 0">
        <h3 style="margin:0 0 12px 0;color:#856404 !important;font-size:18px;font-weight:600">⚠️ Acción Requerida</h3>
        <p style="margin:0;color:#856404 !important;font-size:15px;line-height:1.6">
          Por favor, inicia sesión en tu cuenta para <strong style="color:#856404 !important">confirmar o reagendar</strong> esta reunión. 
          La cita aparecerá en estado "Pendiente" hasta que tomes una acción.
        </p>
      </div>

      <div style="text-align:center;margin:30px 0">
        <a href="${window.location.origin}/login" style="display:inline-block;background-color:#D4AF37 !important;color:#ffffff !important;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:16px;font-weight:600;box-shadow:0 4px 15px rgba(212,175,55,0.3)">
          Ver Mis Citas
        </a>
      </div>

      <div style="background-color:#fef9f3 !important;color:#333 !important;border:2px solid #D4AF37;padding:20px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(212,175,55,0.15)">
        <h3 style="margin-top:0;color:#B8941F !important;font-size:18px;font-weight:600">💼 ¿Qué puedes hacer?</h3>
        <ul style="margin:10px 0;padding-left:20px;line-height:1.8;color:#333 !important;list-style-type:disc">
          <li style="color:#333 !important;font-size:15px;margin:10px 0"><strong style="color:#B8941F !important">Confirmar la cita</strong> - Acepta la reunión propuesta</li>
          <li style="color:#333 !important;font-size:15px;margin:10px 0"><strong style="color:#B8941F !important">Proponer nueva hora</strong> - Si el horario no te funciona</li>
          <li style="color:#333 !important;font-size:15px;margin:10px 0"><strong style="color:#B8941F !important">Ver perfil del organizador</strong> - Conoce más información</li>
          <li style="color:#333 !important;font-size:15px;margin:10px 0"><strong style="color:#B8941F !important">Agregar a calendario</strong> - No olvides la reunión</li>
        </ul>
      </div>

      <p style="margin-top:30px;font-size:16px;line-height:1.6;color:#666 !important">
        <strong style="color:#333 !important">¡Aprovecha al máximo el networking!</strong><br>
        Equipo Expo Empresarios de la Baja
      </p>
    </div>
    <div class="footer" style="background-color:#2a2a30;padding:30px;text-align:center;border-top:3px solid #D4AF37">
      <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5">Este es un correo automático, por favor no respondas a este mensaje.</p>
      <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5">© 2025 Expo Empresarios de la Baja. Todos los derechos reservados.</p>
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
        to: destinatarioEmail,
        subject: '📅 Nueva Reunión Agendada - Expo Empresarios de la Baja',
        html: htmlContent,
        from: 'Expo Empresarios de la Baja <expoempresariosdelabaja@gmail.com>',
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Error al enviar el correo');
    }

    console.log('✅ Correo de cita enviado a:', destinatarioEmail);
  } catch (error) {
    console.error('❌ Error al enviar correo de cita:', error);
    // No lanzar el error para que el agendamiento se complete aunque falle el correo
  }
}

/**
 * Obtiene las citas de un invitado (ahora desde su subcolección)
 */
export async function getCitasDelInvitado(
  empresaId: string,
  invitadoId: string
): Promise<any[]> {
  try {
    // Buscar en contactos
    const citasContactosRef = collection(db, `empresas/${empresaId}/contactos/${invitadoId}/citas`);
    const contactosSnapshot = await getDocs(citasContactosRef);

    const citasContactos = contactosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Buscar en expositores
    const citasExpositoresRef = collection(db, `empresas/${empresaId}/expositores/${invitadoId}/citas`);
    const expositoresSnapshot = await getDocs(citasExpositoresRef);

    const citasExpositores = expositoresSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Combinar ambas listas
    return [...citasContactos, ...citasExpositores];
  } catch (error) {
    console.error('Error al obtener citas del invitado:', error);
    return [];
  }
}

/**
 * Verifica si un usuario ya tiene registrado a alguien como contacto
 */
export async function verificarContactoExistente(
  empresaId: string,
  userProfileId: string,
  userType: string,
  contactoId: string
): Promise<boolean> {
  try {
    const userCollection = userType === 'expositor' ? 'expositores' : 'contactos';

    // Buscar en la subcolección de contactos del usuario
    const contactosRef = collection(
      db,
      `empresas/${empresaId}/${userCollection}/${userProfileId}/contactos`
    );

    const contactosQuery = query(contactosRef, where('contactoId', '==', contactoId));
    const snapshot = await getDocs(contactosQuery);

    return !snapshot.empty;
  } catch (error) {
    console.error('Error al verificar contacto existente:', error);
    return false;
  }
}

/**
 * Crea una solicitud de registro (sin invitación previa)
 */
export async function crearSolicitudRegistro(
  empresaId: string,
  datos: {
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
    empresa: string;
    puesto: string;
  }
): Promise<string> {
  try {
    const fechaActual = new Date().toISOString();

    const solicitudData = {
      nombre: datos.nombre,
      apellidos: datos.apellidos,
      email: datos.email,
      telefono: datos.telefono,
      empresa: datos.empresa,
      puesto: datos.puesto,
      tipoSolicitud: 'expositor',
      status: 'pendiente',
      fechaCreacion: fechaActual,
      historial: [
        {
          tipo: 'solicitud_creada',
          descripcion: 'Solicitud de registro creada desde la página web',
          fecha: fechaActual,
        }
      ],
    };

    const solicitudesRef = collection(db, `empresas/${empresaId}/solicitudes`);
    const docRef = await addDoc(solicitudesRef, solicitudData);

    console.log('✅ Solicitud creada:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error al crear solicitud:', error);
    throw error;
  }
}

/**
 * Envía correo de solicitud en revisión
 */
export async function enviarCorreoSolicitudEnRevision(
  destinatarioEmail: string,
  nombre: string,
  apellidos: string
): Promise<void> {
  try {
    const emailAPIUrl = 'https://us-central1-advance-medical-68626.cloudfunctions.net/emailAPI/sendEmail';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
          .header { background-color: #2a2a30; color: white; padding: 40px 30px; text-align: center; border-bottom: 3px solid #D4AF37; }
          .header img { max-width: 180px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto; }
          .content { background: #ffffff; padding: 40px 30px; }
          .status-box { background-color: #fef9f3; color: #333; border: 2px solid #D4AF37; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 2px 8px rgba(212, 175, 55, 0.15); }
          .status-box h3 { color: #B8941F; margin-top: 0; }
          .status-box strong { color: #B8941F; }
          .footer { background-color: #2a2a30; text-align: center; padding: 30px; color: #cccccc; font-size: 12px; border-top: 3px solid #D4AF37; }
          h1 { margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; }
          h2 { color: #2a2a30; margin-top: 0; font-size: 24px; font-weight: 600; }
          h3 { color: #2a2a30; font-size: 18px; font-weight: 600; }
          ul { padding-left: 20px; }
          li { margin: 10px 0; color: #333; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="background-color: #2a2a30; padding: 40px 30px; text-align: center; border-bottom: 3px solid #D4AF37;">
            <img src="https://firebasestorage.googleapis.com/v0/b/advance-medical-68626.firebasestorage.app/o/pre-configuraciones%2Fbranding-temp%2Ficono-1759185951906-kez3tj-logo.png?alt=media&token=259c0cad-5cac-4ae5-9f3d-cc6438eb8ec2" alt="Expo Empresarios de la Baja" style="max-width: 180px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;" />
            <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff !important;">⏳ Solicitud en Revisión</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre} ${apellidos},</h2>
            <p>Hemos recibido tu solicitud de registro para la <strong>Expo Empresarios de la Baja 2025</strong>.</p>
            
            <div class="status-box" style="background-color: #fef9f3; color: #333; border: 2px solid #D4AF37; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 2px 8px rgba(212, 175, 55, 0.15);">
              <h3 style="color: #B8941F !important; margin-top: 0;">📋 Estado de tu Solicitud</h3>
              <p style="font-size: 18px; margin: 10px 0; color: #333 !important;"><strong style="color: #B8941F !important;">En Revisión</strong></p>
              <p style="color: #333 !important; margin: 0;">Nuestro equipo está revisando tu información. Te enviaremos un correo electrónico cuando tu solicitud sea aprobada.</p>
            </div>

            <h3>¿Qué sigue?</h3>
            <ul>
              <li>Revisaremos tu solicitud en las próximas 24-48 horas</li>
              <li>Recibirás un correo de confirmación con un link para completar tu registro</li>
              <li>Podrás configurar tu invitado, contraseña y disponibilidad</li>
            </ul>

            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            
            <p style="margin-top: 30px;">
              <strong>¡Gracias por tu interés!</strong><br>
              Equipo Expo Empresarios de la Baja
            </p>
          </div>
          <div class="footer" style="background-color: #2a2a30; text-align: center; padding: 30px; border-top: 3px solid #D4AF37;">
            <p style="margin: 5px 0; font-size: 12px; color: #cccccc !important;">Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p style="margin: 5px 0; font-size: 12px; color: #cccccc !important;">© 2025 Expo Empresarios de la Baja. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await fetch(emailAPIUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: destinatarioEmail,
        subject: '⏳ Tu solicitud está en revisión - Expo Empresarios de la Baja',
        html: htmlContent,
        from: 'Expo Empresarios de la Baja <expoempresarioslabaja@gmail.com>',
      }),
    });

    console.log('✅ Correo de solicitud enviado');
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
  }
}

/**
 * Acepta una cita pendiente
 */
export async function aceptarCita(
  empresaId: string,
  citaDocId: string,
  userProfile: any,
  citaData: any
): Promise<void> {
  try {
    const userCollection = userProfile.tipo === 'expositor' ? 'expositores' : 'contactos';
    const organizadorCollection = citaData.conQuien.tipo === 'expositor' ? 'expositores' : 'contactos';

    // Actualizar en la colección del que acepta (invitado)
    const citaRef = doc(db, `empresas/${empresaId}/${userCollection}/${userProfile.id}/citas/${citaDocId}`);
    await updateDoc(citaRef, {
      status: 'confirmada',
      confirmada: true,
      fechaConfirmacion: new Date().toISOString(),
      // Limpiar campos de reagendamiento al confirmar
      reagendadaPor: null,
      razonReagendamiento: null,
      fechaReagendamiento: null,
    });

    // Buscar y actualizar en la colección del organizador
    const citasOrganizadorRef = collection(
      db,
      `empresas/${empresaId}/${organizadorCollection}/${citaData.conQuien.id}/citas`
    );
    const q = query(citasOrganizadorRef, where('citaId', '==', citaData.citaId));
    const snapshot = await getDocs(q);

    snapshot.forEach(async (docSnap) => {
      await updateDoc(docSnap.ref, {
        status: 'confirmada',
        confirmada: true,
        fechaConfirmacion: new Date().toISOString(),
        // Limpiar campos de reagendamiento al confirmar
        reagendadaPor: null,
        razonReagendamiento: null,
        fechaReagendamiento: null,
      });
    });

    // Enviar correo
    await enviarCorreoCitaAceptada(
      citaData.conQuien.email,
      citaData.conQuien.nombre,
      citaData.conQuien.apellidos,
      userProfile.nombre,
      userProfile.apellidos,
      citaData.fecha,
      citaData.hora,
      citaData.tema
    );

    console.log('✅ Cita aceptada y correo enviado');
  } catch (error) {
    console.error('Error al aceptar cita:', error);
    throw error;
  }
}

/**
 * Rechaza una cita pendiente
 */
export async function rechazarCita(
  empresaId: string,
  citaDocId: string,
  userProfile: any,
  citaData: any,
  razon: string,
  quiereReagendar: boolean
): Promise<void> {
  try {
    const userCollection = userProfile.tipo === 'expositor' ? 'expositores' : 'contactos';
    const organizadorCollection = citaData.conQuien.tipo === 'expositor' ? 'expositores' : 'contactos';

    // Actualizar en la colección del que rechaza
    const citaRef = doc(db, `empresas/${empresaId}/${userCollection}/${userProfile.id}/citas/${citaDocId}`);
    await updateDoc(citaRef, {
      status: 'rechazada',
      razonRechazo: razon,
      quiereReagendar,
      fechaRechazo: new Date().toISOString(),
      // Limpiar campos de reagendamiento al rechazar
      reagendadaPor: null,
      razonReagendamiento: null,
      fechaReagendamiento: null,
    });

    // Buscar y actualizar en la colección del organizador
    const citasOrganizadorRef = collection(
      db,
      `empresas/${empresaId}/${organizadorCollection}/${citaData.conQuien.id}/citas`
    );
    const q = query(citasOrganizadorRef, where('citaId', '==', citaData.citaId));
    const snapshot = await getDocs(q);

    snapshot.forEach(async (docSnap) => {
      await updateDoc(docSnap.ref, {
        status: 'rechazada',
        razonRechazo: razon,
        quiereReagendar,
        fechaRechazo: new Date().toISOString(),
        // Limpiar campos de reagendamiento al rechazar
        reagendadaPor: null,
        razonReagendamiento: null,
        fechaReagendamiento: null,
      });
    });

    // Enviar correo
    await enviarCorreoCitaRechazada(
      citaData.conQuien.email,
      citaData.conQuien.nombre,
      citaData.conQuien.apellidos,
      userProfile.nombre,
      userProfile.apellidos,
      citaData.fecha,
      citaData.hora,
      citaData.tema,
      razon,
      quiereReagendar
    );

    console.log('✅ Cita rechazada y correo enviado');
  } catch (error) {
    console.error('Error al rechazar cita:', error);
    throw error;
  }
}

/**
 * Reagenda una cita existente
 */
export async function reagendarCita(
  empresaId: string,
  citaDocId: string,
  citaId: string,
  userProfile: any,
  citaData: any,
  nuevaFecha: string,
  nuevaHora: string,
  razon?: string
): Promise<void> {
  try {
    const userCollection = userProfile.tipo === 'expositor' ? 'expositores' : 'contactos';
    const otroCollection = citaData.conQuien.tipo === 'expositor' ? 'expositores' : 'contactos';

    const cambios = {
      fecha: nuevaFecha,
      hora: nuevaHora,
      status: 'pendiente',
      confirmada: false,
      razonReagendamiento: razon || '',
      fechaReagendamiento: new Date().toISOString(),
      reagendadaPor: userProfile.id,
    };

    // Actualizar en la colección del que reagenda
    const citaRef = doc(db, `empresas/${empresaId}/${userCollection}/${userProfile.id}/citas/${citaDocId}`);
    await updateDoc(citaRef, cambios);

    // Buscar y actualizar en la colección del otro usuario
    const citasOtroRef = collection(
      db,
      `empresas/${empresaId}/${otroCollection}/${citaData.conQuien.id}/citas`
    );
    const q = query(citasOtroRef, where('citaId', '==', citaId));
    const snapshot = await getDocs(q);

    snapshot.forEach(async (docSnap) => {
      await updateDoc(docSnap.ref, cambios);
    });

    // Enviar correo
    await enviarCorreoCitaReagendada(
      citaData.conQuien.email,
      citaData.conQuien.nombre,
      citaData.conQuien.apellidos,
      userProfile.nombre,
      userProfile.apellidos,
      citaData.fecha,
      citaData.hora,
      nuevaFecha,
      nuevaHora,
      citaData.tema,
      razon || ''
    );

    console.log('✅ Cita reagendada y correo enviado');
  } catch (error) {
    console.error('Error al reagendar cita:', error);
    throw error;
  }
}

/**
 * Envía correo cuando se acepta una cita
 */
async function enviarCorreoCitaAceptada(
  destinatarioEmail: string,
  destinatarioNombre: string,
  destinatarioApellidos: string,
  aceptadorNombre: string,
  aceptadorApellidos: string,
  fecha: string,
  hora: string,
  tema: string
): Promise<void> {
  try {
    const emailAPIUrl = 'https://us-central1-advance-medical-68626.cloudfunctions.net/emailAPI/sendEmail';
    const fechaFormateada = new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita Confirmada - Expo Empresarios</title>
  <style>
    body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;margin:0;padding:40px 20px}
    .container{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
    .header{background-color:#2a2a30;padding:40px 30px;text-align:center;border-bottom:3px solid #D4AF37}
    .header img{max-width:180px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto}
    .header h1{color:#fff;font-size:28px;font-weight:700;margin:0;line-height:1.3}
    .header .subtitle{color:#D4AF37;font-size:16px;margin-top:10px;font-weight:500}
    .content{padding:40px 30px;background:#fff;color:#333}
    .content p{font-size:16px;line-height:1.6;color:#666;margin-bottom:16px}
    .content h2{color:#2a2a30;font-size:22px;margin-top:0;margin-bottom:20px;font-weight:600}
    .footer{background-color:#2a2a30;color:#cccccc;padding:30px;text-align:center;border-top:3px solid #D4AF37}
    .footer p{margin:8px 0;font-size:14px;color:#cccccc;line-height:1.5}
    @media only screen and (max-width:600px){
      body{padding:20px 10px}
      .header{padding:30px 20px}
      .header h1{font-size:22px}
      .content{padding:30px 20px}
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header" style="background-color:#2a2a30;padding:40px 30px;text-align:center;border-bottom:3px solid #D4AF37">
      <img src="https://firebasestorage.googleapis.com/v0/b/advance-medical-68626.firebasestorage.app/o/pre-configuraciones%2Fbranding-temp%2Ficono-1759185951906-kez3tj-logo.png?alt=media&token=259c0cad-5cac-4ae5-9f3d-cc6438eb8ec2" alt="Expo Empresarios de la Baja" style="max-width:180px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto" />
      <h1 style="color:#fff !important;font-size:28px;font-weight:700;margin:0;line-height:1.3">✅ Cita Confirmada</h1>
      <div class="subtitle" style="color:#D4AF37 !important;font-size:16px;margin-top:10px;font-weight:500">Tu reunión ha sido aceptada</div>
    </div>
    <div class="content" style="padding:40px 30px;background:#fff;color:#333">
      <h2 style="color:#2a2a30 !important;font-size:22px;margin-top:0;margin-bottom:20px;font-weight:600">Hola ${destinatarioNombre},</h2>
      
      <p style="font-size:16px;line-height:1.6;color:#666 !important;margin-bottom:16px">¡Excelentes noticias! <strong style="color:#333 !important">${aceptadorNombre} ${aceptadorApellidos}</strong> ha aceptado tu solicitud de reunión.</p>
      
      <div style="background-color:#e8f5e9 !important;color:#333 !important;border:2px solid #4CAF50;padding:25px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(76,175,80,0.15)">
        <h3 style="margin:0 0 20px 0;color:#2E7D32 !important;font-size:20px;font-weight:600">📋 Detalles de la Reunión</h3>
        <div style="margin:12px 0">
          <span style="font-weight:600;color:#2E7D32 !important;display:inline-block;width:100px">📌 Tema:</span>
          <span style="color:#333 !important;font-size:16px">${tema}</span>
        </div>
        <div style="margin:12px 0">
          <span style="font-weight:600;color:#2E7D32 !important;display:inline-block;width:100px">📅 Fecha:</span>
          <span style="color:#333 !important;font-size:16px">${fechaFormateada}</span>
        </div>
        <div style="margin:12px 0">
          <span style="font-weight:600;color:#2E7D32 !important;display:inline-block;width:100px">🕐 Hora:</span>
          <span style="color:#333 !important;font-size:16px">${hora}</span>
        </div>
      </div>

      <div style="background-color:#fef9f3 !important;color:#333 !important;border:2px solid #D4AF37;padding:20px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(212,175,55,0.15)">
        <h3 style="margin-top:0;color:#B8941F !important;font-size:18px;font-weight:600">💡 Recordatorio</h3>
        <ul style="margin:10px 0;padding-left:20px;line-height:1.8;color:#333 !important;list-style-type:disc">
          <li style="color:#333 !important;font-size:15px;margin:10px 0">La cita aparecerá en tu dashboard de reuniones</li>
          <li style="color:#333 !important;font-size:15px;margin:10px 0">Puedes agregar notas adicionales desde tu cuenta</li>
          <li style="color:#333 !important;font-size:15px;margin:10px 0">Te enviaremos un recordatorio antes del evento</li>
        </ul>
      </div>

      <p style="margin-top:30px;font-size:16px;line-height:1.6;color:#666 !important">
        <strong style="color:#333 !important">¡Nos vemos en el evento!</strong><br>
        Equipo Expo Empresarios de la Baja
      </p>
    </div>
    <div class="footer" style="background-color:#2a2a30;padding:30px;text-align:center;border-top:3px solid #D4AF37">
      <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5"><strong style="color:#D4AF37 !important">12ª Expo Empresarios de la Baja</strong></p>
      <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5">Viernes 21 de Noviembre, 2025 • Hotel Krystal Grand Los Cabos</p>
    </div>
  </div>
</body>
</html>
    `;

    await fetch(emailAPIUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: destinatarioEmail,
        subject: '✅ Cita Confirmada - Expo Empresarios de la Baja',
        html: htmlContent,
        from: 'Expo Empresarios de la Baja <expoempresariosdelabaja@gmail.com>',
      }),
    });

    console.log('✅ Correo de cita aceptada enviado');
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
  }
}

/**
 * Envía correo cuando se rechaza una cita
 */
async function enviarCorreoCitaRechazada(
  destinatarioEmail: string,
  destinatarioNombre: string,
  destinatarioApellidos: string,
  rechazadorNombre: string,
  rechazadorApellidos: string,
  fecha: string,
  hora: string,
  tema: string,
  razon: string,
  quiereReagendar: boolean
): Promise<void> {
  try {
    const emailAPIUrl = 'https://us-central1-advance-medical-68626.cloudfunctions.net/emailAPI/sendEmail';
    const fechaFormateada = new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita Rechazada - Expo Empresarios</title>
  <style>
    body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;margin:0;padding:40px 20px}
    .container{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
    .header{background-color:#2a2a30;padding:40px 30px;text-align:center;border-bottom:3px solid #D4AF37}
    .header img{max-width:180px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto}
    .header h1{color:#fff;font-size:28px;font-weight:700;margin:0;line-height:1.3}
    .header .subtitle{color:#EF4444;font-size:16px;margin-top:10px;font-weight:500}
    .content{padding:40px 30px;background:#fff;color:#333}
    .content p{font-size:16px;line-height:1.6;color:#666;margin-bottom:16px}
    .content h2{color:#2a2a30;font-size:22px;margin-top:0;margin-bottom:20px;font-weight:600}
    .footer{background-color:#2a2a30;color:#cccccc;padding:30px;text-align:center;border-top:3px solid #D4AF37}
    .footer p{margin:8px 0;font-size:14px;color:#cccccc;line-height:1.5}
    @media only screen and (max-width:600px){
      body{padding:20px 10px}
      .header{padding:30px 20px}
      .header h1{font-size:22px}
      .content{padding:30px 20px}
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header" style="background-color:#2a2a30;padding:40px 30px;text-align:center;border-bottom:3px solid #D4AF37">
      <img src="https://firebasestorage.googleapis.com/v0/b/advance-medical-68626.firebasestorage.app/o/pre-configuraciones%2Fbranding-temp%2Ficono-1759185951906-kez3tj-logo.png?alt=media&token=259c0cad-5cac-4ae5-9f3d-cc6438eb8ec2" alt="Expo Empresarios de la Baja" style="max-width:180px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto" />
      <h1 style="color:#fff !important;font-size:28px;font-weight:700;margin:0;line-height:1.3">❌ Cita Rechazada</h1>
      <div class="subtitle" style="color:#EF4444 !important;font-size:16px;margin-top:10px;font-weight:500">No se podrá realizar la reunión</div>
    </div>
    <div class="content" style="padding:40px 30px;background:#fff;color:#333">
      <h2 style="color:#2a2a30 !important;font-size:22px;margin-top:0;margin-bottom:20px;font-weight:600">Hola ${destinatarioNombre},</h2>
      
      <p style="font-size:16px;line-height:1.6;color:#666 !important;margin-bottom:16px">Lamentamos informarte que <strong style="color:#333 !important">${rechazadorNombre} ${rechazadorApellidos}</strong> no puede asistir a la reunión programada.</p>
      
      <div style="background-color:#fff3f3 !important;color:#333 !important;border:2px solid #EF4444;padding:20px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(239,68,68,0.15)">
        <h3 style="margin:0 0 15px 0;color:#DC2626 !important;font-size:18px;font-weight:600">📋 Detalles de la Reunión Cancelada</h3>
        <div style="margin:12px 0">
          <span style="font-weight:600;color:#DC2626 !important;display:inline-block;min-width:130px">📌 Tema:</span>
          <span style="color:#333 !important;font-size:16px">${tema}</span>
        </div>
        <div style="margin:12px 0">
          <span style="font-weight:600;color:#DC2626 !important;display:inline-block;min-width:130px">📅 Fecha original:</span>
          <span style="color:#333 !important;font-size:16px">${fechaFormateada}</span>
        </div>
        <div style="margin:12px 0">
          <span style="font-weight:600;color:#DC2626 !important;display:inline-block;min-width:130px">🕐 Hora:</span>
          <span style="color:#333 !important;font-size:16px">${hora}</span>
        </div>
      </div>

      <div style="background-color:#fff3cd !important;border:2px solid #ffc107;border-radius:12px;padding:20px;margin:25px 0">
        <h3 style="margin:0 0 12px 0;color:#856404 !important;font-size:18px;font-weight:600">💬 Razón del Rechazo</h3>
        <p style="margin:0;color:#856404 !important;font-size:15px;line-height:1.6;font-style:italic">
          "${razon}"
        </p>
      </div>

      ${quiereReagendar ? `
      <div style="background-color:#e8f5e9 !important;color:#333 !important;border:2px solid #4CAF50;padding:20px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(76,175,80,0.15)">
        <h3 style="margin:0 0 12px 0;color:#2E7D32 !important;font-size:18px;font-weight:600">✨ Buenas Noticias</h3>
        <p style="margin:0;color:#333 !important;font-size:15px;line-height:1.6">
          La persona está interesada en <strong style="color:#2E7D32 !important">reagendar para otra fecha</strong>. Puedes ponerte en contacto directamente desde tu dashboard para coordinar un nuevo horario.
        </p>
      </div>
      ` : `
      <div style="background-color:#fef9f3 !important;color:#333 !important;border:2px solid #D4AF37;padding:20px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(212,175,55,0.15)">
        <h3 style="margin-top:0;color:#B8941F !important;font-size:18px;font-weight:600">💡 Sugerencia</h3>
        <p style="margin:0;color:#333 !important;font-size:15px;line-height:1.6">
          Durante el evento, podrás conectar con muchos otros expositores y asistentes. ¡No te desanimes y sigue generando oportunidades de networking!
        </p>
      </div>
      `}

      <p style="margin-top:30px;font-size:16px;line-height:1.6;color:#666 !important">
        <strong style="color:#333 !important">Equipo Expo Empresarios de la Baja</strong>
      </p>
    </div>
    <div class="footer" style="background-color:#2a2a30;padding:30px;text-align:center;border-top:3px solid #D4AF37">
      <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5"><strong style="color:#D4AF37 !important">12ª Expo Empresarios de la Baja</strong></p>
      <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5">Viernes 21 de Noviembre, 2025 • Hotel Krystal Grand Los Cabos</p>
    </div>
  </div>
</body>
</html>
    `;

    await fetch(emailAPIUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: destinatarioEmail,
        subject: '❌ Cita Rechazada - Expo Empresarios de la Baja',
        html: htmlContent,
        from: 'Expo Empresarios de la Baja <expoempresariosdelabaja@gmail.com>',
      }),
    });

    console.log('✅ Correo de cita rechazada enviado');
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
  }
}

/**
 * Envía correo cuando se reagenda una cita
 */
async function enviarCorreoCitaReagendada(
  destinatarioEmail: string,
  destinatarioNombre: string,
  destinatarioApellidos: string,
  reagendadorNombre: string,
  reagendadorApellidos: string,
  fechaAnterior: string,
  horaAnterior: string,
  fechaNueva: string,
  horaNueva: string,
  tema: string,
  razon: string
): Promise<void> {
  try {
    const emailAPIUrl = 'https://us-central1-advance-medical-68626.cloudfunctions.net/emailAPI/sendEmail';
    const fechaAnteriorFormateada = new Date(fechaAnterior + 'T00:00:00').toLocaleDateString('es-ES');
    const fechaNuevaFormateada = new Date(fechaNueva + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita Reagendada - Expo Empresarios</title>
  <style>
    body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;margin:0;padding:40px 20px}
    .container{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
    .header{background-color:#2a2a30;padding:40px 30px;text-align:center;border-bottom:3px solid #D4AF37}
    .header img{max-width:180px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto}
    .header h1{color:#fff;font-size:28px;font-weight:700;margin:0;line-height:1.3}
    .header .subtitle{color:#3B82F6;font-size:16px;margin-top:10px;font-weight:500}
    .content{padding:40px 30px;background:#fff;color:#333}
    .content p{font-size:16px;line-height:1.6;color:#666;margin-bottom:16px}
    .content h2{color:#2a2a30;font-size:22px;margin-top:0;margin-bottom:20px;font-weight:600}
    .footer{background-color:#2a2a30;color:#cccccc;padding:30px;text-align:center;border-top:3px solid #D4AF37}
    .footer p{margin:8px 0;font-size:14px;color:#cccccc;line-height:1.5}
    @media only screen and (max-width:600px){
      body{padding:20px 10px}
      .header{padding:30px 20px}
      .header h1{font-size:22px}
      .content{padding:30px 20px}
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header" style="background-color:#2a2a30;padding:40px 30px;text-align:center;border-bottom:3px solid #D4AF37">
      <img src="https://firebasestorage.googleapis.com/v0/b/advance-medical-68626.firebasestorage.app/o/pre-configuraciones%2Fbranding-temp%2Ficono-1759185951906-kez3tj-logo.png?alt=media&token=259c0cad-5cac-4ae5-9f3d-cc6438eb8ec2" alt="Expo Empresarios de la Baja" style="max-width:180px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto" />
      <h1 style="color:#fff !important;font-size:28px;font-weight:700;margin:0;line-height:1.3">↻ Cita Reagendada</h1>
      <div class="subtitle" style="color:#3B82F6 !important;font-size:16px;margin-top:10px;font-weight:500">Nueva fecha propuesta</div>
    </div>
    <div class="content" style="padding:40px 30px;background:#fff;color:#333">
      <h2 style="color:#2a2a30 !important;font-size:22px;margin-top:0;margin-bottom:20px;font-weight:600">Hola ${destinatarioNombre},</h2>
      
      <p style="font-size:16px;line-height:1.6;color:#666 !important;margin-bottom:16px"><strong style="color:#333 !important">${reagendadorNombre} ${reagendadorApellidos}</strong> ha propuesto un cambio de horario para su reunión.</p>
      
      <div style="background-color:#e8f5e9 !important;color:#333 !important;border:2px solid #4CAF50;padding:25px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(76,175,80,0.15)">
        <h3 style="margin:0 0 20px 0;color:#2E7D32 !important;font-size:20px;font-weight:600">📋 Detalles de la Reunión</h3>
        <div style="margin:12px 0">
          <span style="font-weight:600;color:#2E7D32 !important;display:inline-block;min-width:100px">📌 Tema:</span>
          <span style="color:#333 !important;font-size:16px">${tema}</span>
        </div>
      </div>

      <div style="background-color:#fff3f3 !important;color:#333 !important;border:2px solid #EF4444;padding:20px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(239,68,68,0.15)">
        <h3 style="margin:0 0 15px 0;color:#DC2626 !important;font-size:18px;font-weight:600">❌ Fecha Anterior</h3>
        <div style="margin:8px 0;text-decoration:line-through">
          <span style="color:#999 !important;font-size:16px">📅 ${fechaAnteriorFormateada} • 🕐 ${horaAnterior}</span>
        </div>
      </div>

      <div style="background-color:#e8f5e9 !important;color:#333 !important;border:2px solid #4CAF50;padding:25px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(76,175,80,0.15)">
        <h3 style="margin:0 0 15px 0;color:#2E7D32 !important;font-size:18px;font-weight:600">✅ Nueva Fecha Propuesta</h3>
        <div style="margin:12px 0">
          <span style="font-weight:600;color:#2E7D32 !important;display:inline-block;min-width:100px">📅 Fecha:</span>
          <span style="color:#2E7D32 !important;font-size:16px;font-weight:600">${fechaNuevaFormateada}</span>
        </div>
        <div style="margin:12px 0">
          <span style="font-weight:600;color:#2E7D32 !important;display:inline-block;min-width:100px">🕐 Hora:</span>
          <span style="color:#2E7D32 !important;font-size:16px;font-weight:600">${horaNueva}</span>
        </div>
      </div>

      ${razon ? `
      <div style="background-color:#fff3cd !important;border:2px solid #ffc107;border-radius:12px;padding:20px;margin:25px 0">
        <h3 style="margin:0 0 12px 0;color:#856404 !important;font-size:18px;font-weight:600">💬 Razón del Cambio</h3>
        <p style="margin:0;color:#856404 !important;font-size:15px;line-height:1.6;font-style:italic">
          "${razon}"
        </p>
      </div>
      ` : ''}

      <div style="background-color:#fef9f3 !important;color:#333 !important;border:2px solid #D4AF37;padding:20px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(212,175,55,0.15)">
        <h3 style="margin-top:0;color:#B8941F !important;font-size:18px;font-weight:600">⚠️ Acción Requerida</h3>
        <p style="margin:0;color:#333 !important;font-size:15px;line-height:1.6">
          Por favor, inicia sesión en tu cuenta para <strong style="color:#B8941F !important">confirmar o proponer una nueva fecha</strong>. La cita aparecerá en estado "Pendiente de Confirmación" hasta que tomes una acción.
        </p>
      </div>

      <p style="margin-top:30px;font-size:16px;line-height:1.6;color:#666 !important">
        <strong style="color:#333 !important">Equipo Expo Empresarios de la Baja</strong>
      </p>
    </div>
    <div class="footer" style="background-color:#2a2a30;padding:30px;text-align:center;border-top:3px solid #D4AF37">
      <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5"><strong style="color:#D4AF37 !important">12ª Expo Empresarios de la Baja</strong></p>
      <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5">Viernes 21 de Noviembre, 2025 • Hotel Krystal Grand Los Cabos</p>
    </div>
  </div>
</body>
</html>
    `;

    await fetch(emailAPIUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: destinatarioEmail,
        subject: '↻ Cita Reagendada - Expo Empresarios de la Baja',
        html: htmlContent,
        from: 'Expo Empresarios de la Baja <expoempresariosdelabaja@gmail.com>',
      }),
    });

    console.log('✅ Correo de cita reagendada enviado');
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
  }
}

/**
 * Crea una solicitud de expositor sin cuenta (estado pendiente)
 */
export async function crearSolicitudExpositor(empresaId: string, data: any) {
  try {
    console.log('📝 Creando solicitud de expositor...');

    const solicitudData = {
      ...data,
      status: 'Pendiente',
      fechaSolicitud: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      registroCompleto: false,
      tipoContacto: 'expositor',
      eliminado: false, // ⚠️ IMPORTANTE: Necesario para que aparezca en el listado del CRM
      historial: [{
        tipo: 'solicitud_creada',
        fecha: new Date().toISOString(),
        descripcion: 'Solicitud de expositor creada desde la página web'
      }]
    };

    const expositoresRef = collection(db, `empresas/${empresaId}/expositores`);
    const docRef = await addDoc(expositoresRef, solicitudData);

    console.log('✅ Solicitud creada con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error al crear solicitud:', error);
    throw error;
  }
}

/**
 * Envía correo de solicitud en revisión
 */
export async function enviarCorreoSolicitudEnRevisionExpositor(
  email: string,
  nombre: string,
  empresa: string
) {
  try {
    console.log('📧 Enviando correo de solicitud en revisión a:', email);

    const emailAPIUrl = import.meta.env.VITE_EMAIL_API_URL ||
      'https://us-central1-advance-medical-68626.cloudfunctions.net/emailAPI/sendEmail';

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solicitud en Revisión - Expo Empresarios</title>
  <style>
    body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;margin:0;padding:40px 20px}
    .container{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
    .header{background-color:#2a2a30;padding:40px 30px;text-align:center;border-bottom:3px solid #D4AF37}
    .header img{max-width:180px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto}
    .header h1{color:#fff;font-size:28px;font-weight:700;margin:0;line-height:1.3}
    .header .subtitle{color:#D4AF37;font-size:16px;margin-top:10px;font-weight:500}
    .content{padding:40px 30px;background:#fff;color:#333}
    .content p{font-size:16px;line-height:1.6;color:#666;margin-bottom:16px}
    .content h3{color:#2a2a30;font-size:18px;margin:25px 0 12px;font-weight:600}
    .info-box{background-color:#fef9f3;color:#333;border:2px solid #D4AF37;padding:20px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(212,175,55,0.15)}
    .info-box h3{margin-top:0;color:#B8941F}
    .info-box strong{color:#B8941F}
    .footer{background-color:#2a2a30;color:#cccccc;padding:30px;text-align:center;border-top:3px solid #D4AF37}
    .footer p{margin:8px 0;font-size:14px;color:#cccccc;line-height:1.5}
    .footer strong{color:#D4AF37}
    .footer a{color:#D4AF37;text-decoration:none}
    @media only screen and (max-width:600px){
      body{padding:20px 10px}
      .header{padding:30px 20px}
      .header h1{font-size:22px}
      .content{padding:30px 20px}
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header" style="background-color:#2a2a30;padding:40px 30px;text-align:center;border-bottom:3px solid #D4AF37">
      <img src="https://firebasestorage.googleapis.com/v0/b/advance-medical-68626.firebasestorage.app/o/pre-configuraciones%2Fbranding-temp%2Ficono-1759185951906-kez3tj-logo.png?alt=media&token=259c0cad-5cac-4ae5-9f3d-cc6438eb8ec2" alt="Expo Empresarios de la Baja" style="max-width:180px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto" />
      <h1 style="color:#fff !important;font-size:28px;font-weight:700;margin:0;line-height:1.3">¡Solicitud Recibida! 📋</h1>
      <div class="subtitle" style="color:#D4AF37 !important;font-size:16px;margin-top:10px;font-weight:500">Estamos revisando tu información</div>
    </div>
      <div class="content">
        <p>Estimado/a <strong>${nombre}</strong>,</p>
        
        <p>Gracias por tu interés en participar como expositor en la <strong>12ª Expo Empresarios de la Baja</strong>.</p>
        
        <div class="info-box" style="background-color: #fef9f3; color: #333; border: 2px solid #D4AF37; padding: 20px; margin: 25px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(212, 175, 55, 0.15);">
          <h3 style="margin-top: 0; color: #B8941F !important;">📋 Tu solicitud está en revisión</h3>
          <p style="margin:8px 0; color: #333 !important;">Hemos recibido la información de <strong style="color: #B8941F !important;">${empresa}</strong> y nuestro equipo está revisando tu solicitud.</p>
        </div>
        
        <div class="info-box" style="background-color: #fef9f3; color: #333; border: 2px solid #D4AF37; padding: 20px; margin: 25px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(212, 175, 55, 0.15);">
          <h3 style="margin-top: 0; color: #B8941F !important;">📬 Próximos pasos:</h3>
          <ol style="padding-left:20px;color:#333;line-height:1.8;margin:10px 0;">
            <li style="color: #333 !important;">Nuestro equipo revisará tu información</li>
            <li style="color: #333 !important;">Recibirás un correo con un <strong style="color: #B8941F !important;">enlace único</strong> si tu solicitud es aprobada</li>
            <li style="color: #333 !important;">Con ese enlace podrás:
              <ul style="margin-top:8px;">
                <li style="color: #333 !important;">Crear tu contraseña de acceso</li>
                <li style="color: #333 !important;">Completar tu perfil de expositor</li>
                <li style="color: #333 !important;">Acceder a tu dashboard</li>
                <li style="color: #333 !important;">Subir tu catálogo y galería</li>
              </ul>
            </li>
          </ol>
        </div>
        
        <p>Recibirás una respuesta en las próximas <strong style="color:#B8941F">24-48 horas</strong>.</p>
        
        <p style="color:#999;font-size:14px;margin-top:25px">Revisa tu bandeja de entrada y spam para no perder nuestro correo.</p>
      </div>
      <div class="footer" style="background-color:#2a2a30;padding:30px;text-align:center;border-top:3px solid #D4AF37">
        <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5"><strong style="color:#D4AF37 !important">12ª Expo Empresarios de la Baja</strong></p>
        <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5">Viernes 21 de Noviembre, 2025</p>
        <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5">📍 Hotel Krystal Grand Los Cabos</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    await fetch(emailAPIUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: '📋 Solicitud de Expositor en Revisión - Expo Empresarios de la Baja',
        html: htmlContent,
        from: 'Expo Empresarios de la Baja <cloud.send.email@gmail.com>',

      }),
    });

    console.log('✅ Correo de solicitud en revisión enviado');
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    throw error;
  }
}

/**
 * Envía correo de cuenta aceptada con enlace para crear contraseña
 */
export async function enviarCorreoExpositorAceptado(
  email: string,
  nombre: string,
  empresa: string,
  expositorId: string,
  landingUrl: string
) {
  try {
    console.log('📧 Enviando correo de expositor aceptado a:', email);

    const emailAPIUrl = import.meta.env.VITE_EMAIL_API_URL ||
      'https://us-central1-advance-medical-68626.cloudfunctions.net/emailAPI/sendEmail';

    const registroUrl = `${landingUrl}/registro-expositor?expositor=${expositorId}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Solicitud Aceptada! - Expo Empresarios</title>
  <style>
    body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;margin:0;padding:40px 20px}
    .container{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
    .header{background-color:#2a2a30;padding:40px 30px;text-align:center;border-bottom:3px solid #D4AF37}
    .header img{max-width:180px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto}
    .header h1{color:#fff;font-size:28px;font-weight:700;margin:0;line-height:1.3}
    .header .subtitle{color:#D4AF37;font-size:16px;margin-top:10px;font-weight:500}
    .content{padding:40px 30px;background:#fff;color:#333}
    .content p{font-size:16px;line-height:1.6;color:#666;margin-bottom:16px}
    .content h3{color:#2a2a30;font-size:18px;margin:25px 0 12px;font-weight:600}
    .button{display:inline-block;background-color:#D4AF37;color:#fff!important;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:16px;font-weight:600;box-shadow:0 4px 15px rgba(212,175,55,0.3);margin:20px 0}
    .info-box{background-color:#fef9f3;color:#333;border:2px solid #D4AF37;padding:20px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(212,175,55,0.15)}
    .info-box h3{margin-top:0;color:#B8941F}
    .info-box strong{color:#B8941F}
    .footer{background-color:#2a2a30;color:#cccccc;padding:30px;text-align:center;border-top:3px solid #D4AF37}
    .footer p{margin:8px 0;font-size:14px;color:#cccccc;line-height:1.5}
    .footer strong{color:#D4AF37}
    .footer a{color:#D4AF37;text-decoration:none}
    @media only screen and (max-width:600px){
      body{padding:20px 10px}
      .header{padding:30px 20px}
      .header h1{font-size:22px}
      .content{padding:30px 20px}
      .button{padding:14px 30px;font-size:15px}
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header" style="background-color:#2a2a30;padding:40px 30px;text-align:center;border-bottom:3px solid #D4AF37">
      <img src="https://firebasestorage.googleapis.com/v0/b/advance-medical-68626.firebasestorage.app/o/pre-configuraciones%2Fbranding-temp%2Ficono-1759185951906-kez3tj-logo.png?alt=media&token=259c0cad-5cac-4ae5-9f3d-cc6438eb8ec2" alt="Expo Empresarios de la Baja" style="max-width:180px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto" />
      <h1 style="color:#fff !important;font-size:28px;font-weight:700;margin:0;line-height:1.3">¡Felicidades! 🎉</h1>
      <div class="subtitle" style="color:#D4AF37 !important;font-size:16px;margin-top:10px;font-weight:500">Tu solicitud ha sido aceptada</div>
    </div>
      <div class="content" style="padding:40px 30px;background:#fff;color:#333">
        <p style="font-size:16px;line-height:1.6;color:#666 !important;margin-bottom:16px">Estimado/a <strong style="color:#333 !important">${nombre}</strong>,</p>
        
        <p style="font-size:16px;line-height:1.6;color:#666 !important;margin-bottom:16px">¡Excelentes noticias! Tu solicitud para participar como expositor en la <strong style="color:#333 !important">12ª Expo Empresarios de la Baja</strong> ha sido <strong style="color:#10B981 !important">APROBADA</strong>.</p>
        
        <p style="font-size:16px;line-height:1.6;color:#666 !important;margin-bottom:16px">Estamos emocionados de que <strong style="color:#333 !important">${empresa}</strong> forme parte de este gran evento.</p>
        
        <div style="background-color: #e8f5e9 !important; color: #333 !important; border: 2px solid #4CAF50; padding: 20px; margin: 25px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);">
          <h3 style="margin-top: 0; color: #2E7D32 !important; font-size:18px; font-weight:600">🚀 Completa tu registro ahora</h3>
          <p style="margin:8px 0; color: #333 !important; font-size:16px; line-height:1.6">Para activar tu cuenta, necesitas completar tu perfil y crear tu contraseña de acceso.</p>
          
          <div style="text-align:center;margin:25px 0">
            <a href="${registroUrl}" style="display: inline-block; background-color: #D4AF37 !important; color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">Completar Mi Registro</a>
          </div>
        </div>
        
        <div style="background-color: #fef9f3 !important; color: #333 !important; border: 2px solid #D4AF37; padding: 20px; margin: 25px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(212, 175, 55, 0.15);">
          <h3 style="margin-top: 0; color: #B8941F !important; font-size:18px; font-weight:600">📋 En el registro podrás:</h3>
          <ul style="padding-left:20px;color:#333 !important;line-height:1.8;margin:10px 0;list-style-type:disc">
            <li style="color: #333 !important; font-size:16px">Crear tu contraseña de acceso</li>
            <li style="color: #333 !important; font-size:16px">Subir el logo de tu empresa</li>
            <li style="color: #333 !important; font-size:16px">Agregar imágenes de tus productos/servicios</li>
            <li style="color: #333 !important; font-size:16px">Configurar tu disponibilidad para reuniones</li>
            <li style="color: #333 !important; font-size:16px">Acceder a tu dashboard de expositor</li>
          </ul>
        </div>
        
        <p style="font-size:16px;line-height:1.6;color:#666 !important;margin-bottom:16px"><strong style="color:#333 !important">⚠️ Importante:</strong> Este enlace es único y personal. Completa tu registro lo antes posible para no perder tu lugar.</p>
        
        <p style="color:#999 !important;font-size:13px;margin-top:25px;line-height:1.6">Si el botón no funciona, copia y pega este enlace en tu navegador:<br><a href="${registroUrl}" style="color:#D4AF37 !important;text-decoration:underline;word-break:break-all">${registroUrl}</a></p>
      </div>
      <div class="footer" style="background-color:#2a2a30;padding:30px;text-align:center;border-top:3px solid #D4AF37">
        <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5"><strong style="color:#D4AF37 !important">12ª Expo Empresarios de la Baja</strong></p>
        <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5">Viernes 21 de Noviembre, 2025</p>
        <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5">📍 Hotel Krystal Grand Los Cabos</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    await fetch(emailAPIUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: '🎉 ¡Solicitud Aceptada! Completa tu Registro - Expo Empresarios',
        html: htmlContent,
        from: 'Expo Empresarios de la Baja <cloud.send.email@gmail.com>',
      }),
    });

    console.log('✅ Correo de expositor aceptado enviado');
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    throw error;
  }
}

/**
 * Crea una invitación de expositor y envía el correo
 */
export async function crearInvitacionExpositor(
  empresaId: string,
  expositorId: string,
  datosInvitado: {
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
    puesto: string;
    empresa: string;
    nombreExpositor: string;
  },
  invitadoIdExistente?: string
): Promise<string> {
  try {
    const fechaActual = new Date().toISOString();
    const landingUrl = import.meta.env.VITE_LANDING_URL || 'convencion-baja.scaleflow.tech';

    // Crear o actualizar el documento del invitado en contactos
    const invitadoData = {
      nombre: datosInvitado.nombre,
      apellidos: datosInvitado.apellidos || '',
      email: datosInvitado.email,
      telefono: datosInvitado.telefono,
      empresa: datosInvitado.empresa,
      puesto: datosInvitado.puesto,
      tipoContacto: 'colaborador',
      invitadoPor: expositorId,
      fechaInvitacion: fechaActual,
      registroCompleto: false,
      esInvitadoExpositor: true,
      fechaActualizacion: fechaActual,
      historial: [
        {
          tipo: 'invitacion_creada',
          fecha: fechaActual,
          descripcion: `Invitado por ${datosInvitado.nombreExpositor}`,
        }
      ]
    };

    let invitadoId: string;

    if (invitadoIdExistente) {
      // Actualizar invitado existente
      const invitadoRef = doc(db, `empresas/${empresaId}/contactos/${invitadoIdExistente}`);
      await updateDoc(invitadoRef, {
        ...invitadoData,
        fechaReenvio: fechaActual,
      });
      invitadoId = invitadoIdExistente;
    } else {
      // Crear nuevo invitado
      const contactosRef = collection(db, `empresas/${empresaId}/contactos`);
      const docRef = await addDoc(contactosRef, invitadoData);
      invitadoId = docRef.id;
    }

    // Enviar correo de invitación
    const registroUrl = `${landingUrl}/registro?invitado=${invitadoId}`;
    await enviarCorreoInvitacionColaborador(
      datosInvitado.email,
      datosInvitado.nombre,
      datosInvitado.empresa,
      datosInvitado.nombreExpositor,
      registroUrl
    );

    console.log('✅ Invitación creada y correo enviado');
    return invitadoId;
  } catch (error) {
    console.error('❌ Error al crear invitación:', error);
    throw error;
  }
}

/**
 * Obtiene la lista de invitados de un expositor
 */
export async function obtenerInvitadosExpositor(
  empresaId: string,
  expositorId: string
): Promise<any[]> {
  try {
    const contactosRef = collection(db, `empresas/${empresaId}/contactos`);
    const q = query(
      contactosRef,
      where('invitadoPor', '==', expositorId),
      where('esInvitadoExpositor', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const invitados = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return invitados;
  } catch (error) {
    console.error('❌ Error al obtener invitados:', error);
    throw error;
  }
}

/**
 * Envía correo de invitación a colaborador de expositor
 */
async function enviarCorreoInvitacionColaborador(
  email: string,
  nombre: string,
  empresa: string,
  nombreExpositor: string,
  registroUrl: string
): Promise<void> {
  try {
    const emailAPIUrl = 'https://us-central1-advance-medical-68626.cloudfunctions.net/emailAPI/sendEmail';

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a la Expo Empresarios de la Baja</title>
  <style>
    body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;margin:0;padding:40px 20px}
    .container{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
    .header{background-color:#2a2a30;padding:40px 30px;text-align:center;border-bottom:3px solid #D4AF37}
    .header img{max-width:180px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto}
    .header h1{color:#fff;font-size:28px;font-weight:700;margin:0;line-height:1.3}
    .header .subtitle{color:#D4AF37;font-size:16px;margin-top:10px;font-weight:500}
    .content{padding:40px 30px;background:#fff;color:#333}
    .content p{font-size:16px;line-height:1.6;color:#666;margin-bottom:16px}
    .content h3{color:#2a2a30;font-size:18px;margin:25px 0 12px;font-weight:600}
    .button{display:inline-block;background-color:#D4AF37;color:#fff!important;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:16px;font-weight:600;box-shadow:0 4px 15px rgba(212,175,55,0.3);margin:20px 0}
    .info-box{background-color:#fef9f3;color:#333;border:2px solid #D4AF37;padding:20px;margin:25px 0;border-radius:12px;box-shadow:0 2px 8px rgba(212,175,55,0.15)}
    .info-box h3{margin-top:0;color:#B8941F}
    .info-box strong{color:#B8941F}
    .footer{background-color:#2a2a30;color:#cccccc;padding:30px;text-align:center;border-top:3px solid #D4AF37}
    .footer p{margin:8px 0;font-size:14px;color:#cccccc;line-height:1.5}
    .footer strong{color:#D4AF37}
    .footer a{color:#D4AF37;text-decoration:none}
    @media only screen and (max-width:600px){
      body{padding:20px 10px}
      .header{padding:30px 20px}
      .header h1{font-size:22px}
      .content{padding:30px 20px}
      .button{padding:14px 30px;font-size:15px}
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header" style="background-color:#2a2a30;padding:40px 30px;text-align:center;border-bottom:3px solid #D4AF37">
      <img src="https://firebasestorage.googleapis.com/v0/b/advance-medical-68626.firebasestorage.app/o/pre-configuraciones%2Fbranding-temp%2Ficono-1759185951906-kez3tj-logo.png?alt=media&token=259c0cad-5cac-4ae5-9f3d-cc6438eb8ec2" alt="Expo Empresarios de la Baja" style="max-width:180px;height:auto;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto" />
      <h1 style="color:#fff !important;font-size:28px;font-weight:700;margin:0;line-height:1.3">¡Estás Invitado! 🎉</h1>
      <div class="subtitle" style="color:#D4AF37 !important;font-size:16px;margin-top:10px;font-weight:500">12ª Expo Empresarios de la Baja</div>
    </div>
    <div class="content" style="padding:40px 30px;background:#fff;color:#333">
      <p style="font-size:16px;line-height:1.6;color:#666 !important;margin-bottom:16px">Hola <strong style="color:#333 !important">${nombre}</strong>,</p>
      
      <p style="font-size:16px;line-height:1.6;color:#666 !important;margin-bottom:16px"><strong style="color:#333 !important">${nombreExpositor}</strong> de <strong style="color:#333 !important">${empresa}</strong> te ha invitado a participar en la <strong style="color:#333 !important">12ª Expo Empresarios de la Baja</strong>.</p>
      
      <div style="background-color: #e8f5e9 !important; color: #333 !important; border: 2px solid #4CAF50; padding: 20px; margin: 25px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);">
        <h3 style="margin-top: 0; color: #2E7D32 !important; font-size:18px; font-weight:600">🎯 Completa tu registro</h3>
        <p style="margin:8px 0; color: #333 !important; font-size:16px; line-height:1.6">Crea tu cuenta para acceder a todas las funciones de la expo:</p>
        <ul style="padding-left:20px;color:#333 !important;line-height:1.8;margin:10px 0;list-style-type:disc">
          <li style="color: #333 !important; font-size:15px">Agenda reuniones con expositores</li>
          <li style="color: #333 !important; font-size:15px">Guarda tus contactos de interés</li>
          <li style="color: #333 !important; font-size:15px">Accede al directorio completo</li>
          <li style="color: #333 !important; font-size:15px">Configura tu disponibilidad</li>
        </ul>
        
        <div style="text-align:center;margin:25px 0">
          <a href="${registroUrl}" style="display: inline-block; background-color: #D4AF37 !important; color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">Completar Mi Registro</a>
        </div>
      </div>
      
      <div style="background-color: #fef9f3 !important; color: #333 !important; border: 2px solid #D4AF37; padding: 20px; margin: 25px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(212, 175, 55, 0.15);">
        <h3 style="margin-top: 0; color: #B8941F !important; font-size:18px; font-weight:600">📋 Detalles del Evento</h3>
        <p style="margin:8px 0; color: #333 !important;"><strong style="color: #B8941F !important;">📅 Fecha:</strong> Viernes 21 de noviembre 2025</p>
        <p style="margin:8px 0; color: #333 !important;"><strong style="color: #B8941F !important;">📍 Lugar:</strong> Hotel Krystal Grand Los Cabos</p>
        <p style="margin:8px 0; color: #333 !important;"><strong style="color: #B8941F !important;">🎯 Asistentes:</strong> Más de 600 ejecutivos</p>
        <p style="margin:8px 0; color: #333 !important;"><strong style="color: #B8941F !important;">🏢 Empresa:</strong> ${empresa}</p>
      </div>
      
      <p style="font-size:16px;line-height:1.6;color:#666 !important;margin-bottom:16px"><strong style="color:#333 !important">⚠️ Importante:</strong> Este enlace es único y personal. Completa tu registro para confirmar tu asistencia.</p>
      
      <p style="color:#999 !important;font-size:13px;margin-top:25px;line-height:1.6">Si el botón no funciona, copia y pega este enlace en tu navegador:<br><a href="${registroUrl}" style="color:#D4AF37 !important;text-decoration:underline;word-break:break-all">${registroUrl}</a></p>
    </div>
    <div class="footer" style="background-color:#2a2a30;padding:30px;text-align:center;border-top:3px solid #D4AF37">
      <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5"><strong style="color:#D4AF37 !important">12ª Expo Empresarios de la Baja</strong></p>
      <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5">Viernes 21 de Noviembre, 2025</p>
      <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5">📍 Hotel Krystal Grand Los Cabos</p>
      <div style="margin:20px 0;height:1px;background:#555"></div>
      <p style="margin:8px 0;font-size:14px;color:#cccccc !important;line-height:1.5">📧 <a href="mailto:info@expo-empresarios.com" style="color:#D4AF37 !important;text-decoration:none">info@expo-empresarios.com</a></p>
      <p style="margin-top:20px;font-size:12px;color:#999 !important">Este es un correo automático. No respondas directamente a este mensaje.</p>
      <p style="margin-top:15px;font-size:11px;color:#888 !important">© 2025 Expo Empresarios de la Baja. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
    `;

    await fetch(emailAPIUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: '🎉 Invitación a la Expo Empresarios de la Baja - Completa tu Registro',
        html: htmlContent,
        from: 'Expo Empresarios de la Baja <cloud.send.email@gmail.com>',
      }),
    });

    console.log('✅ Correo de invitación enviado');
  } catch (error) {
    console.error('❌ Error al enviar correo de invitación:', error);
    throw error;
  }
}
