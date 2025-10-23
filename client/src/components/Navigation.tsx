import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, User, Calendar, Contact, UserCircle, LogOut, Users } from 'lucide-react';
import logoImage from '@assets/logo.png';
import { useLocation } from 'wouter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { onAuthChange, logoutExpositor, getCurrentUser, getUserProfile } from '@/lib/firebase';
import { EMPRESA_ID } from '@/config/constants';
import type { User as FirebaseUser } from 'firebase/auth';

interface NavigationProps {
  onRegisterClick: () => void;
}

type NavItem = {
  id: string;
  label: string;
  href: string;
  type: 'anchor' | 'route';
};

const navItems: NavItem[] = [
  { id: 'inicio', label: 'Inicio', href: '#hero', type: 'anchor' },
  { id: 'rifa', label: 'Rifa', href: '#rifa', type: 'anchor' },
  { id: 'galeria', label: 'Galería', href: '/galeria', type: 'route' },
  { id: 'contacto', label: 'Contacto', href: '#contacto', type: 'anchor' }
];

export default function Navigation({ onRegisterClick }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location, navigate] = useLocation();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpositor, setIsExpositor] = useState(false);

  // Escuchar cambios en autenticación y cargar perfil
  useEffect(() => {
    const loadUserData = async (currentUser: FirebaseUser | null) => {
      if (currentUser) {
        try {
          const profile = await getUserProfile(EMPRESA_ID);
          
          // Si no se encuentra el perfil, cerrar sesión
          if (!profile) {
            console.error('❌ Usuario autenticado pero sin perfil en Firestore');
            await handleLogout();
            
            // Mostrar alerta
            const Swal = (await import('sweetalert2')).default;
            await Swal.fire({
              icon: 'error',
              title: 'Cuenta no encontrada',
              html: '<p>Tu cuenta no está registrada en el sistema.</p><p>Por favor, completa tu registro o contacta al administrador.</p>',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#ef4444',
              background: '#0b0b0b',
              color: '#fff',
            });
            
            navigate('/login');
            setLoading(false);
            return;
          }
          
          setIsExpositor(profile?.tipo === 'expositor');
        } catch (error) {
          console.error('Error al cargar perfil:', error);
          
          // En caso de error, cerrar sesión por seguridad
          await handleLogout();
          
          const Swal = (await import('sweetalert2')).default;
          await Swal.fire({
            icon: 'error',
            title: 'Error al cargar perfil',
            text: 'No se pudo cargar tu información. Por favor, inicia sesión nuevamente.',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#ef4444',
            background: '#0b0b0b',
            color: '#fff',
          });
          
          navigate('/login');
          setIsExpositor(false);
        }
      } else {
        setIsExpositor(false);
      }
      setLoading(false);
    };

    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      loadUserData(currentUser);
    });

    // Verificar si ya hay un usuario al cargar
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      loadUserData(currentUser);
    } else {
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutExpositor();
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleNavClick = (item: NavItem) => {
    if (item.type === 'anchor') {
      // Si estamos en home, hacer scroll directo
      if (location === '/') {
        const element = document.querySelector(item.href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // Si estamos en otra página, navegar a home y luego hacer scroll
        navigate('/');
        setTimeout(() => {
          const element = document.querySelector(item.href);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } else {
      // Para rutas, navegar y hacer scroll al top
      navigate(item.href);
      window.scrollTo(0, 0);
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    navigate('/');
    window.scrollTo(0, 0);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border" data-testid="navigation">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button 
            onClick={handleLogoClick}
            className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img
              src={logoImage}
              alt="Logo Expo Empresarios de la Baja"
              className="w-14 h-14 object-contain" data-testid="logo"
            />
            <div className="ml-3 text-left">
              <span className="font-serif text-xl font-bold text-foreground block">
                Expo Empresarios de la Baja
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                21 nov 2025 · Hotel Krystal Grand Los Cabos
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className="text-foreground hover:text-primary transition-colors"
                data-testid={`nav-link-${item.id}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              onClick={onRegisterClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
              data-testid="button-register-nav"
            >
              Registrarme
            </Button>

            {/* User Menu */}
            {!loading && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full w-10 h-10 bg-primary/10 hover:bg-primary/20"
                    >
                      <User className="w-5 h-5 text-primary" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Mi Cuenta</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/mis-contactos')}>
                      <Contact className="mr-2 h-4 w-4" />
                      <span>Mis Contactos</span>
                    </DropdownMenuItem>
                    {isExpositor && (
                      <DropdownMenuItem onClick={() => navigate('/mis-invitados')}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Mis Invitados</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate('/mis-citas')}>
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Mis Citas</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/mi-perfil')}>
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Mi Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="rounded-full"
                >
                  <User className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </Button>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
            data-testid="button-mobile-menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-border" data-testid="mobile-menu">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className="text-left text-foreground hover:text-primary transition-colors py-2"
                  data-testid={`mobile-nav-link-${item.id}`}
                >
                  {item.label}
                </button>
              ))}
              <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                <Button
                  onClick={onRegisterClick}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                  data-testid="button-register-mobile"
                >
                  Registrarme
                </Button>
                
                {/* Mobile User Menu */}
                {!loading && (
                  user ? (
                    <>
                      <div className="pt-2 pb-1">
                        <p className="text-xs text-muted-foreground px-2">Mi Cuenta</p>
                        <p className="text-sm font-medium px-2 truncate">{user.email}</p>
                      </div>
                      <Button
                        onClick={() => {
                          navigate('/mis-contactos');
                          setIsMobileMenuOpen(false);
                        }}
                        variant="ghost"
                        className="w-full justify-start"
                      >
                        <Contact className="mr-2 h-4 w-4" />
                        Mis Contactos
                      </Button>
                      {isExpositor && (
                        <Button
                          onClick={() => {
                            navigate('/mis-invitados');
                            setIsMobileMenuOpen(false);
                          }}
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Mis Invitados
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          navigate('/mis-citas');
                          setIsMobileMenuOpen(false);
                        }}
                        variant="ghost"
                        className="w-full justify-start"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Mis Citas
                      </Button>
                      <Button
                        onClick={() => {
                          navigate('/mi-perfil');
                          setIsMobileMenuOpen(false);
                        }}
                        variant="ghost"
                        className="w-full justify-start"
                      >
                        <UserCircle className="mr-2 h-4 w-4" />
                        Mi Perfil
                      </Button>
                      <Button
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        variant="ghost"
                        className="w-full justify-start text-red-600"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar Sesión
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => {
                        navigate('/login');
                        setIsMobileMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Iniciar Sesión
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}


