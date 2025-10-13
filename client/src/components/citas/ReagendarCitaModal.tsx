import { useState, FormEvent, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, RefreshCw, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EMPRESA_ID } from '@/config/constants';
import { getCitasDelInvitado } from '@/lib/firebase';

interface ReagendarCitaModalProps {
  open: boolean;
  onClose: () => void;
  cita: any;
  userProfile: any;
  onSuccess: () => void;
}

const EVENT_DATE = '2025-11-21';

const DIAS_SEMANA_MAP: Record<number, string> = {
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
  0: 'domingo',
};

const DIAS_SEMANA_NOMBRES: Record<string, string> = {
  'lunes': 'Lunes',
  'martes': 'Martes',
  'miercoles': 'Miércoles',
  'jueves': 'Jueves',
  'viernes': 'Viernes',
  'sabado': 'Sábado',
  'domingo': 'Domingo',
};

export default function ReagendarCitaModal({
  open,
  onClose,
  cita,
  userProfile,
  onSuccess,
}: ReagendarCitaModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [citasExistentes, setCitasExistentes] = useState<any[]>([]);
  const [availableDates, setAvailableDates] = useState<{value: string, label: string}[]>([]);
  const [formData, setFormData] = useState({
    hora: '',
    razon: '',
  });

  useEffect(() => {
    if (open && cita && userProfile) {
      loadCitasExistentes();
      generateAvailableDates();
    } else if (!open) {
      // Limpiar estado cuando se cierra el modal
      setSelectedDate('');
      setAvailableHours([]);
      setAvailableDates([]);
      setFormData({ hora: '', razon: '' });
    }
  }, [open, cita, userProfile]);

  useEffect(() => {
    if (selectedDate) {
      // Limpiar la hora seleccionada cuando cambia la fecha
      setFormData(prev => ({ ...prev, hora: '' }));
      generateAvailableHours();
    } else {
      setAvailableHours([]);
    }
  }, [selectedDate, citasExistentes, userProfile]);

  const loadCitasExistentes = async () => {
    try {
      // IMPORTANTE: Cargar las citas del INVITADO (quien recibió la solicitud original)
      // Si el usuario actual es 'invitado', cargar sus propias citas
      // Si el usuario actual es 'organizador', cargar las citas de conQuien (el invitado)
      const invitadoId = cita.rol === 'invitado' ? userProfile.id : cita.conQuien.id;
      const citas = await getCitasDelInvitado(EMPRESA_ID, invitadoId);
      setCitasExistentes(citas);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    }
  };

  const generateAvailableDates = () => {
    // Obtener la disponibilidad del invitado
    let horarioDisponibilidad;
    
    if (cita.rol === 'invitado') {
      horarioDisponibilidad = userProfile.horarioDisponibilidad || {};
    } else {
      horarioDisponibilidad = cita.conQuien?.horarioDisponibilidad || {};
    }

    const dates: {value: string, label: string}[] = [];
    const today = new Date();
    const eventDate = new Date(EVENT_DATE + 'T00:00:00');
    
    // Generar fechas desde hoy hasta 30 días después del evento
    // o hasta 60 días en el futuro, lo que sea mayor
    const maxDate = new Date(Math.max(eventDate.getTime() + (30 * 24 * 60 * 60 * 1000), today.getTime() + (60 * 24 * 60 * 60 * 1000)));
    
    for (let d = new Date(today); d <= maxDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      const diaKey = DIAS_SEMANA_MAP[dayOfWeek];
      const horario = horarioDisponibilidad[diaKey];
      
      // Solo agregar fechas donde el invitado tenga disponibilidad habilitada
      if (horario && horario.enabled) {
        const dateStr = d.toISOString().split('T')[0];
        const dateLabel = d.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        dates.push({
          value: dateStr,
          label: `${dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}`
        });
      }
    }
    
    setAvailableDates(dates);
  };

  const generateAvailableHours = () => {
    if (!selectedDate) {
      setAvailableHours([]);
      return;
    }

    // IMPORTANTE: Siempre usar la disponibilidad del INVITADO (quien recibió la solicitud original)
    // Si el usuario actual es 'invitado' (rol: 'invitado'), usar su propia disponibilidad
    // Si el usuario actual es 'organizador' (rol: 'organizador'), usar la disponibilidad de conQuien
    let horarioDisponibilidad;
    
    if (cita.rol === 'invitado') {
      // El usuario actual es el invitado, usar su propia disponibilidad
      horarioDisponibilidad = userProfile.horarioDisponibilidad || {};
    } else {
      // El usuario actual es el organizador, usar la disponibilidad del invitado (conQuien)
      horarioDisponibilidad = cita.conQuien?.horarioDisponibilidad || {};
    }
    
    const date = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const diaKey = DIAS_SEMANA_MAP[dayOfWeek];
    
    const horario = horarioDisponibilidad[diaKey];
    
    if (!horario || !horario.enabled) {
      setAvailableHours([]);
      return;
    }

    const [startHour, startMin] = horario.inicio.split(':').map(Number);
    const [endHour, endMin] = horario.fin.split(':').map(Number);
    
    const hours: string[] = [];
    
    // Generar slots de 30 minutos
    for (let h = startHour; h <= endHour; h++) {
      for (let m = 0; m < 60; m += 30) {
        const currentMinutes = h * 60 + m;
        const endMinutes = endHour * 60 + endMin;
        const startMinutes = startHour * 60 + startMin;
        
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
          const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          
          // Verificar si ya hay una cita en ese horario (excepto la cita actual)
          const citaExistente = citasExistentes.find(
            c => c.fecha === selectedDate && c.hora === timeStr && c.citaId !== cita.citaId
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

    if (!selectedDate || !formData.hora) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona una nueva fecha y hora',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { reagendarCita } = await import('@/lib/firebase');
      await reagendarCita(
        EMPRESA_ID,
        cita.id,
        cita.citaId,
        userProfile,
        cita,
        selectedDate,
        formData.hora,
        formData.razon
      );

      toast({
        title: 'Cita reagendada',
        description: 'Se ha notificado al otro usuario sobre el cambio',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al reagendar cita:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo reagendar la cita',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDayOfWeekName = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dayNames[date.getDay()];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Reagendar Cita
          </DialogTitle>
          <DialogDescription>
            Propón una nueva fecha y hora para la reunión
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Cita Actual */}
          <div className="p-4 bg-foreground/5 rounded-lg space-y-2">
            <p className="text-sm font-semibold">Cita Actual:</p>
            <p className="text-sm">
              <strong>Tema:</strong> {cita.tema}
            </p>
            <p className="text-sm">
              <strong>Fecha:</strong> {new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-ES')} - {cita.hora}
            </p>
          </div>

          {/* Nueva Fecha */}
          <div className="space-y-2">
            <Label htmlFor="fecha" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Nueva Fecha
            </Label>
            {availableDates.length > 0 ? (
              <Select
                value={selectedDate}
                onValueChange={setSelectedDate}
                disabled={loading}
              >
                <SelectTrigger id="fecha">
                  <SelectValue placeholder="Selecciona una fecha disponible" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {availableDates.map((date) => (
                    <SelectItem key={date.value} value={date.value}>
                      {date.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-foreground/70">
                  No hay fechas disponibles según la configuración de disponibilidad.
                </p>
              </div>
            )}
          </div>

          {/* Nueva Hora */}
          {selectedDate && (
            <div className="space-y-2">
              <Label htmlFor="hora" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Nueva Hora
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

          {/* Razón (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="razon">Razón del Cambio (opcional)</Label>
            <Textarea
              id="razon"
              value={formData.razon}
              onChange={(e) => setFormData(prev => ({ ...prev, razon: e.target.value }))}
              placeholder="Ej: Surgió un imprevisto, Prefiero en la mañana..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
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
                  Reagendando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reagendar Cita
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
