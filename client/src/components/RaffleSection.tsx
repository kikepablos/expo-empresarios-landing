import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Clock, Users, Award } from 'lucide-react';

interface RaffleSectionProps {
  onRegisterClick: () => void;
}

export default function RaffleSection({ onRegisterClick }: RaffleSectionProps) {
  const prizes = [
    'Pantallas planas / Aires acondicionados',
    'Regalos sorpresa',
    'Viaje para dos personas con todo pagado',
    'Artículos premium aportados por los proveedores participantes',
    'Experiencias gastronómicas y degustaciones exclusivas'
  ];

  const mechanics = [
    "Registro confirmado y pase escaneado a la entrada para activar boleto",
    "Rifas esporádicas durante las 8 horas del evento para mantener a los invitados",
    "Al llegar, lo invitamos a recorrer los stands y descubrir las propuestas de nuestros expositores. Al finalizar su recorrido, podrá depositar su invitación en la tómbola como muestra de agradecimiento por su participación activa en la expo y su valioso apoyo a los patrocinadores que hacen posible este evento.",
    "Premios entregados únicamente a ejecutivos presentes"
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
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-semibold text-lg" data-testid="raffle-datetime">
                  Viernes 21 de noviembre 2025 · 17:30 h · Hotel Krystal Grand Los Cabos
                </span>
              </div>
              <p className="text-center text-sm text-muted-foreground" data-testid="raffle-disclaimer">
                Todos los premios son financiados por las aportaciones de los 16 proveedores participantes. La logística incluye banda en vivo, mariachi, DJ y show profesional para mantener a los ejecutivos durante todo el evento.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}