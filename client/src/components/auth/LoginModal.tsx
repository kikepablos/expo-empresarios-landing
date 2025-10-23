import { useState, FormEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { loginExpositor } from '@/lib/firebase';
import { EMPRESA_ID } from '@/config/constants';
import { LogIn, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess?: () => void;
}

export default function LoginModal({ open, onOpenChange, onLoginSuccess }: LoginModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validaciones básicas
    if (!email.trim()) {
      setError('Por favor, ingresa tu correo electrónico');
      return;
    }
    
    if (!password) {
      setError('Por favor, ingresa tu contraseña');
      return;
    }

    setLoading(true);

    try {
      const result = await loginExpositor(email, password, EMPRESA_ID);
      console.log('Login exitoso:', result);
      
      // Mostrar mensaje de éxito
      toast({
        title: '¡Bienvenido!',
        description: 'Has iniciado sesión correctamente',
      });
      
      // Cerrar modal
      onOpenChange(false);
      
      // Callback de éxito
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      
      // Limpiar formulario
      setEmail('');
      setPassword('');
      
    } catch (err: any) {
      console.error('Error en login:', err);
      const errorMessage = err?.message || 'Error al iniciar sesión. Por favor, intenta nuevamente.';
      setError(errorMessage);
      
      toast({
        title: 'Error al iniciar sesión',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setPassword('');
      setError('');
      setShowPassword(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <LogIn className="w-5 h-5 text-primary" />
            </div>
            Iniciar Sesión
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="modal-email">Correo Electrónico</Label>
            <Input
              id="modal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              disabled={loading}
              className="bg-background"
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="modal-password">Contraseña</Label>
            <div className="relative">
              <Input
                id="modal-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="bg-background pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-950/50 border border-red-500 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>

          {/* Enlace a recuperar contraseña */}
          <div className="text-center pt-2">
            <a
              href="/recuperar-contrasena"
              className="text-sm text-primary hover:underline"
              onClick={() => handleClose()}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
