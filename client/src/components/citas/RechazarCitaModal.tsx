import { useState, FormEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EMPRESA_ID } from '@/config/constants';

interface RechazarCitaModalProps {
  open: boolean;
  onClose: () => void;
  cita: any;
  userProfile: any;
  onSuccess: () => void;
}

export default function RechazarCitaModal({
  open,
  onClose,
  cita,
  userProfile,
  onSuccess,
}: RechazarCitaModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [razon, setRazon] = useState('');
  const [quiereReagendar, setQuiereReagendar] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!razon.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor indica la razón del rechazo',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { rechazarCita } = await import('@/lib/firebase');
      await rechazarCita(
        EMPRESA_ID,
        cita.id,
        userProfile,
        cita,
        razon,
        quiereReagendar
      );

      toast({
        title: 'Cita rechazada',
        description: quiereReagendar 
          ? 'Se ha notificado al organizador sobre tu propuesta de reagendar'
          : 'Se ha notificado al organizador sobre el rechazo',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al rechazar cita:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo rechazar la cita',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            Rechazar Cita
          </DialogTitle>
          <DialogDescription>
            Indica la razón por la cual no puedes asistir a esta reunión
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Información de la Cita */}
          <div className="p-4 bg-foreground/5 rounded-lg space-y-2">
            <p className="text-sm">
              <strong>Tema:</strong> {cita.tema}
            </p>
            <p className="text-sm">
              <strong>Fecha:</strong> {new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-ES')}
            </p>
            <p className="text-sm">
              <strong>Hora:</strong> {cita.hora}
            </p>
          </div>

          {/* Razón del Rechazo */}
          <div className="space-y-2">
            <Label htmlFor="razon">Razón del Rechazo *</Label>
            <Textarea
              id="razon"
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
              placeholder="Ej: Tengo otro compromiso a esa hora, No puedo asistir ese día..."
              rows={4}
              disabled={loading}
              required
            />
          </div>

          {/* ¿Quiere Reagendar? */}
          <div className="flex items-start space-x-2 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <Checkbox
              id="reagendar"
              checked={quiereReagendar}
              onCheckedChange={(checked) => setQuiereReagendar(checked as boolean)}
              disabled={loading}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="reagendar"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                ¿Deseas proponer otra fecha?
              </label>
              <p className="text-sm text-foreground/60">
                Si marcas esta opción, se le notificará al organizador que estás interesado en reagendar
              </p>
            </div>
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
              disabled={loading || !razon.trim()}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rechazando...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar Cita
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
