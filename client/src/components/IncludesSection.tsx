import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, Mic, Handshake, Wine, Gift, Image } from 'lucide-react';

interface IncludeItem {
  icon: 'store' | 'mic' | 'handshake' | 'wine' | 'gift' | 'image';
  label: string;
  desc: string;
}

interface IncludesSectionProps {
  onScrollToEvent: () => void;
}

const iconMap = {
  store: Store,
  mic: Mic,
  handshake: Handshake,
  wine: Wine,
  gift: Gift,
  image: Image
};

export default function IncludesSection({ onScrollToEvent }: IncludesSectionProps) {
  const items: IncludeItem[] = [
    {
      icon: 'store',
      label: 'Zona de Expositores',
      desc: 'Marcas líderes con soluciones para todas las áreas del hotel.'
    },
    {
      icon: 'mic',
      label: 'Conferencias & Demos',
      desc: 'Tendencias, casos reales y tecnología aplicable.'
    },
    {
      icon: 'handshake',
      label: 'Rueda de Negocios 1:1',
      desc: 'Agenda citas con proveedores clave.'
    },
    {
      icon: 'wine',
      label: 'Networking VIP',
      desc: 'Cierre de día con contactos de alto impacto.'
    },
    {
      icon: 'gift',
      label: 'Rifa Oficial',
      desc: 'Participa por premios para tu hotel (ver detalles).'
    },
    {
      icon: 'image',
      label: 'Galería Histórica',
      desc: 'Revisa ediciones anteriores y casos de éxito.'
    }
  ];

  return (
    <section id="incluye" className="py-16 md:py-24 bg-muted" data-testid="includes-section">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4" data-testid="includes-title">
            Lo que incluye tu acceso
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {items.map((item, index) => {
            const IconComponent = iconMap[item.icon];
            return (
              <Card key={index} className="hover-elevate" data-testid={`includes-item-${index}`}>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2" data-testid={`includes-label-${index}`}>
                    {item.label}
                  </h3>
                  <p className="text-muted-foreground" data-testid={`includes-desc-${index}`}>
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={onScrollToEvent}
            data-testid="button-view-agenda"
          >
            Ver Agenda Preliminar
          </Button>
        </div>
      </div>
    </section>
  );
}