import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getInvitadoData, getCurrentUser, verificarContactoExistente, onAuthChange } from '@/lib/firebase';
import { EMPRESA_ID } from '@/config/constants';
import { Loader2, Mail, Phone, Building2, Briefcase, UserPlus, Calendar, MapPin, Clock } from 'lucide-react';
import RegistrarContactoModal from '@/components/invitado/RegistrarContactoModal';
import AgendarReunionModal from '@/components/invitado/AgendarReunionModal';

export default function InvitadoDetailPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/invitado/:id');
  const invitadoId = params?.id;

  const [invitado, setInvitado] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [esContactoExistente, setEsContactoExistente] = useState(false);
  const [verificandoContacto, setVerificandoContacto] = useState(false);

  useEffect(() => {
    // Usar onAuthChange en lugar de getCurrentUser para evitar timing issues
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Intentar obtener el perfil del usuario
        try {
          const { getUserProfile } = await import('@/lib/firebase');
          const profile = await getUserProfile(EMPRESA_ID);
          setCurrentUserProfile(profile);
        } catch (error) {
          console.error('Error al cargar perfil del usuario:', error);
        }
      } else {
        setCurrentUser(null);
        setCurrentUserProfile(null);
      }
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  // Verificar si el usuario está viendo su propio perfil
  useEffect(() => {
    if (currentUser && invitado && invitadoId) {
      // Comparar usando el ID del documento (más confiable)
      if (currentUserProfile) {
        const isSameUser = currentUserProfile.id === invitadoId;
        setIsOwnProfile(isSameUser);
      } else {
        // Fallback: comparar por email si no hay perfil cargado
        const isSameUser = currentUser.email === invitado.email;
        setIsOwnProfile(isSameUser);
      }
    }
  }, [currentUser, currentUserProfile, invitado, invitadoId]);

  // Verificar si ya es contacto
  useEffect(() => {
    const verificarContacto = async () => {
      if (currentUserProfile && invitadoId && !isOwnProfile) {
        setVerificandoContacto(true);
        try {
          const yaEsContacto = await verificarContactoExistente(
            EMPRESA_ID,
            currentUserProfile.id,
            currentUserProfile.tipo,
            invitadoId
          );
          setEsContactoExistente(yaEsContacto);
        } catch (error) {
          console.error('Error al verificar contacto:', error);
        } finally {
          setVerificandoContacto(false);
        }
      }
    };

    verificarContacto();
  }, [currentUserProfile, invitadoId, isOwnProfile]);

  useEffect(() => {
    const loadInvitado = async () => {
      if (!invitadoId) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        const data = await getInvitadoData(EMPRESA_ID, invitadoId);
        
        if (!data) {
          console.error('No se encontró el invitado');
          navigate('/');
          return;
        }

        setInvitado(data);
      } catch (error) {
        console.error('Error al cargar invitado:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadInvitado();
  }, [invitadoId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation onRegisterClick={() => navigate('/registro')} />
        <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-foreground/60">Cargando información...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!invitado) {
    return null;
  }

  const hasSchedule = invitado.horarioDisponibilidad && 
    Object.values(invitado.horarioDisponibilidad).some((day: any) => day.enabled);

  // Validar si los botones deben estar habilitados
  const canInteract = currentUser && !isOwnProfile;
  const canRegisterContact = canInteract && !esContactoExistente;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation onRegisterClick={() => navigate('/registro')} />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
              {invitado.nombre} {invitado.apellidos}
            </h1>
            <div className="flex items-center gap-2 text-foreground/60">
              <Building2 className="w-4 h-4" />
              <span>{invitado.empresa || 'Empresa no especificada'}</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
            {/* Información del Invitado */}
            <div className="space-y-6">
              <Card className="bg-card border border-border p-6">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Información de Contacto
                </h2>

                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-foreground/60">Correo Electrónico</p>
                      <a 
                        href={`mailto:${invitado.email}`}
                        className="text-foreground font-medium hover:text-primary break-all"
                      >
                        {invitado.email}
                      </a>
                    </div>
                  </div>

                  {/* Teléfono */}
                  {invitado.telefono && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="text-sm text-foreground/60">Teléfono</p>
                        <a 
                          href={`tel:${invitado.telefono}`}
                          className="text-foreground font-medium hover:text-primary"
                        >
                          {invitado.lada || '+52'} {invitado.telefono}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Empresa */}
                  {invitado.empresa && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="text-sm text-foreground/60">Empresa</p>
                        <p className="text-foreground font-medium">{invitado.empresa}</p>
                      </div>
                    </div>
                  )}

                  {/* Puesto */}
                  {invitado.puesto && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="text-sm text-foreground/60">Puesto</p>
                        <p className="text-foreground font-medium">{invitado.puesto}</p>
                      </div>
                    </div>
                  )}

                  {/* Dirección */}
                  {invitado.direccion && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="text-sm text-foreground/60">Dirección</p>
                        <p className="text-foreground font-medium">{invitado.direccion}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Horario de Disponibilidad */}
              {hasSchedule && (
                <Card className="bg-card border border-border p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-primary" />
                    Disponibilidad para Reuniones
                  </h2>

                  <div className="space-y-3">
                    {Object.entries(invitado.horarioDisponibilidad || {}).map(([dia, horario]: [string, any]) => {
                      if (!horario.enabled) return null;

                      const diasMap: Record<string, string> = {
                        lunes: 'Lunes',
                        martes: 'Martes',
                        miercoles: 'Miércoles',
                        jueves: 'Jueves',
                        viernes: 'Viernes',
                        sabado: 'Sábado',
                        domingo: 'Domingo',
                      };

                      return (
                        <div 
                          key={dia}
                          className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg"
                        >
                          <span className="font-semibold text-foreground">
                            {diasMap[dia]}
                          </span>
                          <span className="text-foreground/80">
                            {horario.inicio} - {horario.fin}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Información del Acompañante */}
              {invitado.invitadoAcompanante && (
                <Card className="bg-card border border-border p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Información del Acompañante
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-foreground/60">Nombre</p>
                      <p className="text-foreground font-medium">
                        {invitado.invitadoAcompanante.nombre} {invitado.invitadoAcompanante.apellidos}
                      </p>
                    </div>
                    {invitado.invitadoAcompanante.email && (
                      <div>
                        <p className="text-sm text-foreground/60">Email</p>
                        <p className="text-foreground font-medium">
                          {invitado.invitadoAcompanante.email}
                        </p>
                      </div>
                    )}
                    {invitado.invitadoAcompanante.telefono && (
                      <div>
                        <p className="text-sm text-foreground/60">Teléfono</p>
                        <p className="text-foreground font-medium">
                          {invitado.invitadoAcompanante.telefono}
                        </p>
                      </div>
                    )}
                    {invitado.invitadoAcompanante.puesto && (
                      <div>
                        <p className="text-sm text-foreground/60">Puesto</p>
                        <p className="text-foreground font-medium">
                          {invitado.invitadoAcompanante.puesto}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar de Acciones */}
            <aside className="space-y-6">
              <Card className="bg-card border border-border p-6 sticky top-24">
                <h3 className="text-xl font-bold text-foreground mb-6">
                  Acciones
                </h3>

                <div className="space-y-4">
                  {/* Botón Registrar Contacto */}
                  {esContactoExistente ? (
                    <div className="w-full p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-green-600">
                        <UserPlus className="w-5 h-5" />
                        <span className="font-semibold">Ya es tu contacto</span>
                      </div>
                      <p className="text-sm text-foreground/70 mt-1">
                        Este usuario ya está en tu lista de contactos
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowContactModal(true)}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                      disabled={!canRegisterContact || verificandoContacto}
                    >
                      {verificandoContacto ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5 mr-2" />
                          Registrar Contacto
                        </>
                      )}
                    </Button>
                  )}

                  {/* Botón Agendar Reunión */}
                  {hasSchedule ? (
                    <Button
                      onClick={() => setShowMeetingModal(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                      disabled={!canInteract}
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      Agendar Reunión
                    </Button>
                  ) : (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-sm text-foreground/70">
                        {isOwnProfile 
                          ? 'Configura tu disponibilidad desde tu perfil para que otros puedan agendar reuniones contigo.'
                          : 'Este invitado aún no ha configurado su disponibilidad para reuniones.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Mensajes informativos */}
                {isOwnProfile && (
                  <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-foreground/70 mb-3">
                      ℹ️ Este es tu perfil. No puedes registrar contactos ni agendar reuniones contigo mismo.
                    </p>
                    <Button
                      onClick={() => navigate('/mi-perfil')}
                      variant="outline"
                      className="w-full"
                    >
                      Ir a Mi Perfil
                    </Button>
                  </div>
                )}

                {!currentUser && !isOwnProfile && (
                  <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-foreground/70 mb-3">
                      Inicia sesión para registrar contactos y agendar reuniones.
                    </p>
                    <Button
                      onClick={() => navigate('/login')}
                      variant="outline"
                      className="w-full"
                    >
                      Iniciar Sesión
                    </Button>
                  </div>
                )}
              </Card>
            </aside>
          </div>
        </div>
      </main>

      <Footer />

      {/* Modales */}
      <RegistrarContactoModal
        open={showContactModal}
        onClose={() => setShowContactModal(false)}
        invitado={invitado}
        currentUser={currentUser}
        currentUserProfile={currentUserProfile}
        onSuccess={() => {
          // Actualizar estado para mostrar que ya es contacto
          setEsContactoExistente(true);
        }}
      />

      <AgendarReunionModal
        open={showMeetingModal}
        onClose={() => setShowMeetingModal(false)}
        invitado={invitado}
        currentUser={currentUser}
        currentUserProfile={currentUserProfile}
      />
    </div>
  );
}
