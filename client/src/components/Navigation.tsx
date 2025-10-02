import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import logoImage from '@assets/logo.png';
import { useLocation } from 'wouter';

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
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

