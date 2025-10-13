import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changePassword } from '@/lib/firebase';
import { Loader2, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePassword() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (formData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await changePassword(formData.newPassword);
      
      setSuccess(true);
      setFormData({
        newPassword: '',
        confirmPassword: '',
      });

      toast({
        title: '¡Contraseña actualizada!',
        description: 'Tu contraseña ha sido cambiada exitosamente.',
      });
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      
      let errorMessage = 'No se pudo cambiar la contraseña';
      if (error.message.includes('recent-login')) {
        errorMessage = 'Por seguridad, debes volver a iniciar sesión para cambiar tu contraseña';
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Cambiar Contraseña
      </h2>
      <p className="text-foreground/60 mb-6">
        Actualiza tu contraseña para mantener tu cuenta segura
      </p>

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <p className="text-green-500">
            Tu contraseña ha sido actualizada exitosamente
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nueva Contraseña */}
        <div>
          <Label htmlFor="newPassword">Nueva Contraseña *</Label>
          <div className="relative mt-1">
            <Input
              id="newPassword"
              type={showPasswords ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              disabled={loading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPasswords ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-sm text-foreground/60 mt-1">
            Debe tener al menos 6 caracteres
          </p>
        </div>

        {/* Confirmar Contraseña */}
        <div>
          <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</Label>
          <Input
            id="confirmPassword"
            type={showPasswords ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            placeholder="Repite la nueva contraseña"
            required
            minLength={6}
            disabled={loading}
            className="mt-1"
          />
          {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
            <p className="text-sm text-red-500 mt-1">
              Las contraseñas no coinciden
            </p>
          )}
        </div>

        {/* Advertencia */}
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-foreground/70">
            <strong>Importante:</strong> Si acabas de iniciar sesión y no puedes cambiar tu contraseña, 
            cierra sesión y vuelve a ingresar. Esto es una medida de seguridad.
          </p>
        </div>

        {/* Botón */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cambiando contraseña...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Cambiar Contraseña
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
