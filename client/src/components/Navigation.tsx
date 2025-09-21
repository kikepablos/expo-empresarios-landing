import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface NavigationProps {
  onRegisterClick: () => void;
  onExhibitorClick: () => void;
}

const navItems = [
  { id: 'inicio', label: 'Inicio', href: '#hero' },
  { id: 'evento', label: 'El Evento', href: '#evento' },
  { id: 'incluye', label: 'Incluye', href: '#incluye' },
  { id: 'rifa', label: 'Rifa', href: '#rifa' },
  { id: 'galeria', label: 'Galería', href: '#galeria' },
  { id: 'contacto', label: 'Contacto', href: '#contacto' }
];

export default function Navigation({ onRegisterClick, onExhibitorClick }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border" data-testid="navigation">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center" data-testid="logo">
              <span className="text-primary-foreground font-bold text-lg">E</span>
            </div>
            <span className="ml-3 font-serif text-xl font-bold text-foreground">
              Expo Empresarios
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.href)}
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
              variant="outline"
              onClick={onExhibitorClick}
              data-testid="button-exhibitor"
            >
              Ser Expositor
            </Button>
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
                  onClick={() => scrollToSection(item.href)}
                  className="text-left text-foreground hover:text-primary transition-colors py-2"
                  data-testid={`mobile-nav-link-${item.id}`}
                >
                  {item.label}
                </button>
              ))}
              <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={onExhibitorClick}
                  className="w-full"
                  data-testid="button-exhibitor-mobile"
                >
                  Ser Expositor
                </Button>
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