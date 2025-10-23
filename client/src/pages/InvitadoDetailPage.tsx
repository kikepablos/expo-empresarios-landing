import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getInvitadoData, getCurrentUser, verificarContactoExistente, onAuthChange } from '@/lib/firebase';
import { EMPRESA_ID } from '@/config/constants';
import { Loader2, Mail, Phone, Building2, Briefcase, UserPlus, Calendar, MapPin, Clock, LogIn } from 'lucide-react';
import RegistrarContactoModal from '@/components/invitado/RegistrarContactoModal';
import AgendarReunionModal from '@/components/invitado/AgendarReunionModal';
import LoginModal from '@/components/auth/LoginModal';

export default function InvitadoDetailPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/invitado/:id');
  const invitadoId = params?.id;

  const [invitado, setInvitado] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
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

  // Horario por defecto: Lunes a Viernes de 9 AM a 1 PM
  const horarioPorDefecto = {
    lunes: { enabled: true, inicio: "09:00", fin: "13:00" },
    martes: { enabled: true, inicio: "09:00", fin: "13:00" },
    miercoles: { enabled: true, inicio: "09:00", fin: "13:00" },
    jueves: { enabled: true, inicio: "09:00", fin: "13:00" },
    viernes: { enabled: true, inicio: "09:00", fin: "13:00" },
    sabado: { enabled: false, inicio: "09:00", fin: "18:00" },
    domingo: { enabled: false, inicio: "09:00", fin: "18:00" },
  };

  // Usar horario del invitado o el por defecto
  const horarioDisponibilidad = invitado.horarioDisponibilidad && 
    Object.values(invitado.horarioDisponibilidad).some((day: any) => day.enabled)
    ? invitado.horarioDisponibilidad
    : horarioPorDefecto;

  // Siempre hay disponibilidad (real o por defecto)
  const hasSchedule = true;

  // Validar si los botones deben estar habilitados
  const canInteract = currentUser && !isOwnProfile;
  const canRegisterContact = canInteract && !esContactoExistente;

  // Crear versión del invitado con horario de disponibilidad garantizado
  const invitadoConHorario = {
    ...invitado,
    horarioDisponibilidad: horarioDisponibilidad
  };

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
            <div className="flex items-center gap-2 text-foreground/70 text-sm">
              <Building2 className="w-4 h-4" />
              <span>{invitado.empresa || 'Empresa no especificada'}</span>
            </div>
          </div>

          {/* Widget de Acciones para Móvil - Solo visible en pantallas pequeñas */}
          <div className="lg:hidden mb-6">
            <Card className="bg-card border border-border p-6">
              <h3 className="text-xl font-bold text-foreground mb-4">
                Acciones
              </h3>

              {/* Botones en fila horizontal en móvil */}
              <div className="flex flex-row gap-3">
                {/* Botón Registrar Contacto */}
                {esContactoExistente ? (
                  <div className="flex-1 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-green-600">
                      <UserPlus className="w-5 h-5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">Ya es tu contacto</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowContactModal(true)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                    disabled={!canRegisterContact || verificandoContacto}
                  >
                    {verificandoContacto ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        <span>Verificar</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 mr-2" />
                        <span>Contacto</span>
                      </>
                    )}
                  </Button>
                )}

                {/* Botón Agendar Reunión */}
                {hasSchedule && (
                  <Button
                    onClick={() => setShowMeetingModal(true)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                    disabled={!canInteract}
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    <span>Agendar</span>
                  </Button>
                )}
              </div>
              
              {/* Botón de Iniciar Sesión */}
              {!currentUser && !isOwnProfile && (
                <div className="mt-4">
                  <Button
                    onClick={() => setShowLoginModal(true)}
                    className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-black font-semibold"
                    size="lg"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Iniciar Sesión
                  </Button>
                  <p className="text-sm text-foreground/60 mt-2 text-center">
                    Inicia sesión para registrar contactos y agendar reuniones.
                  </p>
                </div>
              )}

              {/* Mensaje si es perfil propio */}
              {isOwnProfile && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-foreground/70 mb-3">
                    ℹ️ Este es tu perfil.
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
            </Card>
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
                    {Object.entries(horarioDisponibilidad).map(([dia, horario]: [string, any]) => {
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

            {/* Sidebar de Acciones - Solo visible en desktop */}
            <aside className="hidden lg:block space-y-6">
              <Card className="bg-card border border-border p-6 sticky top-24">
                <h3 className="text-xl font-bold text-foreground mb-6">
                  Acciones
                </h3>

                {/* Botones en columna en desktop */}
                <div className="flex flex-col gap-3">
                  {/* Botón Registrar Contacto */}
                  {esContactoExistente ? (
                    <div className="flex-1 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-green-600">
                        <UserPlus className="w-5 h-5 flex-shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">Ya es tu contacto</span>
                          <span className="text-xs text-foreground/70">
                            Este usuario ya está en tu lista de contactos
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowContactModal(true)}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                      disabled={!canRegisterContact || verificandoContacto}
                    >
                      {verificandoContacto ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          <span>Verificando...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5 mr-2" />
                          <span>Registrar Contacto</span>
                        </>
                      )}
                    </Button>
                  )}

                  {/* Botón Agendar Reunión */}
                  {hasSchedule && (
                    <Button
                      onClick={() => setShowMeetingModal(true)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                      disabled={!canInteract}
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      <span>Agendar Reunión</span>
                    </Button>
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

                {/* Botón de Iniciar Sesión */}
                {!currentUser && !isOwnProfile && (
                  <div className="mt-6">
                    <Button
                      onClick={() => setShowLoginModal(true)}
                      className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-black font-semibold"
                      size="lg"
                    >
                      <LogIn className="w-5 h-5 mr-2" />
                      Iniciar Sesión
                    </Button>
                    <p className="text-sm text-foreground/60 mt-3 text-center">
                      Inicia sesión para registrar contactos y agendar reuniones.
                    </p>
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
        invitado={invitadoConHorario}
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
        invitado={invitadoConHorario}
        currentUser={currentUser}
        currentUserProfile={currentUserProfile}
      />

      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onLoginSuccess={() => {
          // El usuario ya está autenticado, la página se actualizará automáticamente
          // gracias al onAuthChange en el useEffect
        }}
      />
    </div>
  );
}
