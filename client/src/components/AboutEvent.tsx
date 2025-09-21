import { Card } from '@/components/ui/card';

interface AboutEventProps {
  image: string;
}

export default function AboutEvent({ image }: AboutEventProps) {
  const highlights = [
    "Una vez al año · edición 2025",
    "Citas 1:1 entre compradores y proveedores",
    "Contenido curado para directivos hoteleros"
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
              ¿Qué es Expo Empresarios de La Baja?
            </h2>
            
            <div className="space-y-4 mb-8">
              <p className="text-lg leading-relaxed" data-testid="about-paragraph-1">
                Expo Empresarios de La Baja es el evento anual más grande de proveedores para hoteles en Baja California.
              </p>
              <p className="text-lg leading-relaxed" data-testid="about-paragraph-2">
                Aquí hoteleros encuentran nuevos proveedores, productos y soluciones para mejorar operación, experiencia del huésped y rentabilidad.
              </p>
              <p className="text-lg leading-relaxed" data-testid="about-paragraph-3">
                Durante un día, reunimos stands, conferencias, demos y espacios de networking de alto valor.
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