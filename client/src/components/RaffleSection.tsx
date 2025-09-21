import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Clock, Users, Award } from 'lucide-react';

interface RaffleSectionProps {
  onRegisterClick: () => void;
}

export default function RaffleSection({ onRegisterClick }: RaffleSectionProps) {
  const prizes = [
    "Set de amenidades premium para 50 habitaciones",
    "Kit de blancos (sábanas + toallas) estándar hotel",
    "Software PMS 3 meses (plan demo empresarial)",
    "Tarjeta regalo para capacitación de personal",
    "Paquete de limpieza y mantenimiento"
  ];

  const mechanics = [
    "1 boleto electrónico por registro confirmado",
    "Debes escanear tu pase a la entrada para activar tu boleto",
    "La rifa se realiza en el escenario principal a las 17:30",
    "El ganador debe estar presente o designar representante del hotel"
  ];

  return (
    <section id="rifa" className="py-16 md:py-24" data-testid="raffle-section">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Gift className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4" data-testid="raffle-title">
            Rifa oficial para asistentes registrados
          </h2>
          <p className="text-xl text-muted-foreground" data-testid="raffle-subtitle">
            Regístrate y asiste para participar
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Prizes */}
          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Premios disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {prizes.map((prize, index) => (
                  <li 
                    key={index} 
                    className="flex items-start gap-3"
                    data-testid={`prize-item-${index}`}
                  >
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{prize}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Mechanics */}
          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Mecánica de participación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {mechanics.map((mechanic, index) => (
                  <li 
                    key={index} 
                    className="flex items-start gap-3"
                    data-testid={`mechanic-item-${index}`}
                  >
                    <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></span>
                    <span>{mechanic}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Event Details */}
        <Card className="bg-primary/5 border-primary/20 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg" data-testid="raffle-datetime">
                2025-11-14 a las 17:30 (hora local)
              </span>
            </div>
            <p className="text-center text-sm text-muted-foreground" data-testid="raffle-disclaimer">
              Imágenes ilustrativas. Premios sujetos a disponibilidad de patrocinadores. Aplican términos.
            </p>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            size="lg"
            onClick={onRegisterClick}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg rounded-full"
            data-testid="button-register-raffle"
          >
            Registrarme para la rifa
          </Button>
        </div>
      </div>
    </section>
  );
}