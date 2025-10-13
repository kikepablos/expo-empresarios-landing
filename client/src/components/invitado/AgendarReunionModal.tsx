import { useState, FormEvent, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { agendarReunionConInvitado, getCitasDelInvitado } from '@/lib/firebase';
import { EMPRESA_ID } from '@/config/constants';
import { Loader2, CheckCircle2, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AgendarReunionModalProps {
  open: boolean;
  onClose: () => void;
  invitado: any;
  currentUser: any;
  currentUserProfile?: any;
}

const DIAS_SEMANA_MAP: Record<number, string> = {
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
  0: 'domingo',
};

export default function AgendarReunionModal({
  open,
  onClose,
  invitado,
  currentUser,
  currentUserProfile,
}: AgendarReunionModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [citasExistentes, setCitasExistentes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    hora: '',
    tema: '',
    notas: '',
  });

  // Fecha del evento: 21 de noviembre de 2025
  const EVENT_DATE = '2025-11-21';

  useEffect(() => {
    if (open && invitado) {
      loadCitasExistentes();
    }
  }, [open, invitado]);

  useEffect(() => {
    if (selectedDate) {
      generateAvailableHours();
    }
  }, [selectedDate, citasExistentes]);

  const loadCitasExistentes = async () => {
    try {
      const citas = await getCitasDelInvitado(EMPRESA_ID, invitado.id);
      setCitasExistentes(citas);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    }
  };

  const generateAvailableHours = () => {
    if (!selectedDate) {
      setAvailableHours([]);
      return;
    }

    const date = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const diaKey = DIAS_SEMANA_MAP[dayOfWeek];
    
    let startHour = 9;  // Horario por defecto 9:00
    let startMin = 0;
    let endHour = 18;   // Horario por defecto 18:00
    let endMin = 0;
    
    // Si tiene disponibilidad configurada, usarla
    if (invitado.horarioDisponibilidad) {
      const horario = invitado.horarioDisponibilidad[diaKey];
      
      if (horario && horario.enabled) {
        [startHour, startMin] = horario.inicio.split(':').map(Number);
        [endHour, endMin] = horario.fin.split(':').map(Number);
      }
    }
    
    const hours: string[] = [];
    
    // Generar slots de 30 minutos
    for (let h = startHour; h <= endHour; h++) {
      for (let m = 0; m < 60; m += 30) {
        const currentMinutes = h * 60 + m;
        const endMinutes = endHour * 60 + endMin;
        const startMinutes = startHour * 60 + startMin;
        
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
          const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          
          // Verificar si ya hay una cita en ese horario
          const citaExistente = citasExistentes.find(
            cita => cita.fecha === selectedDate && cita.hora === timeStr
          );
          
          if (!citaExistente) {
            hours.push(timeStr);
          }
        }
      }
    }
    
    setAvailableHours(hours);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para agendar reuniones',
        variant: 'destructive',
      });
      return;
    }

    if (!currentUserProfile) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar tu perfil. Intenta recargar la página.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedDate || !formData.hora) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar una fecha y hora',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await agendarReunionConInvitado(
        EMPRESA_ID,
        invitado.id,
        currentUser.uid,
        currentUserProfile,
        invitado,
        {
          fecha: selectedDate,
          hora: formData.hora,
          tema: formData.tema,
          notas: formData.notas,
        }
      );

      setSuccess(true);
      toast({
        title: '¡Reunión agendada!',
        description: 'La reunión ha sido agendada exitosamente.',
      });

      setTimeout(() => {
        setSuccess(false);
        setFormData({ hora: '', tema: '', notas: '' });
        setSelectedDate('');
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Error al agendar reunión:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo agendar la reunión',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSuccess(false);
      setFormData({ hora: '', tema: '', notas: '' });
      setSelectedDate('');
      onClose();
    }
  };

  const getDayOfWeekName = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dayNames[date.getDay()];
  };

  const getAvailableDates = () => {
    const dates: { value: string; label: string; available: boolean }[] = [];
    
    // Si no hay disponibilidad, mostrar solo fecha del evento con horario por defecto
    if (!invitado.horarioDisponibilidad) {
      dates.push({
        value: EVENT_DATE,
        label: `21 de Noviembre, 2025 (${getDayOfWeekName(EVENT_DATE)})`,
        available: true,
      });
      return dates;
    }

    // Generar fechas para los próximos 60 días basadas en disponibilidad del invitado
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 60); // Próximos 2 meses
    
    const currentDate = new Date(today);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const diaKey = DIAS_SEMANA_MAP[dayOfWeek];
      const horario = invitado.horarioDisponibilidad[diaKey];
      
      // Solo agregar si el día está habilitado en la disponibilidad
      if (horario?.enabled) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const formattedDate = currentDate.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        dates.push({
          value: dateStr,
          label: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1),
          available: true,
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Si no hay fechas disponibles, mostrar mensaje
    if (dates.length === 0) {
      dates.push({
        value: EVENT_DATE,
        label: `Sin disponibilidad configurada`,
        available: false,
      });
    }
    
    return dates;
  };

  const availableDates = getAvailableDates();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Agendar Reunión</DialogTitle>
          <DialogDescription>
            Agenda una reunión con {invitado?.nombre} {invitado?.apellidos} durante el evento
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              ¡Reunión Agendada!
            </h3>
            <p className="text-foreground/60">
              Te esperamos el {selectedDate} a las {formData.hora}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Seleccionar Fecha */}
            <div className="space-y-2">
              <Label htmlFor="fecha" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fecha del Evento
              </Label>
              <Select
                value={selectedDate}
                onValueChange={setSelectedDate}
                disabled={loading}
              >
                <SelectTrigger id="fecha">
                  <SelectValue placeholder="Selecciona una fecha" />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map((date) => (
                    <SelectItem 
                      key={date.value} 
                      value={date.value}
                      disabled={!date.available}
                    >
                      {date.label} {!date.available && '(No disponible)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedDate && (() => {
                const date = new Date(selectedDate + 'T00:00:00');
                const dayOfWeek = date.getDay();
                const diaKey = DIAS_SEMANA_MAP[dayOfWeek];
                const horario = invitado.horarioDisponibilidad?.[diaKey];
                
                if (!invitado.horarioDisponibilidad || !horario?.enabled) {
                  return (
                    <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-sm text-foreground/70">
                        ℹ️ Este usuario no tiene disponibilidad configurada para {getDayOfWeekName(selectedDate)}. Mostrando horario por defecto (9:00 - 18:00).
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Seleccionar Hora */}
            {selectedDate && (
              <div className="space-y-2">
                <Label htmlFor="hora" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Hora de la Reunión
                </Label>
                {availableHours.length > 0 ? (
                  <Select
                    value={formData.hora}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, hora: value }))}
                    disabled={loading}
                  >
                    <SelectTrigger id="hora">
                      <SelectValue placeholder="Selecciona una hora" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {availableHours.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-foreground/70">
                      No hay horarios disponibles para esta fecha.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tema de la Reunión */}
            <div className="space-y-2">
              <Label htmlFor="tema">Tema de la Reunión *</Label>
              <Input
                id="tema"
                value={formData.tema}
                onChange={(e) => setFormData(prev => ({ ...prev, tema: e.target.value }))}
                placeholder="Ej: Presentación de productos, Alianza estratégica..."
                disabled={loading}
                required
              />
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notas">Notas Adicionales</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                placeholder="Objetivos de la reunión, temas a tratar, documentos necesarios..."
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !selectedDate || !formData.hora || availableHours.length === 0}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  'Agendar Reunión'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
