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
      label: 'Invitación especial a',
      desc: 'Todos nuestros invitados son líderes clave en la industria, con poder de decisión sobre compras, alianzas comerciales y tendencias culinarias en la región: Gerentes de Hoteles, Directores de Alimentos y Bebidas, Chefs Ejecutivos, Gerentes de Compra y Dueños de Restaurantes y Bares.'
    },
    {
      icon: 'mic',
      label: 'Degustaciones y demos',
      desc: 'Organiza presentaciones, catas y reuniones privadas con ejecutivos clave.'
    },
    {
      icon: 'handshake',
      label: 'Derecho para invitado',
      desc: 'Le invitamos a compartir esta experiencia con alguien clave en su entorno profesional: puede ser su asistente, un ejecutivo de su equipo o incluso un amigo personal con interés en el sector. Asistir en pareja o como equipo fortalece el networking, facilita la toma de decisiones y multiplica las oportunidades de negocio que esta expo ofrece a hoteles y restaurantes locales.'
    },
    {
      icon: 'wine',
      label: 'Gran fiesta de networking',
      desc: 'Banda en vivo, show profesional, mariachi, DJ y barra ilimitada durante 8 horas.'
    },
    {
      icon: 'gift',
      label: 'Rifas y regalos',
      desc: 'Televisiones, aires acondicionados, viajes y más incentivos para mantener al público.'
    },
    {
      icon: 'image',
      label: 'Cobertura y difusión',
      desc: 'Entrega personalizada de invitaciones y presencia constante ante la hotelería de Los Cabos.'
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

        {/* TODO: Eliminar botón de agenda y detalles de pago según solicitud del cliente */}
        {/* <div className="text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={onScrollToEvent}
            data-testid="button-view-agenda"
          >
            Solicitar agenda y detalles de pago
          </Button>
        </div> */}
      </div>
    </section>
  );
}