import { useState, FormEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { registrarContactoInvitado } from '@/lib/firebase';
import { EMPRESA_ID } from '@/config/constants';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RegistrarContactoModalProps {
  open: boolean;
  onClose: () => void;
  invitado: any;
  currentUser: any;
  currentUserProfile?: any;
  onSuccess?: () => void;
}

export default function RegistrarContactoModal({
  open,
  onClose,
  invitado,
  currentUser,
  currentUserProfile,
  onSuccess,
}: RegistrarContactoModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    notas: '',
    interes: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para registrar contactos',
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

    setLoading(true);

    try {
      await registrarContactoInvitado(
        EMPRESA_ID,
        invitado.id,
        currentUser.uid,
        currentUserProfile,
        invitado,
        {
          notas: formData.notas,
          interes: formData.interes,
        }
      );

      setSuccess(true);
      toast({
        title: '¡Contacto registrado!',
        description: 'El contacto ha sido registrado exitosamente.',
      });

      // Llamar callback de éxito si existe
      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setSuccess(false);
        setFormData({ notas: '', interes: '' });
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Error al registrar contacto:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar el contacto',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSuccess(false);
      setFormData({ notas: '', interes: '' });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Contacto</DialogTitle>
          <DialogDescription>
            Registra tu interacción con {invitado?.nombre} {invitado?.apellidos}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              ¡Contacto Registrado!
            </h3>
            <p className="text-foreground/60">
              El contacto ha sido guardado exitosamente
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="interes">Nivel de Interés</Label>
              <Input
                id="interes"
                value={formData.interes}
                onChange={(e) => setFormData(prev => ({ ...prev, interes: e.target.value }))}
                placeholder="Ej: Alto, Medio, Bajo"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas de la Conversación</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                placeholder="Escribe detalles sobre la conversación, temas de interés, seguimiento necesario, etc."
                rows={5}
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
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Registrar Contacto'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
