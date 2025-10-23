import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { crearInvitacionExpositor, obtenerInvitadosExpositor } from '@/lib/firebase';
import { EMPRESA_ID } from '@/config/constants';
import { 
  Loader2, 
  UserPlus, 
  Mail, 
  Phone, 
  Briefcase,
  Trash2,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import Swal from 'sweetalert2';

export default function MisInvitadosPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { loading: authLoading, userProfile } = useAuthCheck();
  
  const [invitados, setInvitados] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    puesto: '',
  });

  useEffect(() => {
    if (userProfile) {
      // Verificar que sea expositor
      if (userProfile.tipo !== 'expositor') {
        toast({
          title: 'Acceso denegado',
          description: 'Esta función solo está disponible para expositores.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }
      loadInvitados();
    }
  }, [userProfile]);

  const loadInvitados = async () => {
    if (!userProfile) return;
    
    try {
      const invitadosData = await obtenerInvitadosExpositor(EMPRESA_ID, userProfile.id);
      setInvitados(invitadosData);
    } catch (error) {
      console.error('Error al cargar invitados:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los invitados',
        variant: 'destructive',
      });
    }
  };

  const loadData = loadInvitados;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellidos: '',
      email: '',
      telefono: '',
      puesto: '',
    });
  };

  const handleEnviarInvitacion = async () => {
    // Validaciones
    if (!formData.nombre || !formData.email || !formData.telefono || !formData.puesto) {
      toast({
        title: 'Campos incompletos',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive',
      });
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Email inválido',
        description: 'Por favor ingresa un email válido',
        variant: 'destructive',
      });
      return;
    }

    try {
      setEnviando(true);

      await crearInvitacionExpositor(
        EMPRESA_ID,
        userProfile.id,
        {
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          email: formData.email,
          telefono: formData.telefono,
          puesto: formData.puesto,
          empresa: userProfile.empresa,
          nombreExpositor: `${userProfile.nombre} ${userProfile.apellidos}`,
        }
      );

      await Swal.fire({
        icon: 'success',
        title: '¡Invitación enviada!',
        html: `<p>Se ha enviado la invitación a <strong>${formData.email}</strong></p>`,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#D4AF37',
        background: '#0b0b0b',
        color: '#fff',
        customClass: {
          popup: 'swal-wide',
        }
      });

      resetForm();
      setIsDialogOpen(false);
      loadData(); // Recargar lista de invitados
    } catch (error: any) {
      console.error('Error al enviar invitación:', error);
      toast({
        title: 'Error al enviar invitación',
        description: error.message || 'No se pudo enviar la invitación',
        variant: 'destructive',
      });
    } finally {
      setEnviando(false);
    }
  };

  const handleReenviarInvitacion = async (invitado: any) => {
    const result = await Swal.fire({
      title: 'Reenviar invitación',
      html: `<p>¿Deseas reenviar la invitación a <strong>${invitado.email}</strong>?</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, reenviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#D4AF37',
      cancelButtonColor: '#6b7280',
      background: '#0b0b0b',
      color: '#fff',
    });

    if (!result.isConfirmed) return;

    try {
      await crearInvitacionExpositor(
        EMPRESA_ID,
        userProfile.id,
        {
          nombre: invitado.nombre,
          apellidos: invitado.apellidos,
          email: invitado.email,
          telefono: invitado.telefono,
          puesto: invitado.puesto,
          empresa: userProfile.empresa,
          nombreExpositor: `${userProfile.nombre} ${userProfile.apellidos}`,
        },
        invitado.id // Pasar el ID para actualizar el existente
      );

      toast({
        title: '¡Invitación reenviada!',
        description: `Se reenvió la invitación a ${invitado.email}`,
      });
    } catch (error) {
      console.error('Error al reenviar invitación:', error);
      toast({
        title: 'Error',
        description: 'No se pudo reenviar la invitación',
        variant: 'destructive',
      });
    }
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
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
                Mis Invitados
              </h1>
              <p className="text-foreground/60">
                Invita a colaboradores de tu empresa a participar en la expo
              </p>
            </div>

            {/* Botón Invitar */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invitar Persona
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Invitar Colaborador</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => handleInputChange('nombre', e.target.value)}
                        placeholder="Nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellidos">Apellidos</Label>
                      <Input
                        id="apellidos"
                        value={formData.apellidos}
                        onChange={(e) => handleInputChange('apellidos', e.target.value)}
                        placeholder="Apellidos"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="email@ejemplo.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      placeholder="5551234567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="puesto">Puesto en la empresa *</Label>
                    <Input
                      id="puesto"
                      value={formData.puesto}
                      onChange={(e) => handleInputChange('puesto', e.target.value)}
                      placeholder="Ej: Gerente de Ventas"
                    />
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-foreground/70">
                      <strong>Empresa:</strong> {userProfile?.empresa}
                    </p>
                    <p className="text-xs text-foreground/50 mt-1">
                      Los datos de la empresa se llenarán automáticamente
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1"
                      disabled={enviando}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleEnviarInvitacion}
                      className="flex-1 bg-primary hover:bg-primary/90"
                      disabled={enviando}
                    >
                      {enviando ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Invitación
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Lista de Invitados */}
          {invitados.length === 0 ? (
            <Card className="bg-card border border-border p-12 text-center">
              <UserPlus className="w-16 h-16 text-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No hay invitados
              </h3>
              <p className="text-foreground/60 mb-6">
                Invita a colaboradores de tu empresa para que participen en la expo
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Enviar Primera Invitación
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {invitados.map((invitado) => (
                <Card
                  key={invitado.id}
                  className="bg-card border border-border p-6 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Información del Invitado */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          {invitado.nombre} {invitado.apellidos}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          invitado.registroCompleto
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-yellow-500/10 text-yellow-600'
                        }`}>
                          {invitado.registroCompleto ? 'Registrado' : 'Pendiente'}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-2">
                        {invitado.email && (
                          <div className="flex items-center gap-2 text-sm text-foreground/70">
                            <Mail className="w-4 h-4" />
                            <span>{invitado.email}</span>
                          </div>
                        )}
                        
                        {invitado.telefono && (
                          <div className="flex items-center gap-2 text-sm text-foreground/70">
                            <Phone className="w-4 h-4" />
                            <span>{invitado.telefono}</span>
                          </div>
                        )}
                        
                        {invitado.puesto && (
                          <div className="flex items-center gap-2 text-sm text-foreground/70">
                            <Briefcase className="w-4 h-4" />
                            <span>{invitado.puesto}</span>
                          </div>
                        )}

                        {invitado.fechaInvitacion && (
                          <div className="text-xs text-foreground/40">
                            Invitado: {new Date(invitado.fechaInvitacion).toLocaleDateString('es-ES')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      {!invitado.registroCompleto && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReenviarInvitacion(invitado)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Reenviar
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
