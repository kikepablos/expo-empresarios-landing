import { useState, FormEvent, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { loginExpositor } from '@/lib/firebase';
import { LogIn, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { EMPRESA_ID } from '@/config/constants';

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Scroll al inicio cuando se carga la página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validaciones básicas antes de enviar
    if (!email.trim()) {
      setError('Por favor, ingresa tu correo electrónico');
      toast({
        title: 'Campo requerido',
        description: 'Por favor, ingresa tu correo electrónico',
        variant: 'destructive',
      });
      return;
    }
    
    if (!password) {
      setError('Por favor, ingresa tu contraseña');
      toast({
        title: 'Campo requerido',
        description: 'Por favor, ingresa tu contraseña',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    // Safety timeout: Si después de 15 segundos no hay respuesta, forzar el fin del loading
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('⚠️ Timeout de login alcanzado');
      setLoading(false);
      setError('La petición tardó demasiado. Por favor, verifica tu conexión e intenta nuevamente.');
      toast({
        title: 'Tiempo de espera agotado',
        description: 'La petición tardó demasiado. Intenta nuevamente.',
        variant: 'destructive',
      });
    }, 15000);

    try {
      console.log('Intentando iniciar sesión...');
      const result = await loginExpositor(email, password, EMPRESA_ID);
      console.log('Login exitoso:', result);
      
      // Limpiar timeout si el login fue exitoso
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      // Mostrar mensaje de éxito
      toast({
        title: '¡Bienvenido!',
        description: 'Has iniciado sesión correctamente',
      });
      
      // Redirigir después de un breve delay
      setTimeout(() => {
        navigate('/');
      }, 500);
      
    } catch (err: any) {
      console.error('Error en handleSubmit:', err);
      
      // Limpiar timeout si hubo error
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      // Asegurarse de que siempre se muestre un mensaje de error
      const errorMessage = err?.message || 'Error desconocido al iniciar sesión. Por favor, intenta nuevamente.';
      setError(errorMessage);
      
      // También mostrar toast con el error
      toast({
        title: 'Error al iniciar sesión',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      // Asegurarse de que siempre se deshabilite el loading
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation onRegisterClick={() => navigate('/registro')} />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8 space-y-6 bg-card border-border shadow-2xl">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Portal de Invitados / Expositores
            </h1>
            <p className="text-foreground/60">
              Inicia sesión para acceder a tu cuenta
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
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
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
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

            {/* Olvidaste tu contraseña */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate('/recuperar-contrasena')}
                className="text-sm text-primary hover:underline"
                disabled={loading}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-950/50 border border-red-500 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-400 text-sm font-medium">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botón de envío */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-6 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-foreground/60">
                ¿No tienes cuenta?
              </span>
            </div>
          </div>

          {/* Link a registro */}
          <div className="text-center">
            <p className="text-sm text-foreground/60">
              Si aún no has completado tu registro,{' '}
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-primary hover:underline font-semibold"
              >
                revisa tu correo
              </button>
              {' '}para obtener el enlace de registro.
            </p>
          </div>

          {/* Info adicional */}
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-foreground/70 text-center">
              🔒 Tus datos están protegidos con encriptación de nivel empresarial
            </p>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
