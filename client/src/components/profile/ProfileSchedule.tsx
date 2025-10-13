import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateUserProfile } from '@/lib/firebase';
import { EMPRESA_ID } from '@/config/constants';
import { Loader2, Save, Clock, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileScheduleProps {
  profile: any;
  onUpdate: () => void;
}

const DIAS_SEMANA = [
  { id: 'lunes', label: 'Lunes' },
  { id: 'martes', label: 'Martes' },
  { id: 'miercoles', label: 'Miércoles' },
  { id: 'jueves', label: 'Jueves' },
  { id: 'viernes', label: 'Viernes' },
  { id: 'sabado', label: 'Sábado' },
  { id: 'domingo', label: 'Domingo' },
];

const HORAS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

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

export default function ProfileSchedule({ profile, onUpdate }: ProfileScheduleProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<WeekSchedule>({});

  useEffect(() => {
    // Cargar horario existente o usar valores por defecto
    const existingSchedule = profile.horarioDisponibilidad || {};
    console.log('🔍 ProfileSchedule - Cargando horario desde profile:', existingSchedule);
    
    const initialSchedule: WeekSchedule = {};

    DIAS_SEMANA.forEach(dia => {
      initialSchedule[dia.id] = existingSchedule[dia.id] || { ...DEFAULT_SCHEDULE };
    });

    console.log('🔍 ProfileSchedule - Schedule inicializado:', initialSchedule);
    setSchedule(initialSchedule);
  }, [profile]);

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

  const handleApplyToAll = () => {
    const firstEnabled = DIAS_SEMANA.find(dia => schedule[dia.id]?.enabled);
    if (!firstEnabled) {
      toast({
        title: 'Advertencia',
        description: 'Primero configura un día para copiar su horario',
        variant: 'destructive',
      });
      return;
    }

    const template = schedule[firstEnabled.id];
    const newSchedule: WeekSchedule = {};

    DIAS_SEMANA.forEach(dia => {
      newSchedule[dia.id] = {
        enabled: schedule[dia.id].enabled,
        inicio: template.inicio,
        fin: template.fin,
      };
    });

    setSchedule(newSchedule);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Validar horarios
      for (const dia of DIAS_SEMANA) {
        const daySchedule = schedule[dia.id];
        if (daySchedule.enabled) {
          const [inicioHour, inicioMin] = daySchedule.inicio.split(':').map(Number);
          const [finHour, finMin] = daySchedule.fin.split(':').map(Number);
          const inicioMinutes = inicioHour * 60 + inicioMin;
          const finMinutes = finHour * 60 + finMin;

          if (finMinutes <= inicioMinutes) {
            toast({
              title: 'Error',
              description: `El horario de ${dia.label} no es válido. La hora de fin debe ser posterior a la de inicio.`,
              variant: 'destructive',
            });
            setLoading(false);
            return;
          }
        }
      }

      await updateUserProfile(EMPRESA_ID, profile.id, profile.tipo, {
        horarioDisponibilidad: schedule,
      });

      toast({
        title: '¡Horario actualizado!',
        description: 'Tu disponibilidad ha sido guardada exitosamente.',
      });

      onUpdate();
    } catch (error: any) {
      console.error('Error al actualizar horario:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el horario',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Horario de Disponibilidad
        </h2>
        <p className="text-foreground/60">
          Define cuándo estás disponible para reuniones durante el evento
        </p>
      </div>

      {/* Información */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-3">
        <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-foreground/80">
            <strong>Fecha del evento:</strong> Viernes 21 de Noviembre, 2025
          </p>
          <p className="text-sm text-foreground/60 mt-1">
            Configura tus horarios disponibles para que otros usuarios puedan agendar citas contigo
          </p>
        </div>
      </div>

      {/* Botón aplicar a todos */}
      <div className="mb-6 flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleApplyToAll}
          size="sm"
        >
          Aplicar primer horario a todos
        </Button>
      </div>

      {/* Lista de días */}
      <div className="space-y-4 mb-6">
        {DIAS_SEMANA.map(dia => (
          <div
            key={dia.id}
            className={`p-4 rounded-lg border-2 transition-all ${
              schedule[dia.id]?.enabled
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Día y Switch */}
              <div className="flex items-center justify-between sm:w-48">
                <Label htmlFor={`switch-${dia.id}`} className="text-base font-semibold">
                  {dia.label}
                </Label>
                <Switch
                  id={`switch-${dia.id}`}
                  checked={schedule[dia.id]?.enabled || false}
                  onCheckedChange={(checked) => handleDayToggle(dia.id, checked)}
                />
              </div>

              {/* Selectores de hora */}
              {schedule[dia.id]?.enabled && (
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1">
                    <Label htmlFor={`inicio-${dia.id}`} className="text-sm text-foreground/60">
                      Desde
                    </Label>
                    <Select
                      value={schedule[dia.id]?.inicio || '09:00'}
                      onValueChange={(value) => handleTimeChange(dia.id, 'inicio', value)}
                    >
                      <SelectTrigger id={`inicio-${dia.id}`} className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HORAS.map(hora => (
                          <SelectItem key={hora.value} value={hora.value}>
                            {hora.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <span className="text-foreground/60 mt-6">—</span>

                  <div className="flex-1">
                    <Label htmlFor={`fin-${dia.id}`} className="text-sm text-foreground/60">
                      Hasta
                    </Label>
                    <Select
                      value={schedule[dia.id]?.fin || '18:00'}
                      onValueChange={(value) => handleTimeChange(dia.id, 'fin', value)}
                    >
                      <SelectTrigger id={`fin-${dia.id}`} className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HORAS.map(hora => (
                          <SelectItem key={hora.value} value={hora.value}>
                            {hora.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {!schedule[dia.id]?.enabled && (
                <p className="text-sm text-foreground/40 flex-1">
                  No disponible
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Resumen */}
      <div className="mb-6 p-4 bg-muted/30 rounded-lg">
        <h3 className="text-sm font-semibold text-foreground mb-2">Resumen</h3>
        <p className="text-sm text-foreground/70">
          Días disponibles:{' '}
          {DIAS_SEMANA.filter(dia => schedule[dia.id]?.enabled).length} de 7
        </p>
      </div>

      {/* Botón guardar */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar Disponibilidad
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
