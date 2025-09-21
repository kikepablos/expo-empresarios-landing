import { Button } from '@/components/ui/button';
import { Facebook, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  const socialLinks = [
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' }
  ];

  const footerLinks = [
    { name: 'Aviso de Privacidad', href: '#' },
    { name: 'Términos', href: '#' },
    { name: 'Contacto', href: '#contacto' }
  ];

  const handleLinkClick = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    console.log('Footer link clicked:', href);
  };

  return (
    <footer className="bg-foreground text-background py-12" data-testid="footer">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* Logo */}
          <div className="flex items-center justify-center md:justify-start">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mr-4">
              <span className="text-primary-foreground font-bold text-2xl">E</span>
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-primary">
                Expo Empresarios
              </h3>
              <p className="text-sm text-background/80">de La Baja</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6">
            {footerLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleLinkClick(link.href)}
                className="text-background/80 hover:text-primary transition-colors text-sm"
                data-testid={`footer-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {link.name}
              </button>
            ))}
          </div>

          {/* Social Links */}
          <div className="flex justify-center md:justify-end space-x-4">
            {socialLinks.map((social) => {
              const IconComponent = social.icon;
              return (
                <Button
                  key={social.name}
                  variant="ghost"
                  size="icon"
                  onClick={() => handleLinkClick(social.href)}
                  className="text-background/80 hover:text-primary hover:bg-background/10"
                  data-testid={`social-link-${social.name.toLowerCase()}`}
                >
                  <IconComponent className="w-5 h-5" />
                </Button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-background/20 mt-8 pt-8 text-center">
          <p className="text-sm text-background/60" data-testid="footer-copyright">
            © 2012–2025 Expo Empresarios de La Baja. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}