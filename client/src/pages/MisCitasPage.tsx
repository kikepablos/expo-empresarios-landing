import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EMPRESA_ID } from '@/config/constants';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { 
  Loader2, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
  Mail,
  Phone,
  Building2,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
// @ts-ignore - Modal components
import RechazarCitaModal from '@/components/citas/RechazarCitaModal';
// @ts-ignore - Modal components
import ReagendarCitaModal from '@/components/citas/ReagendarCitaModal';

interface Cita {
  id: string;
  citaId: string;
  fecha: string;
  hora: string;
  tema: string;
  notas?: string;
  status: string;
  confirmada: boolean;
  rol: string;
  conQuien: {
    id: string;
    nombre: string;
    apellidos: string;
    email: string;
    telefono?: string;
    empresa?: string;
    puesto?: string;
    tipo: string;
  };
  razonRechazo?: string;
  fechaCreacion: string;
  reagendadaPor?: string; // ID del usuario que reagendó la cita
  razonReagendamiento?: string;
  fechaReagendamiento?: string;
  [key: string]: any;
}

export default function MisCitasPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { loading: authLoading, userProfile } = useAuthCheck();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  const [showRechazarModal, setShowRechazarModal] = useState(false);
  const [showReagendarModal, setShowReagendarModal] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (userProfile) {
      loadCitas();
    }
  }, [userProfile]);

  const loadCitas = async () => {
    if (!userProfile) return;
    
    try {
      // Cargar citas del usuario
      const userCollection = userProfile.tipo === 'expositor' ? 'expositores' : 'contactos';
      const citasRef = collection(
        db,
        `empresas/${EMPRESA_ID}/${userCollection}/${userProfile.id}/citas`
      );
      
      const snapshot = await getDocs(citasRef);
      const citasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Cita[];

      // Ordenar por fecha y hora
      citasData.sort((a, b) => {
        const fechaA = new Date(a.fecha + 'T' + a.hora);
        const fechaB = new Date(b.fecha + 'T' + b.hora);
        return fechaA.getTime() - fechaB.getTime();
      });

      setCitas(citasData);
    } catch (error) {
      console.error('Error al cargar citas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las citas',
        variant: 'destructive',
      });
    }
  };

  const loadData = loadCitas;

  const handleAceptarCita = async (cita: any) => {
    setProcesando(true);
    try {
      const { aceptarCita } = await import('@/lib/firebase');
      await aceptarCita(
        EMPRESA_ID,
        cita.id,
        userProfile,
        cita
      );

      toast({
        title: '¡Cita aceptada!',
        description: 'La cita ha sido confirmada exitosamente',
      });

      await loadData();
    } catch (error: any) {
      console.error('Error al aceptar cita:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo aceptar la cita',
        variant: 'destructive',
      });
    } finally {
      setProcesando(false);
    }
  };

  const handleRechazarClick = (cita: any) => {
    setCitaSeleccionada(cita);
    setShowRechazarModal(true);
  };

  const handleReagendarClick = (cita: any) => {
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

    // Verificar si conQuien tiene horario configurado
    const horarioDisponibilidad = cita.conQuien?.horarioDisponibilidad && 
      Object.values(cita.conQuien.horarioDisponibilidad).some((day: any) => day.enabled)
      ? cita.conQuien.horarioDisponibilidad
      : horarioPorDefecto;

    // Crear cita con horario garantizado
    const citaConHorario = {
      ...cita,
      conQuien: {
        ...cita.conQuien,
        horarioDisponibilidad: horarioDisponibilidad
      }
    };

    setCitaSeleccionada(citaConHorario);
    setShowReagendarModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendiente':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">⏳ Pendiente</Badge>;
      case 'confirmada':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">✓ Confirmada</Badge>;
      case 'rechazada':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">✗ Rechazada</Badge>;
      case 'reagendada':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">↻ Reagendada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation onRegisterClick={() => navigate('/registro')} />
        <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-foreground/60">Verificando autenticación...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation onRegisterClick={() => navigate('/registro')} />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
              Mis Citas
            </h1>
            <p className="text-foreground/60">
              Gestiona tus reuniones agendadas para el evento
            </p>
          </div>

          {/* Lista de Citas */}
          {citas.length === 0 ? (
            <Card className="bg-card border border-border p-12 text-center">
              <CalendarIcon className="w-16 h-16 text-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No hay citas agendadas
              </h3>
              <p className="text-foreground/60 mb-6">
                Aún no tienes reuniones programadas para el evento
              </p>
            </Card>
          ) : (
            <div className="grid gap-6">
              {citas.map((cita) => (
                <Card
                  key={cita.id}
                  className="bg-card border border-border p-6 hover:border-primary/50 transition-all"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Información de la Cita */}
                    <div className="flex-1 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">
                            {cita.tema}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            {getStatusBadge(cita.status)}
                            <Badge variant="outline" className="bg-primary/10">
                              {cita.rol === 'organizador' ? '📤 Enviada' : '📥 Recibida'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Fecha y Hora */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-foreground/70">
                          <CalendarIcon className="w-4 h-4" />
                          <span className="text-sm">{formatFecha(cita.fecha)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-foreground/70">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{cita.hora}</span>
                        </div>
                      </div>

                      {/* Notas */}
                      {cita.notas && (
                        <div className="p-3 bg-foreground/5 rounded-lg">
                          <p className="text-sm text-foreground/70">
                            <strong>Notas:</strong> {cita.notas}
                          </p>
                        </div>
                      )}

                      {/* Razón de Rechazo */}
                      {cita.status === 'rechazada' && cita.razonRechazo && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <p className="text-sm text-red-600">
                            <strong>Razón de rechazo:</strong> {cita.razonRechazo}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Información de la Persona */}
                    <div className="lg:w-1/3 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6">
                      <h4 className="text-sm font-semibold text-foreground/60 mb-3">
                        {cita.rol === 'organizador' ? 'Reunión con:' : 'Organizada por:'}
                      </h4>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {cita.conQuien.nombre} {cita.conQuien.apellidos}
                          </p>
                          <p className="text-sm text-foreground/60">
                            {cita.conQuien.tipo === 'expositor' ? 'Expositor' : 'Asistente'}
                          </p>
                        </div>

                        {cita.conQuien.email && (
                          <div className="flex items-center gap-2 text-sm text-foreground/70">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{cita.conQuien.email}</span>
                          </div>
                        )}

                        {cita.conQuien.telefono && (
                          <div className="flex items-center gap-2 text-sm text-foreground/70">
                            <Phone className="w-4 h-4" />
                            <span>{cita.conQuien.telefono}</span>
                          </div>
                        )}

                        {cita.conQuien.empresa && (
                          <div className="flex items-center gap-2 text-sm text-foreground/70">
                            <Building2 className="w-4 h-4" />
                            <span>{cita.conQuien.empresa}</span>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const tipoRuta = cita.conQuien.tipo === 'expositor' ? 'expositor' : 'invitado';
                            navigate(`/${tipoRuta}/${cita.conQuien.id}`);
                          }}
                          className="w-full mt-2"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Ver Perfil
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  {cita.status === 'pendiente' && (
                    <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-3">
                      {/* Verificar si el usuario actual es quien reagendó la cita */}
                      {cita.reagendadaPor && cita.reagendadaPor === userProfile?.id ? (
                        <>
                          {/* Usuario que reagendó NO puede aceptar/rechazar, solo esperar */}
                          <div className="flex-1 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                            <p className="text-sm text-foreground/80">
                              <span className="font-semibold">⏳ Esperando confirmación</span>
                              <br />
                              Has propuesto un cambio de horario. {cita.conQuien.nombre} debe aceptar o proponer una nueva fecha.
                            </p>
                          </div>
                        </>
                      ) : cita.reagendadaPor ? (
                        <>
                          {/* La cita fue reagendada por el OTRO usuario → Este usuario puede aceptar/rechazar/reagendar */}
                          <Button
                            onClick={() => handleAceptarCita(cita)}
                            disabled={procesando}
                            className="flex-1 min-w-[150px] bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Aceptar Reagendado
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleRechazarClick(cita)}
                            disabled={procesando}
                            className="flex-1 min-w-[150px] border-red-500/30 text-red-600 hover:bg-red-500/10"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rechazar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleReagendarClick(cita)}
                            disabled={procesando}
                            className="flex-1 min-w-[150px]"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Proponer Otro Horario
                          </Button>
                        </>
                      ) : cita.rol === 'invitado' ? (
                        <>
                          {/* Cita original sin reagendar - Botones para quien RECIBIÓ la cita */}
                          <Button
                            onClick={() => handleAceptarCita(cita)}
                            disabled={procesando}
                            className="flex-1 min-w-[150px] bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Aceptar Cita
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleRechazarClick(cita)}
                            disabled={procesando}
                            className="flex-1 min-w-[150px] border-red-500/30 text-red-600 hover:bg-red-500/10"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rechazar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleReagendarClick(cita)}
                            disabled={procesando}
                            className="flex-1 min-w-[150px]"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reagendar
                          </Button>
                        </>
                      ) : (
                        <>
                          {/* Cita original sin reagendar - Botón SOLO para quien ENVIÓ la cita */}
                          <Button
                            variant="outline"
                            onClick={() => handleReagendarClick(cita)}
                            disabled={procesando}
                            className="flex-1 min-w-[200px]"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reagendar Cita
                          </Button>
                          <div className="flex-1 min-w-[300px] p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-sm text-foreground/70">
                              ℹ️ Esperando confirmación de {cita.conQuien.nombre}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {cita.status === 'confirmada' && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <Button
                        variant="outline"
                        onClick={() => handleReagendarClick(cita)}
                        disabled={procesando}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reagendar Cita
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modales */}
      {citaSeleccionada && (
        <>
          <RechazarCitaModal
            open={showRechazarModal}
            onClose={() => {
              setShowRechazarModal(false);
              setCitaSeleccionada(null);
            }}
            cita={citaSeleccionada}
            userProfile={userProfile}
            onSuccess={() => loadData()}
          />

          <ReagendarCitaModal
            open={showReagendarModal}
            onClose={() => {
              setShowReagendarModal(false);
              setCitaSeleccionada(null);
            }}
            cita={citaSeleccionada}
            userProfile={userProfile}
            onSuccess={() => loadData()}
          />
        </>
      )}
    </div>
  );
}
