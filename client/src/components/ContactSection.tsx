import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ContactSection() {
  return (
    <section id="contacto" className="py-16 md:py-24" data-testid="contact-section">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4" data-testid="contact-title">
              Únete a la 12ª Expo Empresarios de la Baja
            </h2>
            <p className="text-xl text-muted-foreground" data-testid="contact-subtitle">
              Elige cómo deseas participar en este gran evento
            </p>
          </div>

          <Card className="bg-card border border-border shadow-xl">
            <div className="p-8 space-y-8">
              <div className="text-center space-y-4">
                <p className="text-lg text-muted-foreground">
                  Selecciona la opción que mejor se adapte a tus necesidades
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center space-y-4 p-6 border border-border rounded-lg hover:border-primary transition-colors">
                  <h3 className="font-serif text-2xl font-bold text-center">
                    Expositor
                  </h3>
                  <p className="text-center text-muted-foreground">
                    Muestra tus productos y servicios a cientos de empresarios
                  </p>
                  <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 w-full"
                    onClick={() => window.location.href = '/registro-expositor'}
                  >
                    Registrarme como expositor
                  </Button>
                </div>

                <div className="flex flex-col items-center space-y-4 p-6 border border-border rounded-lg hover:border-primary transition-colors">
                  <h3 className="font-serif text-2xl font-bold text-center">
                    Asistente
                  </h3>
                  <p className="text-center text-muted-foreground">
                    Descubre nuevas oportunidades y expande tu red de contactos
                  </p>
                  <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 w-full"
                    onClick={() => window.location.href = '/registro'}
                  >
                    Registrarme para la expo
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}