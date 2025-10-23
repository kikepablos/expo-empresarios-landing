import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { getUserProfile, logoutExpositor } from '@/lib/firebase';
import { EMPRESA_ID } from '@/config/constants';
import Swal from 'sweetalert2';

/**
 * Hook para verificar autenticación y existencia del perfil
 * Redirige al login si no hay sesión o si el perfil no existe
 */
export function useAuthCheck() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Intentar obtener el perfil del usuario
        const profile = await getUserProfile(EMPRESA_ID);
        
        // Si no hay perfil, significa que no hay sesión o el usuario no existe
        if (!profile) {
          console.error('❌ No se encontró perfil de usuario');
          
          // Cerrar cualquier sesión existente
          try {
            await logoutExpositor();
          } catch (error) {
            console.error('Error al cerrar sesión:', error);
          }
          
          // Mostrar alerta
          await Swal.fire({
            icon: 'warning',
            title: 'Sesión no válida',
            html: '<p>Tu sesión no es válida o tu cuenta no está registrada.</p><p>Por favor, inicia sesión nuevamente.</p>',
            confirmButtonText: 'Ir al Login',
            confirmButtonColor: '#D4AF37',
            background: '#0b0b0b',
            color: '#fff',
            allowOutsideClick: false,
            allowEscapeKey: false,
          });
          
          navigate('/login');
          return;
        }
        
        // Si el perfil existe, guardarlo
        setUserProfile(profile);
        
      } catch (error: any) {
        console.error('❌ Error al verificar autenticación:', error);
        
        // Cerrar sesión por seguridad
        try {
          await logoutExpositor();
        } catch (logoutError) {
          console.error('Error al cerrar sesión:', logoutError);
        }
        
        // Mostrar alerta de error
        await Swal.fire({
          icon: 'error',
          title: 'Error de autenticación',
          text: error.message || 'No se pudo verificar tu sesión. Por favor, inicia sesión nuevamente.',
          confirmButtonText: 'Ir al Login',
          confirmButtonColor: '#ef4444',
          background: '#0b0b0b',
          color: '#fff',
          allowOutsideClick: false,
          allowEscapeKey: false,
        });
        
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  return { loading, userProfile };
}
