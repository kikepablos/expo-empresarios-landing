import { FormEvent, useCallback, useMemo, useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { submitRegistration } from '@/lib/firebaseFunctions';
import { getInvitadoData, updateInvitadoData, crearSolicitud, generarCodigoConfirmacion, enviarCorreoConfirmacion, enviarCorreoSolicitud, createUserAccount, db, crearSolicitudRegistro, enviarCorreoSolicitudEnRevision, auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { EMPRESA_ID } from '@/config/constants';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';

const guestTypeOptions = [
  { value: 'sin invitado', label: 'Sin invitado' },
  { value: 'invitado personal', label: 'Invitado personal' },
  { value: 'colaborador', label: 'Colaborador' },
] as const;

const guestRelationshipOptions = [
  { value: 'conyuge', label: 'Esposo(a) / Pareja' },
  { value: 'hijo', label: 'Hijo(a)' },
  { value: 'padre', label: 'Padre / Madre' },
  { value: 'familiar', label: 'Otro familiar' },
  { value: 'amigo', label: 'Amigo(a)' },
] as const;

type GuestType = typeof guestTypeOptions[number]['value'];

interface InvitadoData {
  id: string;
  nombre?: string;
  apellidos?: string;
  telefono?: string;
  email?: string;
  empresa?: string;
  puesto?: string;
  [key: string]: any;
}

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const invitadoId = searchParams.get('invitado');
  const empresaId = EMPRESA_ID;

  // Agregar estilos para SweetAlert2
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .swal-wide {
        width: 650px !important;
        max-width: 90vw !important;
        background: #0b0b0b !important;
      }
      .swal2-html-container {
        overflow-y: auto !important;
        max-height: 70vh !important;
      }
      .swal-no-border .swal2-icon {
        border: none !important;
        background: transparent !important;
      }
      .swal2-icon.swal2-success .swal2-success-ring,
      .swal2-icon.swal2-error .swal2-x-mark {
        display: none !important;
      }
      .swal2-popup {
        background: #0b0b0b !important;
        border: 1px solid rgba(212, 175, 55, 0.3) !important;
      }
      .swal2-title {
        color: #fff !important;
      }
      .swal2-html-container {
        color: #fff !important;
      }
      .swal2-html-container p,
      .swal2-html-container li,
      .swal2-html-container h4,
      .swal2-html-container strong {
        color: inherit !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    company: '',
    role: '',
    password: '',
    confirmPassword: '',
    guestType: 'sin invitado' as GuestType,
    guestFirstName: '',
    guestLastName: '',
    guestPhone: '',
    guestEmail: '',
    guestRole: '',
    guestRelationship: '',
    notes: '',
  });

  const DIAS_SEMANA = [
    { id: 'lunes', label: 'Lunes' },
    { id: 'martes', label: 'Martes' },
    { id: 'miercoles', label: 'Miércoles' },
    { id: 'jueves', label: 'Jueves' },
    { id: 'viernes', label: 'Viernes' },
    { id: 'sabado', label: 'Sábado' },
    { id: 'domingo', label: 'Domingo' },
  ];

  interface DaySchedule {
    enabled: boolean;
    inicio: string;
    fin: string;
  }

  type WeekSchedule = {
    [key: string]: DaySchedule;
  };

  const DEFAULT_SCHEDULE: DaySchedule = {
    enabled: false,
    inicio: '09:00',
    fin: '18:00',
  };

  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    const initialSchedule: WeekSchedule = {};
    DIAS_SEMANA.forEach(dia => {
      initialSchedule[dia.id] = { ...DEFAULT_SCHEDULE };
    });
    return initialSchedule;
  });

  const [showPassword, setShowPassword] = useState(false);

  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error' | 'loading'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [invitadoData, setInvitadoData] = useState<InvitadoData | null>(null);
  const [esAcompanante, setEsAcompanante] = useState(false);
  const [esInvitadoExpositor, setEsInvitadoExpositor] = useState(false);

  // Cargar datos del invitado al montar el componente
  useEffect(() => {
    const loadInvitadoData = async () => {
      if (!invitadoId) {
        setStatus('idle');
        return;
      }

      try {
        setStatus('loading');
        const data = await getInvitadoData(empresaId, invitadoId);
        
        if (data) {
          setInvitadoData(data);
          // Verificar si es acompañante
          setEsAcompanante(data.esAcompanante === true);
          // Verificar si es invitado de expositor
          setEsInvitadoExpositor(data.esInvitadoExpositor === true);
          
          // Prellenar el formulario con los datos existentes
          setFormData((prev) => ({
            ...prev,
            firstName: data.nombre || '',
            lastName: data.apellidos || '',
            phone: data.telefono || '',
            email: data.email || '',
            company: data.empresa || '',
            role: data.puesto || '',
          }));
        }
        setStatus('idle');
      } catch (error) {
        console.error('Error al cargar datos del invitado:', error);
        setStatus('idle');
      }
    };

    loadInvitadoData();
  }, [invitadoId, empresaId]);

  const handleChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData((prev) => {
      if (field === 'guestType') {
        return {
          ...prev,
          guestType: value as GuestType,
          guestFirstName: '',
          guestLastName: '',
          guestPhone: '',
          guestEmail: '',
          guestRole: '',
          guestRelationship: '',
        };
      }

      return { ...prev, [field]: value };
    });
  }, []);

  const needsGuestFields = useMemo(() => formData.guestType !== 'sin invitado', [formData.guestType]);

  const isFormValid = useMemo(() => {
    // Validar datos principales
    // Si es acompañante, no requerir puesto
    const camposBasicos = esAcompanante
      ? formData.firstName && formData.lastName && formData.phone && formData.email && formData.company
      : formData.firstName && formData.lastName && formData.phone && formData.email && formData.company && formData.role;
    
    if (!camposBasicos) {
      return false;
    }

    // NUEVO FLUJO: Si NO hay invitadoId (solicitud simple), solo validar campos básicos
    if (!invitadoId) {
      return true; // Solo necesita campos básicos
    }

    // FLUJO CON INVITACIÓN: Validar contraseña
    // Validar contraseña principal
    if (!formData.password || formData.password.length < 6) {
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      return false;
    }

    // Si es invitado de expositor, solo necesita contraseña y campos básicos
    if (esInvitadoExpositor) {
      return true;
    }

    // Validar datos de acompañante si existe (solo para invitados normales)
    if (formData.guestType === 'colaborador') {
      const guestValid = Boolean(
        formData.guestFirstName &&
          formData.guestLastName &&
          formData.guestPhone &&
          formData.guestEmail &&
          formData.guestRole
      );
      return guestValid;
    }

    if (formData.guestType === 'invitado personal') {
      const guestValid = Boolean(
        formData.guestFirstName &&
          formData.guestLastName &&
          formData.guestPhone &&
          formData.guestEmail &&
          formData.guestRelationship
      );
      return guestValid;
    }

    return true;
  }, [formData, esAcompanante, esInvitadoExpositor, invitadoId]);

  const handleDayToggle = (diaId: string, enabled: boolean) => {
    setSchedule(prev => ({
      ...prev,
      [diaId]: {
        ...prev[diaId],
        enabled,
      },
    }));
  };

  const handleTimeChange = (diaId: string, field: 'inicio' | 'fin', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [diaId]: {
        ...prev[diaId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!isFormValid || status === 'sending') return;

      setStatus('sending');
      setErrorMessage('');

      // Mostrar modal de carga
      Swal.fire({
        title: 'Procesando...',
        html: invitadoId 
          ? 'Creando tu cuenta y enviando confirmaciones...'
          : 'Enviando tu solicitud de registro...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        // Generar código de confirmación
        const codigoConfirmacion = generarCodigoConfirmacion();

        console.log('🔍 RegisterPage - Estado actual del schedule:', schedule);

        // Si hay invitadoId, actualizar en Firestore
        if (invitadoId) {
          // Actualizar datos del invitado (puede ser principal o acompañante)
          await updateInvitadoData(empresaId, invitadoId, {
            nombre: formData.firstName,
            apellidos: formData.lastName,
            telefono: formData.phone,
            email: formData.email,
            empresa: formData.company,
            puesto: esAcompanante ? 'Acompañante' : formData.role,
            tipoInvitado: formData.guestType,
            esInvitadoPrincipal: !esAcompanante,
            invitadoAcompanante: !esAcompanante && formData.guestType !== 'sin invitado'
              ? {
                  nombre: formData.guestFirstName,
                  apellidos: formData.guestLastName,
                  telefono: formData.guestPhone,
                  email: formData.guestEmail,
                  ...(formData.guestType === 'colaborador'
                    ? { puesto: formData.guestRole }
                    : { parentesco: formData.guestRelationship }),
                }
              : null,
            notas: formData.notes,
            status: 'Confirmado',
            codigoConfirmacion: codigoConfirmacion,
            horarioDisponibilidad: schedule,
          });

          // Crear cuenta de usuario
          try {
            await createUserAccount(formData.email, formData.password, empresaId, invitadoId);
            console.log('Cuenta de usuario creada exitosamente para:', formData.email);
          } catch (accountError: any) {
            console.error('Error al crear cuenta de usuario:', accountError);
            if (accountError.code === 'auth/email-already-in-use') {
              console.log('El email ya tiene una cuenta, continuando...');
            }
          }

          console.log('Datos actualizados en Firestore, enviando correo...');
          
          // Enviar correo de confirmación al invitado principal
          try {
            await enviarCorreoConfirmacion(
              formData.email,
              formData.firstName,
              formData.lastName,
              codigoConfirmacion,
              formData.guestType !== 'sin invitado',
              formData.guestType !== 'sin invitado' 
                ? `${formData.guestFirstName} ${formData.guestLastName}` 
                : undefined
            );
            console.log('Correo principal enviado exitosamente');
          } catch (emailError) {
            console.error('Error al enviar correo principal:', emailError);
            // No lanzar el error para que el registro se complete
          }

          // Si hay invitado acompañante Y el usuario actual NO es acompañante, crear documento y enviarle correo
          if (!esAcompanante && formData.guestType !== 'sin invitado' && formData.guestEmail) {
            try {
              // Crear documento para el acompañante (sin cuenta todavía)
              const acompananteData = {
                nombre: formData.guestFirstName,
                apellidos: formData.guestLastName,
                telefono: formData.guestPhone,
                email: formData.guestEmail,
                empresa: formData.company,
                puesto: formData.guestType === 'colaborador' ? formData.guestRole : '',
                tipoContacto: 'invitado',
                tipoInvitado: formData.guestType, // colaborador o invitado personal
                esAcompanante: true, // Marca que es un acompañante
                invitadoPrincipalId: invitadoId, // Referencia al invitado principal
                status: 'Pendiente', // Pendiente hasta que complete su registro
                fechaRegistro: new Date().toISOString(),
                relacion: `Acompañante de ${formData.firstName} ${formData.lastName}`,
                parentesco: formData.guestType === 'invitado personal' ? formData.guestRelationship : null,
                horarioDisponibilidad: {},
              };

              // Crear documento del acompañante
              const { addDoc, collection } = await import('firebase/firestore');
              const contactosRef = collection(db, `empresas/${empresaId}/contactos`);
              const acompananteDoc = await addDoc(contactosRef, acompananteData);
              
              console.log('Documento de acompañante creado, ID:', acompananteDoc.id);

              // Enviar correo de invitación para que complete su registro con contraseña
              await enviarCorreoSolicitud(
                formData.guestEmail,
                formData.guestFirstName,
                formData.guestLastName,
                acompananteDoc.id
              );
              console.log('Correo de invitación enviado al acompañante');
            } catch (emailError: any) {
              console.error('Error con acompañante:', emailError);
            }
          }
        } else {
          // NUEVO FLUJO: Registro sin invitación previa (solicitud simple)
          console.log('📝 Creando solicitud de registro...');
          
          // Solo guardar datos básicos en solicitudes
          const solicitudId = await crearSolicitudRegistro(empresaId, {
            nombre: formData.firstName,
            apellidos: formData.lastName,
            email: formData.email,
            telefono: formData.phone,
            empresa: formData.company,
            puesto: formData.role,
          });

          console.log('✅ Solicitud creada con ID:', solicitudId);

          // Enviar correo informando que la solicitud está en revisión
          try {
            await enviarCorreoSolicitudEnRevision(
              formData.email,
              formData.firstName,
              formData.lastName
            );
            console.log('📧 Correo de "solicitud en revisión" enviado');
          } catch (emailError) {
            console.error('❌ Error al enviar correo:', emailError);
          }
        }

        setStatus('idle');
        
        // Cerrar modal de loading
        Swal.close();
        
        // Mostrar modal de éxito según el tipo de registro
        if (!invitadoId) {
          // Modal para solicitud sin invitación
          await Swal.fire({
            title: '¡Solicitud Enviada!',
            html: `
              <div style="text-align: left; padding: 20px;">
                <p style="margin-bottom: 20px; color: #ffffff; font-size: 15px;">
                  Gracias por tu interés en la <strong>12ª Expo Empresarios de la Baja</strong>.
                </p>
                
                <div style="background: linear-gradient(135deg, #2a2a30 0%, #1e1e23 100%); border: 2px solid #D4AF37; padding: 15px; margin: 20px 0; border-radius: 8px; box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);">
                  <h4 style="margin: 0 0 10px 0; color: #D4AF37; font-size: 16px; font-weight: 600;">📋 Tu solicitud está en revisión</h4>
                  <p style="margin: 0; font-size: 14px; color: #ffffff; line-height: 1.6;">
                    Recibirás un correo electrónico en las próximas <strong style="color: #D4AF37;">24-48 horas</strong> con el resultado de tu solicitud.
                  </p>
                </div>

                <h4 style="margin: 20px 0 10px 0; color: #D4AF37; font-size: 16px;">📬 Próximos pasos:</h4>
                <ol style="padding-left: 20px; color: #ffffff; line-height: 1.8; font-size: 14px;">
                  <li style="margin-bottom: 6px;">Nuestro equipo revisará tu información</li>
                  <li style="margin-bottom: 6px;">Recibirás un correo con un <strong>enlace único</strong> si tu solicitud es aprobada</li>
                  <li>Con ese enlace podrás:
                    <ul style="margin-top: 8px; color: #ffffff;">
                      <li>- Crear tu contraseña de acceso</li>
                      <li>- Configurar tu disponibilidad para reuniones</li>
                      <li>- Registrar a tu invitado o colaborador</li>
                      <li>- Acceder a tu perfil</li>
                      <li>- Descargar tus pases</li>
                    </ul>
                  </li>
                </ol>

                <p style="margin-top: 20px; color: rgba(255,255,255,0.7); font-size: 13px;">
                  Revisa tu bandeja de entrada y spam para no perder nuestro correo.
                </p>
              </div>
            `,
            iconHtml: '<div style="font-size: 80px; color: #D4AF37;">✓</div>',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#D4AF37',
            customClass: {
              popup: 'swal-wide',
              icon: 'swal-no-border',
            },
          });
        } else {
          // Modal para registro con invitación
          await Swal.fire({
            title: '¡Registro Completado!',
            html: `
              <div style="text-align: left; padding: 20px;">
                <p style="margin-bottom: 20px; color: #ffffff; font-size: 15px;">
                  ¡Gracias por confirmar tu asistencia a la <strong>12ª Expo Empresarios de la Baja</strong>!
                </p>
                
                <div style="background: linear-gradient(135deg, #2a2a30 0%, #1e1e23 100%); border: 2px solid #D4AF37; padding: 15px; margin: 20px 0; border-radius: 8px; box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);">
                  <h4 style="margin: 0 0 10px 0; color: #D4AF37; font-size: 16px; font-weight: 600;">✅ Tu cuenta ha sido creada</h4>
                  <p style="margin: 0; font-size: 14px; color: #ffffff; line-height: 1.6;">
                    Hemos enviado un correo de confirmación a <strong style="color: #D4AF37;">${formData.email}</strong>
                  </p>
                </div>

                <h4 style="margin: 20px 0 10px 0; color: #D4AF37; font-size: 16px;">🚀 Ya puedes:</h4>
                <ul style="padding-left: 20px; color: #ffffff; line-height: 1.8; font-size: 14px;">
                  <li style="margin-bottom: 4px;">Iniciar sesión en tu cuenta de expositor</li>
                  <li style="margin-bottom: 4px;">Agendar reuniones con otros asistentes</li>
                  <li style="margin-bottom: 4px;">Ver tu disponibilidad configurada</li>
                  <li style="margin-bottom: 4px;">Editar tu perfil en cualquier momento</li>
                  ${formData.guestType !== 'sin invitado' 
                    ? `<li>Tu invitado <strong>${formData.guestFirstName} ${formData.guestLastName}</strong> recibirá un correo para completar su registro</li>` 
                    : ''}
                </ul>

                <div style="background: linear-gradient(135deg, #2a2a30 0%, #1e1e23 100%); border: 1px solid rgba(212, 175, 55, 0.3); padding: 15px; margin: 20px 0; border-radius: 8px;">
                  <h4 style="margin: 0 0 10px 0; color: #D4AF37; font-size: 16px;">📅 Fecha del Evento</h4>
                  <p style="margin: 0; font-size: 16px; font-weight: bold; color: #ffffff;">
                    Viernes 21 de Noviembre, 2025
                  </p>
                  <p style="margin: 5px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.85);">
                    📍 Hotel Krystal Grand Los Cabos
                  </p>
                </div>

                <p style="margin-top: 20px; color: #D4AF37; font-size: 16px; text-align: center; font-weight: 600;">
                  ¡Nos vemos en la expo! 🎉
                </p>
              </div>
            `,
            iconHtml: '<div style="font-size: 80px; color: #D4AF37;">✓</div>',
            confirmButtonText: 'Ver mis Pases',
            confirmButtonColor: '#D4AF37',
            customClass: {
              popup: 'swal-wide',
              icon: 'swal-no-border',
            },
          }).then(async (result) => {
            if (result.isConfirmed) {
              // Iniciar sesión automáticamente
              try {
                await signInWithEmailAndPassword(auth, formData.email, formData.password);
                // Redirigir al perfil con el tab de badges usando hash
                navigate('/mi-perfil#badges');
              } catch (error) {
                console.error('Error al iniciar sesión automáticamente:', error);
                // Si falla, ir al login
                navigate('/login');
              }
            }
          });
        }
        
        // Limpiar formulario
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          company: '',
          role: '',
          password: '',
          confirmPassword: '',
          guestType: 'sin invitado',
          guestFirstName: '',
          guestLastName: '',
          guestPhone: '',
          guestEmail: '',
          guestRole: '',
          guestRelationship: '',
          notes: '',
        });
      } catch (error) {
        console.error('Registration error', error);
        setStatus('idle');
        
        // Cerrar modal de loading
        Swal.close();
        
        // Modal de error
        await Swal.fire({
          title: 'Error al Enviar',
          html: `
            <div style="text-align: left; padding: 20px;">
              <p style="margin-bottom: 20px; color: #ffffff; font-size: 15px;">
                No pudimos procesar tu registro en este momento.
              </p>
              
              <div style="background: linear-gradient(135deg, #2a2a30 0%, #1e1e23 100%); border: 2px solid #D4AF37; padding: 15px; margin: 20px 0; border-radius: 8px; box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);">
                <h4 style="margin: 0 0 10px 0; color: #D4AF37; font-size: 16px; font-weight: 600;">⚠️ Detalles del error:</h4>
                <p style="margin: 0; font-size: 13px; color: #ffffff; font-family: monospace; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px;">
                  ${error instanceof Error ? error.message : 'Error desconocido'}
                </p>
              </div>

              <h4 style="margin: 20px 0 10px 0; color: #D4AF37; font-size: 16px;">💡 ¿Qué puedes hacer?</h4>
              <ul style="padding-left: 20px; color: #ffffff; line-height: 1.8; font-size: 14px;">
                <li style="margin-bottom: 4px;">Verifica tu conexión a internet</li>
                <li style="margin-bottom: 4px;">Asegúrate de que el correo electrónico no esté ya registrado</li>
                <li style="margin-bottom: 4px;">Intenta nuevamente en unos minutos</li>
                <li>Si el problema persiste, contáctanos</li>
              </ul>

              <div style="background: linear-gradient(135deg, #2a2a30 0%, #1e1e23 100%); border: 2px solid #D4AF37; padding: 12px; margin: 20px 0; border-radius: 8px; text-align: center; box-shadow: 0 0 15px rgba(212, 175, 55, 0.2);">
                <p style="margin: 0; color: #ffffff; font-size: 14px;">
                  📧 <strong style="color: #D4AF37;">Soporte:</strong> info@expo-empresarios.com
                </p>
              </div>
            </div>
          `,
          iconHtml: '<div style="font-size: 80px; color: #D4AF37;">⚠</div>',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#D4AF37',
          customClass: {
            popup: 'swal-wide',
            icon: 'swal-no-border',
          },
        });
      }
    },
    [formData, isFormValid, status, invitadoId, empresaId],
  );

  // Mostrar loading mientras se cargan los datos
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation onRegisterClick={() => navigate('/registro')} />

      <main className="pt-24 pb-16">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1549924231-f129b911e442?w=1600&fit=crop"
              alt="Registro Expo Empresarios"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/70" />
          </div>
          <div className="relative container mx-auto px-4 py-24 text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
              {invitadoId ? 'Completa tu registro' : 'Solicita tu registro para la 12ª Expo Empresarios'}
            </h1>
            <p className="max-w-2xl mx-auto text-foreground/90">
              {invitadoId
                ? 'Completa tu información para confirmar tu asistencia a la 12ª Expo Empresarios de la Baja.'
                : 'Completa tus datos para asegurar tu espacio. Te confirmaremos tu registro entre 24 y 72 horas hábiles.'}
            </p>
            
            {!invitadoId && (
              <div className="mt-8">
                <Button
                  onClick={() => navigate('/registro-expositor')}
                  className="bg-primary text-black hover:bg-primary/90 transition-colors text-lg px-8 py-6 font-semibold"
                >
                  Registrarme como Expositor
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 mt-12">
          <div className="grid lg:grid-cols-[2fr_1fr] gap-10 items-start">
            <Card className="bg-[#0b0b0b] border border-border shadow-xl">
              <form className="p-8 space-y-6" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(event) => handleChange('firstName', event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(event) => handleChange('lastName', event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Número de teléfono *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(event) => handleChange('phone', event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(event) => handleChange('email', event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa *</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(event) => handleChange('company', event.target.value)}
                      required
                    />
                  </div>
                  {/* Solo mostrar puesto si NO es acompañante */}
                  {!esAcompanante && (
                    <div className="space-y-2">
                      <Label htmlFor="role">Puesto *</Label>
                      <Input
                        id="role"
                        value={formData.role}
                        onChange={(event) => handleChange('role', event.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Campos de Contraseña - SOLO con invitación */}
                {invitadoId && (
                  <div className="border border-border/50 rounded-xl p-6 bg-blue-500/10 space-y-4">
                    <h3 className="font-serif text-xl text-primary flex items-center gap-2">
                      🔐 Crear tu cuenta
                    </h3>
                    <p className="text-sm text-foreground/70 mb-4">
                      Crea una contraseña para acceder a tu perfil, agendar reuniones y editar tu disponibilidad.
                    </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(event) => handleChange('password', event.target.value)}
                          required
                          minLength={6}
                          placeholder="Mínimo 6 caracteres"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Repetir Contraseña *</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(event) => handleChange('confirmPassword', event.target.value)}
                        required
                        minLength={6}
                        placeholder="Repite la contraseña"
                      />
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="text-sm text-red-500">Las contraseñas no coinciden</p>
                      )}
                    </div>
                  </div>
                </div>
                )}

                {/* Mensaje informativo para acompañantes */}
                {esAcompanante && (
                  <div className="border border-blue-500/50 rounded-xl p-6 bg-blue-500/10">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">👤</div>
                      <div className="flex-1">
                        <h3 className="font-serif text-lg text-primary mb-2">
                          Registro de Acompañante
                        </h3>
                        <p className="text-sm text-foreground/80 mb-2">
                          Estás completando tu registro como acompañante para la <strong>12ª Expo Empresarios de la Baja</strong>.
                        </p>
                        <p className="text-sm text-foreground/70">
                          Por favor, crea tu contraseña y configura tu disponibilidad para aprovechar todas las funcionalidades de la plataforma.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mensaje informativo para invitados de expositor */}
                {esInvitadoExpositor && (
                  <div className="border border-primary/50 rounded-xl p-6 bg-primary/10">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🏢</div>
                      <div className="flex-1">
                        <h3 className="font-serif text-lg text-primary mb-2">
                          Invitación de Expositor
                        </h3>
                        <p className="text-sm text-foreground/80 mb-2">
                          Has sido invitado por <strong>{invitadoData?.empresa || 'un expositor'}</strong> para participar en la <strong>12ª Expo Empresarios de la Baja</strong>.
                        </p>
                        <p className="text-sm text-foreground/70">
                          Completa tu registro para acceder a todas las funcionalidades de la plataforma.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Solo mostrar opción de invitar si NO es acompañante Y NO es invitado de expositor Y tiene invitación */}
                {invitadoId && !esAcompanante && !esInvitadoExpositor && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Tipo de invitado *</Label>
                      <Select
                        value={formData.guestType}
                        onValueChange={(value: GuestType) => handleChange('guestType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {guestTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {invitadoId && !esAcompanante && needsGuestFields && (
                  <div className="space-y-4 border border-border/50 rounded-xl p-6 bg-black/40">
                    <h3 className="font-serif text-xl text-primary">
                      {formData.guestType === 'colaborador' ? 'Datos del colaborador' : 'Datos del invitado'}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="guestFirstName">Nombre *</Label>
                        <Input
                          id="guestFirstName"
                          value={formData.guestFirstName}
                          onChange={(event) => handleChange('guestFirstName', event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guestLastName">Apellido *</Label>
                        <Input
                          id="guestLastName"
                          value={formData.guestLastName}
                          onChange={(event) => handleChange('guestLastName', event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="guestPhone">Teléfono *</Label>
                        <Input
                          id="guestPhone"
                          value={formData.guestPhone}
                          onChange={(event) => handleChange('guestPhone', event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guestEmail">Correo electrónico *</Label>
                        <Input
                          id="guestEmail"
                          type="email"
                          value={formData.guestEmail}
                          onChange={(event) => handleChange('guestEmail', event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {formData.guestType === 'colaborador' && (
                      <div className="space-y-2">
                        <Label htmlFor="guestRole">Puesto *</Label>
                        <Input
                          id="guestRole"
                          value={formData.guestRole}
                          onChange={(event) => handleChange('guestRole', event.target.value)}
                          required
                        />
                      </div>
                    )}

                    {formData.guestType === 'invitado personal' && (
                      <div className="space-y-2">
                        <Label htmlFor="guestRelationship">Parentesco *</Label>
                        <Select
                          value={formData.guestRelationship}
                          onValueChange={(value) => handleChange('guestRelationship', value)}
                        >
                          <SelectTrigger id="guestRelationship">
                            <SelectValue placeholder="Selecciona el parentesco" />
                          </SelectTrigger>
                          <SelectContent>
                            {guestRelationshipOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Nota sobre cuenta del acompañante */}
                    <div className="space-y-2 border-t border-border/30 pt-4">
                      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-sm text-foreground/80">
                          ℹ️ <strong>Nota:</strong> Se enviará un correo a {formData.guestFirstName || 'tu acompañante'} con un link para que cree su propia contraseña y acceda a su cuenta.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Horario de Disponibilidad - SOLO con invitación */}
                {invitadoId && (
                  <div className="border border-border/50 rounded-xl p-6 bg-green-500/10 space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h3 className="font-serif text-xl text-primary">
                        Configura tu disponibilidad para agendar reuniones después del evento
                      </h3>
                    </div>
                  <p className="text-sm text-foreground/70">
                    Indica los días y horarios en los que estarás disponible para agendar reuniones después del evento.
                  </p>
                   <p className="text-sm text-foreground/70">
                    Si no los defines, el sistema utilizara los horarios de Lunes a Viernes de 9:00 a 13:00 horas.
                  </p>
                  
                  <div className="space-y-3">
                    {DIAS_SEMANA.map((dia) => (
                      <div key={dia.id} className="flex items-center gap-4 p-3 bg-background/50 rounded-lg">
                        <div className="flex items-center gap-2 w-32">
                          <Switch
                            checked={schedule[dia.id]?.enabled || false}
                            onCheckedChange={(checked) => handleDayToggle(dia.id, checked)}
                          />
                          <span className="text-sm font-medium text-foreground">{dia.label}</span>
                        </div>
                        
                        {schedule[dia.id]?.enabled && (
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`${dia.id}-inicio`} className="text-xs text-foreground/60">
                                Inicio
                              </Label>
                              <Input
                                id={`${dia.id}-inicio`}
                                type="time"
                                value={schedule[dia.id]?.inicio || '09:00'}
                                onChange={(e) => handleTimeChange(dia.id, 'inicio', e.target.value)}
                                className="w-32"
                              />
                            </div>
                            <span className="text-foreground/60">-</span>
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`${dia.id}-fin`} className="text-xs text-foreground/60">
                                Fin
                              </Label>
                              <Input
                                id={`${dia.id}-fin`}
                                type="time"
                                value={schedule[dia.id]?.fin || '18:00'}
                                onChange={(e) => handleTimeChange(dia.id, 'fin', e.target.value)}
                                className="w-32"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {/* Mensaje informativo para registro sin invitación */}
                {!invitadoId && (
                  <div className="border border-blue-500/50 rounded-xl p-6 bg-blue-500/10">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">📋</div>
                      <div className="flex-1">
                        <h3 className="font-serif text-lg text-primary mb-2">
                          Registro de Solicitud
                        </h3>
                        <p className="text-sm text-foreground/80 mb-2">
                          Estás enviando una solicitud para participar en la <strong>12ª Expo Empresarios de la Baja</strong>.
                        </p>
                        <p className="text-sm text-foreground/70 mb-3">
                          Una vez que tu solicitud sea aprobada, recibirás un correo electrónico con un enlace para completar tu registro donde podrás:
                        </p>
                        <ul className="text-sm text-foreground/70 list-disc list-inside space-y-1">
                          <li>Crear tu contraseña de acceso</li>
                          <li>Configurar tu disponibilidad para reuniones</li>
                          <li>Registrar a tu invitado o colaborador</li>
                          <li>Acceder a tu perfil</li>
                          <li>Descargar tus pases</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Mensaje (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(event) => handleChange('notes', event.target.value)}
                    placeholder="Cuéntanos detalles adicionales o requerimientos especiales"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="submit"
                    disabled={!isFormValid || status === 'sending'}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {status === 'sending' ? 'Enviando...' : 'Enviar registro'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate('/')}
                  >
                    Volver al inicio
                  </Button>
                </div>
              </form>
            </Card>

            <aside className="space-y-6">
              <Card className="bg-black/50 border border-border p-6">
                <h3 className="font-serif text-2xl text-primary mb-3">¿Qué sigue después del registro?</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>1. Nuestro equipo revisará tu solicitud y disponibilidad de espacios.</li>
                  <li>2. Si ya está su registro completo y autorizado, solo imprima su gafete, y el de su invitado, y preséntese con una identificación el día de la Expo.</li>
                </ul>
              </Card>

              <Card className="bg-black/50 border border-border p-6">
                <h3 className="font-serif text-xl text-primary mb-3">Información de contacto</h3>
                <p className="text-sm text-muted-foreground">
                  ¿Tienes preguntas adicionales? Escríbenos a{' '}
                  <a href="mailto:registro@expoempresarioslabaja.com" className="text-primary underline">
                    registro@expoempresarioslabaja.com
                  </a>{' '}
                  o envíanos un mensaje por WhatsApp.
                </p>
              </Card>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


