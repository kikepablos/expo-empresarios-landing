import { Card } from '@/components/ui/card';

interface AboutEventProps {
  image: string;
}

export default function AboutEvent({ image }: AboutEventProps) {
  const highlights = [
    "Viernes 21 de noviembre 2025 · Hotel Krystal Grand Los Cabos",
    "Participantes: 16 Proveedores · más de 600 ejecutivos invitados",
    "Con una inversión superior a $900,000 pesos, esta expo ha sido diseñada para brindar a más de 600 invitados del sector hotelero y restaurantero una experiencia de alto nivel. Reunimos lo mejor del mercado nacional e internacional en alimentos y bebidas, con el objetivo de impulsar la innovación, fortalecer relaciones comerciales y elevar los estándares de calidad en la región."
  ];

  return (
    <section id="evento" className="py-16 md:py-24" data-testid="about-event">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image - Desktop: Left, Mobile: Top */}
          <div className="order-2 lg:order-1">
            <img
              src={image}
              alt="Networking entre hoteleros y expositores"
              className="w-full h-64 md:h-80 lg:h-96 object-cover rounded-md"
              data-testid="about-image"
            />
          </div>

          {/* Content - Desktop: Right, Mobile: Bottom */}
          <div className="order-1 lg:order-2">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6" data-testid="about-title">
              12ª Expo Empresarios de la Baja 2025
            </h2>
            
            <div className="space-y-4 mb-8">
              <p className="text-lg leading-relaxed" data-testid="about-paragraph-1">
                Confirmamos el salón y la renta completa del Hotel Krystal Grand Los Cabos para recibir la edición número 12 de la Expo Empresarios de la Baja este viernes 21 de noviembre de 2025.
              </p>
              <p className="text-lg leading-relaxed" data-testid="about-paragraph-2">
                Solo 16 proveedores participarán para asegurar que los más de 600 directivos de hoteles y restaurantes tengan tiempo de calidad para conocer cada propuesta, agendar degustaciones y cerrar citas.
              </p>
              <p className="text-lg leading-relaxed" data-testid="about-paragraph-3">
                Desde 2012 la expo ha crecido de 50 a 550 asistentes en 2023 y este año proyectamos entre 500 y 600 ejecutivos. Es la mejor oportunidad para reforzar relaciones públicas, generar ventas y abrir puertas con hoteles que normalmente no reciben proveedores.
              </p>
            </div>

            <div className="space-y-3">
              {highlights.map((highlight, index) => (
                <Card key={index} className="p-4 border-l-4 border-l-primary bg-card/50" data-testid={`about-highlight-${index}`}>
                  <p className="font-medium text-foreground">{highlight}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}





